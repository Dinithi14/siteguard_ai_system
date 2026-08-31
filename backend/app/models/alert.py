from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AlertSeverity(str, Enum):
	LOW = "LOW"
	MEDIUM = "MEDIUM"
	HIGH = "HIGH"


class Alert(Base):
	__tablename__ = "alerts"

	id: Mapped[int] = mapped_column(
		primary_key=True,
		index=True
	)

	project_id: Mapped[int] = mapped_column(
		ForeignKey("projects.id"),
		nullable=False,
		index=True
	)

	title: Mapped[str] = mapped_column(
		String(255),
		nullable=False
	)

	message: Mapped[str] = mapped_column(
		Text,
		nullable=False
	)

	severity: Mapped[AlertSeverity] = mapped_column(
		SQLEnum(AlertSeverity),
		default=AlertSeverity.MEDIUM,
		nullable=False,
		index=True
	)

	is_read: Mapped[bool] = mapped_column(
		Boolean,
		default=False,
		nullable=False
	)

	created_at: Mapped[datetime] = mapped_column(
		DateTime,
		default=datetime.utcnow,
		nullable=False
	)

	project = relationship("Project")
