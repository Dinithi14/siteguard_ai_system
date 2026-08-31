from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.role import RoleCreateRequest, RoleResponse
from app.services.role_service import create_role


router = APIRouter()


@router.post(
    "/roles",
    response_model=RoleResponse
)
def create(
    data: RoleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return create_role(data, db)