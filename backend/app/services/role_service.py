from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.role import Role
from app.schemas.role import RoleCreateRequest


def create_role(
    data: RoleCreateRequest,
    db: Session
):
    # Check whether role already exists
    existing_role = (
        db.query(Role)
        .filter(Role.name == data.name)
        .first()
    )

    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Role '{data.name}' already exists"
        )

    role = Role(
        name=data.name
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return role