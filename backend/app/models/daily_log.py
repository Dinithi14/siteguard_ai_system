from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DailySiteLog(Base):
    __tablename__ = "daily_logs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"),
        nullable=False,
        index=True
    )

    log_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )

    weather_condition: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    labour_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    material_availability: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    work_completed: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    issues_encountered: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    project = relationship("Project", foreign_keys=[project_id])
    creator = relationship("User", foreign_keys=[created_by])
