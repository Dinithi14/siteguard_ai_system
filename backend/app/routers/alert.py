from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_verified_user
from app.models.user import User
from app.schemas.alert import AlertListResponse, AlertResponse
from app.services.alert_service import list_project_alerts, mark_alert_as_read


router = APIRouter()


@router.get(
	"/projects/{project_id}/alerts",
	response_model=AlertListResponse,
	summary="List Project Alerts",
	description="List warning alerts for one project.",
	operation_id="alerts_list_for_project"
)
def list_alerts(
	project_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user)
):
	return list_project_alerts(project_id, db)


@router.patch(
	"/alerts/{alert_id}/read",
	response_model=AlertResponse,
	summary="Mark Alert as Read",
	description="Mark one alert as read.",
	operation_id="alerts_mark_read"
)
def mark_read(
	alert_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user)
):
	return mark_alert_as_read(alert_id, db)
