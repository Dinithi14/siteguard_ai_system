from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.project import ProjectStatus


class ProjectCreateRequest(BaseModel):
	name: str = Field(min_length=2, max_length=255)
	description: str | None = Field(default=None, max_length=5000)
	project_type: str = Field(min_length=2, max_length=100)
	location: str = Field(min_length=2, max_length=255)
	latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
	longitude: float | None = Field(default=None, ge=-180.0, le=180.0)
	client_name: str | None = Field(default=None, max_length=255)
	budget: Decimal = Field(gt=0)
	labourers_count: int = Field(..., gt=0, description="Number of labourers required for the project")
	start_date: date
	expected_end_date: date
	status: ProjectStatus = ProjectStatus.PLANNED
	supervisor_id: int | None = Field(default=None, description="Assigned Project Supervisor (User)")


class ProjectUpdateRequest(BaseModel):
	name: str | None = Field(default=None, min_length=2, max_length=255)
	description: str | None = Field(default=None, max_length=5000)
	project_type: str | None = Field(default=None, min_length=2, max_length=100)
	location: str | None = Field(default=None, min_length=2, max_length=255)
	latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
	longitude: float | None = Field(default=None, ge=-180.0, le=180.0)
	client_name: str | None = Field(default=None, max_length=255)
	budget: Decimal | None = Field(default=None, gt=0)
	labourers_count: int | None = Field(default=None, gt=0)
	start_date: date | None = None
	expected_end_date: date | None = None
	status: ProjectStatus | None = None
	supervisor_id: int | None = Field(default=None, description="Assigned Project Supervisor (User)")


class SupervisorResponse(BaseModel):
	id: int
	first_name: str
	last_name: str
	email: str

	model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
	id: int
	name: str
	description: str | None
	project_type: str
	location: str
	latitude: float | None = None
	longitude: float | None = None
	client_name: str | None
	budget: Decimal
	labourers_count: int | None = None
	start_date: date
	expected_end_date: date
	status: ProjectStatus
	created_by: int
	supervisor_id: int | None = None
	supervisor: SupervisorResponse | None = None
	created_at: datetime
	updated_at: datetime

	model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
	data: list[ProjectResponse]
