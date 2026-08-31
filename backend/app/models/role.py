from enum import Enum

from sqlalchemy import String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RoleName(str, Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[RoleName] = mapped_column(
        SQLEnum(RoleName),
        unique=True,
        nullable=False
    )

    users = relationship(
        "User",
        back_populates="role"
    )