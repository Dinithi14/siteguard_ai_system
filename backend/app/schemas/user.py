from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.role import RoleName


class AdminCreateUserRequest(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    role_id: int = Field(default=2, ge=1)


class UpdateUserRequest(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
        examples=["Dilantha"]
    )

    last_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
        examples=["Nayanajith"]
    )


class AdminUpdateUserRequest(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    last_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    email: EmailStr | None = None

    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128
    )

    role_id: int | None = None

    is_verified: bool | None = None
    is_blocked: bool | None = None
    is_active: bool | None = None


class UserListQuery(BaseModel):
    search: str | None = Field(
        default=None,
        description="Search by first name, last name or email"
    )

    is_verified: bool | None = Field(
        default=None,
        description="Filter by verification status"
    )

    is_blocked: bool | None = Field(
        default=None,
        description="Filter by blocked status"
    )

    is_active: bool | None = Field(
        default=None,
        description="Filter by active status"
    )

    page: int = Field(
        default=1,
        ge=1,
        description="Page number"
    )

    limit: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of users per page"
    )


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: RoleName
    is_verified: bool
    is_blocked: bool
    is_active: bool
    must_change_password: bool
    created_at: datetime


class UserListPagination(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class UserListResponse(BaseModel):
    data: list[UserResponse]
    pagination: UserListPagination


    