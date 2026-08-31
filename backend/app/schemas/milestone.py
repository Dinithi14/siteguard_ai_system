from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.milestone import MilestoneStatus, MilestonePriority


class ResponsiblePersonResponse(BaseModel):
	id: int
	first_name: str
	last_name: str
	email: str


class MilestoneCreateRequest(BaseModel):
	name: str = Field(min_length=2, max_length=255)
	description: str | None = Field(default=None, max_length=5000)
	planned_start_date: date
	planned_end_date: date
	actual_start_date: date | None = None
	actual_end_date: date | None = None
	progress_percentage: int = Field(default=0, ge=0, le=100)
	status: MilestoneStatus = MilestoneStatus.NOT_STARTED
	priority: MilestonePriority = MilestonePriority.MEDIUM
	sequence: int = Field(default=1, ge=1)
	responsible_id: int | None = None


class MilestoneUpdateRequest(BaseModel):
	name: str | None = Field(default=None, min_length=2, max_length=255)
	description: str | None = Field(default=None, max_length=5000)
	planned_start_date: date | None = None
	planned_end_date: date | None = None
	actual_start_date: date | None = None
	actual_end_date: date | None = None
	progress_percentage: int | None = Field(default=None, ge=0, le=100)
	status: MilestoneStatus | None = None
	priority: MilestonePriority | None = None
	sequence: int | None = Field(default=None, ge=1)
	responsible_id: int | None = None


class MilestoneResponse(BaseModel):
	id: int
	project_id: int
	name: str
	description: str | None
	planned_start_date: date
	planned_end_date: date
	actual_start_date: date | None
	actual_end_date: date | None
	progress_percentage: int
	status: MilestoneStatus
	priority: MilestonePriority
	sequence: int
	delay_days: int
	responsible_id: int | None
	responsible: ResponsiblePersonResponse | None = None
	created_at: datetime
	updated_at: datetime
	planned_date: date
	actual_date: date | None = None


class MilestoneListResponse(BaseModel):
	data: list[MilestoneResponse]
