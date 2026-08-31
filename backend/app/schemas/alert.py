from datetime import datetime

from pydantic import BaseModel

from app.models.alert import AlertSeverity


class AlertResponse(BaseModel):
	id: int
	project_id: int
	title: str
	message: str
	severity: AlertSeverity
	is_read: bool
	created_at: datetime


class AlertListResponse(BaseModel):
	data: list[AlertResponse]
