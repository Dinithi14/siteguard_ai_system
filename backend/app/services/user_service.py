from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from math import ceil

from app.models.user import User
from app.models.role import RoleName
from app.models.email_verification import EmailVerification
from app.models.project import Project
from app.schemas.user import (
    AdminCreateUserRequest,
    UpdateUserRequest,
    AdminUpdateUserRequest,
)
from app.core.security import hash_password, generate_temp_password


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
        "created_at": user.created_at,
    }


def get_user_by_id(
    user_id: int,
    db: Session
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return _serialize_user(user)


def create_user_by_admin(
    data: AdminCreateUserRequest,
    db: Session,
):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    from app.models.role import Role

    role = db.query(Role).filter(Role.id == data.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role",
        )

    temp_password = generate_temp_password()

    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        password_hash=hash_password(temp_password),
        role=role,
        is_verified=False,
        is_blocked=False,
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    from app.services.auth_service import send_admin_created_user_email
    send_admin_created_user_email(user, temp_password, db)

    return _serialize_user(user)


def update_user(
    user_id: int,
    data: UpdateUserRequest,
    db: Session
):
    # 1. Find user
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 2. Update only provided fields
    if data.first_name is not None:
        user.first_name = data.first_name

    if data.last_name is not None:
        user.last_name = data.last_name

    # 3. Save changes
    db.commit()
    db.refresh(user)

    return _serialize_user(user)


def admin_update_user(
    user_id: int,
    data: AdminUpdateUserRequest,
    db: Session
):
    # 1. Find user
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 2. Update basic information
    if data.first_name is not None:
        user.first_name = data.first_name

    if data.last_name is not None:
        user.last_name = data.last_name

    # 3. Update email
    if data.email is not None:

        existing_user = (
            db.query(User)
            .filter(
                User.email == data.email,
                User.id != user_id
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        user.email = data.email

    # 4. Update password
    if data.password is not None:
        user.password_hash = hash_password(
            data.password
        )

    # 5. Update role
    if data.role_id is not None:
        user.role_id = data.role_id

    # 6. Update account status
    if data.is_verified is not None:
        user.is_verified = data.is_verified

    if data.is_blocked is not None:
        user.is_blocked = data.is_blocked

    if data.is_active is not None:
        user.is_active = data.is_active

    # 7. Save changes
    db.commit()
    db.refresh(user)

    return _serialize_user(user)


def delete_user(
    user_id: int,
    db: Session
):
    # 1. Find user
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if db.query(Project).filter(Project.created_by == user_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user owns projects and cannot be deleted"
        )

    db.query(EmailVerification).filter(
        EmailVerification.user_id == user_id
    ).delete(synchronize_session=False)

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }



def get_all_users(
    db: Session,
    search: str | None = None,
    is_verified: bool | None = None,
    is_blocked: bool | None = None,
    is_active: bool | None = None,
    page: int = 1,
    limit: int = 10,
):
    query = db.query(User)

    # Search by first name, last name or email
    if search:
        search_value = f"%{search}%"

        query = query.filter(
            or_(
                User.first_name.ilike(search_value),
                User.last_name.ilike(search_value),
                User.email.ilike(search_value),
            )
        )

    # Filters
    if is_verified is not None:
        query = query.filter(
            User.is_verified == is_verified
        )

    if is_blocked is not None:
        query = query.filter(
            User.is_blocked == is_blocked
        )

    if is_active is not None:
        query = query.filter(
            User.is_active == is_active
        )

    # Total records after filters
    total = query.count()

    # Pagination
    offset = (page - 1) * limit

    users = (
        query
        .order_by(User.id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = ceil(total / limit) if total > 0 else 0

    return {
        "data": [_serialize_user(user) for user in users],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        }
    }