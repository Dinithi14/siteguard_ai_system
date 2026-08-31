from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_verified_user, require_admin
from app.models.role import RoleName
from app.models.user import User

from app.schemas.user import (
    AdminCreateUserRequest,
    UpdateUserRequest,
    AdminUpdateUserRequest,
    UserListQuery,
    UserResponse,
    UserListResponse,

)

from app.services.user_service import (
    create_user_by_admin,
    update_user,
    admin_update_user,
    delete_user,
    get_all_users,
    get_user_by_id,
)


router = APIRouter()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=201,
    summary="Create User",
    description="Create a user account. ADMIN only.",
    operation_id="users_create",
)
def create(
    data: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return create_user_by_admin(data, db)


@router.get(
    "/",
    response_model=UserListResponse,
    summary="List Users",
    description="List users. ADMIN only.",
    operation_id="users_list"
)
def get_users(
    filters: UserListQuery = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return get_all_users(
        db=db,
        search=filters.search,
        is_verified=filters.is_verified,
        is_blocked=filters.is_blocked,
        is_active=filters.is_active,
        page=filters.page,
        limit=filters.limit,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get User",
    description="Get user details. ADMIN can view any user; USER can view own profile.",
    operation_id="users_get_by_id"
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    if current_user.role and current_user.role.name == RoleName.ADMIN:
        return get_user_by_id(user_id, db)

    if current_user.id != user_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile"
        )

    return get_user_by_id(user_id, db)


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update User",
    description="Update user basic details. ADMIN can update any user; USER can update own profile.",
    operation_id="users_update"
)
def update(
    user_id: int,
    data: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    if current_user.role and current_user.role.name != RoleName.ADMIN and current_user.id != user_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )

    return update_user(
        user_id,
        data,
        db
    )


@router.patch(
    "/{user_id}/admin",
    response_model=UserResponse,
    summary="Admin Update User",
    description="Admin-only endpoint to update user email, role and account flags.",
    operation_id="users_admin_update"
)
def admin_update(
    user_id: int,
    data: AdminUpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if user_id == current_user.id and (
        data.is_active is False
        or data.is_blocked is True
        or (data.role_id is not None and data.role_id != current_user.role_id)
    ):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate, block or change the role of your own account"
        )

    return admin_update_user(
        user_id,
        data,
        db
    )


@router.delete(
    "/{user_id}",
    summary="Delete User",
    description="Delete user account. ADMIN only.",
    operation_id="users_delete"
)
def delete(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if user_id == current_user.id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    return delete_user(
        user_id,
        db
    )


