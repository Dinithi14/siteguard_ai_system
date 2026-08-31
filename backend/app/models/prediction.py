from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Prediction(Base):
	__tablename__ = "predictions"

	id: Mapped[int] = mapped_column(
		primary_key=True,
		index=True
	)

	project_id: Mapped[int] = mapped_column(
		ForeignKey("projects.id"),
		nullable=False,
		index=True
	)

	risk_score: Mapped[float] = mapped_column(
		Float,
		nullable=False
	)

	risk_level: Mapped[str] = mapped_column(
		String(20),
		nullable=False,
		index=True
	)

	estimated_delay_days: Mapped[int | None] = mapped_column(
		Integer,
		nullable=True
	)

	model_version: Mapped[str] = mapped_column(
		String(50),
		default="xgb-v1",
		nullable=False
	)

	input_snapshot: Mapped[dict] = mapped_column(
		JSON,
		nullable=False
	)

	created_at: Mapped[datetime] = mapped_column(
		DateTime,
		default=datetime.utcnow,
		nullable=False
	)

	project = relationship("Project")
