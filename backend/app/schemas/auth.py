from pydantic import BaseModel, EmailStr, Field

from app.models.role import RoleName


class RegisterRequest(BaseModel):

    first_name: str = Field(
        min_length=2,
        max_length=100,
        description="First name must be between 2 and 100 characters",
        examples=["Dinithi"]
    )

    last_name: str = Field(
        min_length=2,
        max_length=100,
        description="Last name must be between 2 and 100 characters",
        examples=["Dulani"]
    )

    email: EmailStr = Field(
        description="Valid email address",
        examples=["dinithi@gmail.com"]
    )

    password: str = Field(
        min_length=8,
        max_length=128,
        description="Password must be between 8 and 128 characters",
        examples=["Password123"]
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "first_name": "Dinithi",
                "last_name": "Dulani",
                "email": "dinithi@gmail.com",
                "password": "Password123"
            }
        }
    }


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):

    email: EmailStr = Field(
        description="Registered email address",
        examples=["dinithi@gmail.com"]
    )

    password: str = Field(
        min_length=8,
        max_length=128,
        description="Account password",
        examples=["Password123"]
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "dinithi@gmail.com",
                "password": "Password123"
            }
        }
    }


class LoginResponse(BaseModel):

    access_token: str = Field(
        description="JWT access token"
    )

    token_type: str = Field(
        default="bearer",
        description="Authentication token type"
    )


class MeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: RoleName
    is_verified: bool
    is_blocked: bool
    is_active: bool
    must_change_password: bool


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class LogoutResponse(BaseModel):
    message: str = Field(
        default="Logged out successfully"
    )