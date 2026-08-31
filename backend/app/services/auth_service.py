from datetime import datetime, timedelta
from email.message import EmailMessage
import secrets
import smtplib

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.role import RoleName
from app.models.user import User
from app.models.role import Role
from app.models.email_verification import EmailVerification

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ChangePasswordRequest,
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.core.config import settings


def _serialize_user(user: User) -> dict:
    role_value = RoleName.USER
    if user.role and user.role.name:
        role_value = user.role.name

    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": role_value,
        "is_verified": user.is_verified,
        "is_blocked": user.is_blocked,
        "is_active": user.is_active,
        "must_change_password": user.must_change_password,
    }


def register_user(
    data: RegisterRequest,
    db: Session
):
    # 1. Check whether email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # 2. Get user count
    user_count = db.query(User).count()

    # 3. Select role
    if user_count == 0:
        role_name = "ADMIN"
    else:
        role_name = "USER"

    user_role = (
        db.query(Role)
        .filter(Role.name == role_name)
        .first()
    )

    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{role_name} role not found"
        )

    # 4. Hash password
    password_hash = hash_password(data.password)

    # 5. Create user
    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        password_hash=password_hash,

        # SQLAlchemy relationship
        role=user_role,

        is_verified=False,
        is_blocked=False,
        is_active=True,
    )

    # 6. Save user
    db.add(user)
    db.commit()
    db.refresh(user)

    send_verification_code(user, db)

    return _serialize_user(user)


def send_verification_code(user: User, db: Session):
    code = _generate_otp(user, db)
    send_smtp_email(
        to_email=user.email,
        subject="Your SiteGuard AI verification code",
        body=(
            f"Your SiteGuard AI verification code is {code}. "
            f"It expires in {settings.EMAIL_OTP_EXPIRE_MINUTES} minutes."
        ),
    )


def send_admin_created_user_email(user: User, temp_password: str, db: Session):
    code = _generate_otp(user, db)
    send_smtp_email(
        to_email=user.email,
        subject="Your SiteGuard AI account was created",
        body=(
            f"An administrator created a SiteGuard AI account for you.\n\n"
            f"Email: {user.email}\n"
            f"Temporary password: {temp_password}\n\n"
            f"Verification code: {code} (expires in {settings.EMAIL_OTP_EXPIRE_MINUTES} minutes)\n\n"
            f"Next steps:\n"
            f"1. Open the Verify Email page and enter the verification code above.\n"
            f"2. Sign in using your email and the temporary password.\n"
            f"3. You will be asked to set a new password before you can continue."
        ),
    )


def _generate_otp(user: User, db: Session) -> str:
    code = f"{secrets.randbelow(1000000):06d}"
    expires_at = datetime.utcnow() + timedelta(minutes=settings.EMAIL_OTP_EXPIRE_MINUTES)
    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.used.is_(False),
    ).update({"used": True}, synchronize_session=False)
    db.add(EmailVerification(user_id=user.id, code=code, expires_at=expires_at))
    db.commit()
    return code


def send_smtp_email(to_email: str, subject: str, body: str):
    if not all((settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_FROM_EMAIL)):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured. Set SMTP settings in backend/.env.",
        )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send verification email. Please try again.",
        ) from exc


def verify_email(email: str, otp: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification request")

    verification = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    if user.is_verified or not verification or verification.used:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification request")
    if verification.expires_at < datetime.utcnow() or verification.code != otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

    verification.used = True
    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully. You can now sign in."}


def resend_verification(email: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    if user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified")
    send_verification_code(user, db)
    return {"message": "A new verification code was sent."}




def login_user(
    data: LoginRequest,
    db: Session
):
    # 1. Find user
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 2. Verify password
    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 3. Check blocked
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is blocked"
        )

    # 4. Check active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in"
        )

    # 5. Get role
    role_name = user.role.name if user.role else None

    # 6. Create JWT
    access_token = create_access_token(
        user_id=user.id,
        role=role_name
    )

    # 7. Return token
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


def get_me(
    current_user: User
):
    return _serialize_user(current_user)


def logout_user():
    # Stateless JWT logout. Client must remove token.
    return {
        "message": "Logged out successfully"
    }


def change_password(
    current_user: User,
    data: ChangePasswordRequest,
    db: Session,
):
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match",
        )

    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    current_user.password_hash = hash_password(data.new_password)
    current_user.must_change_password = False
    db.commit()

    return {"message": "Password changed successfully."}


def skip_password_change(
    current_user: User,
    db: Session,
):
    current_user.must_change_password = False
    db.commit()

    return {"message": "You can continue using your current password."}