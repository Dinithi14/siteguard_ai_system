from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MilestonePriority(str, Enum):
	LOW = "LOW"
	MEDIUM = "MEDIUM"
	HIGH = "HIGH"
	CRITICAL = "CRITICAL"


class MilestoneStatus(str, Enum):
	NOT_STARTED = "NOT_STARTED"
	IN_PROGRESS = "IN_PROGRESS"
	DELAYED = "DELAYED"
	BLOCKED = "BLOCKED"
	COMPLETED = "COMPLETED"
	CANCELLED = "CANCELLED"


class Milestone(Base):
	__tablename__ = "milestones"

	id: Mapped[int] = mapped_column(
		primary_key=True,
		index=True
	)

	project_id: Mapped[int] = mapped_column(
		ForeignKey("projects.id"),
		nullable=False,
		index=True
	)

	name: Mapped[str] = mapped_column(
		String(255),
		nullable=False
	)

	description: Mapped[str | None] = mapped_column(
		Text,
		nullable=True
	)

	planned_date: Mapped[date] = mapped_column(
		Date,
		nullable=False
	)

	actual_date: Mapped[date | None] = mapped_column(
		Date,
		nullable=True
	)

	planned_start_date: Mapped[date] = mapped_column(
		Date,
		nullable=False
	)

	planned_end_date: Mapped[date] = mapped_column(
		Date,
		nullable=False
	)

	actual_start_date: Mapped[date | None] = mapped_column(
		Date,
		nullable=True
	)

	actual_end_date: Mapped[date | None] = mapped_column(
		Date,
		nullable=True
	)

	progress_percentage: Mapped[int] = mapped_column(
		Integer,
		default=0,
		nullable=False
	)

	status: Mapped[MilestoneStatus] = mapped_column(
		SQLEnum(MilestoneStatus),
		default=MilestoneStatus.NOT_STARTED,
		nullable=False
	)

	priority: Mapped[MilestonePriority] = mapped_column(
		SQLEnum(MilestonePriority),
		default=MilestonePriority.MEDIUM,
		nullable=False
	)

	sequence: Mapped[int] = mapped_column(
		Integer,
		default=1,
		nullable=False
	)

	delay_days: Mapped[int] = mapped_column(
		Integer,
		default=0,
		nullable=False
	)

	responsible_id: Mapped[int | None] = mapped_column(
		ForeignKey("users.id"),
		nullable=True,
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

	project = relationship("Project")
	responsible = relationship("User")
