from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_verified_user
from app.models.user import User
from app.schemas.daily_log import (
    DailySiteLogCreate,
    DailySiteLogListResponse,
    DailySiteLogResponse,
    DailySiteLogUpdate,
)
from app.services import daily_log_service

router = APIRouter()


@router.post(
    "/projects/{project_id}/daily-logs",
    response_model=DailySiteLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Daily Site Log",
    operation_id="daily_logs_create"
)
def create_daily_log(
    project_id: int,
    data: DailySiteLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    return daily_log_service.create_daily_log(project_id, data, db, current_user)


@router.get(
    "/projects/{project_id}/daily-logs",
    response_model=DailySiteLogListResponse,
    summary="List Daily Site Logs for Project",
    operation_id="daily_logs_list"
)
def list_project_daily_logs(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    return daily_log_service.list_project_daily_logs(project_id, db)


@router.get(
    "/daily-logs/{log_id}",
    response_model=DailySiteLogResponse,
    summary="Get Daily Site Log",
    operation_id="daily_logs_get"
)
def get_daily_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    return daily_log_service.get_daily_log_by_id(log_id, db)


@router.patch(
    "/daily-logs/{log_id}",
    response_model=DailySiteLogResponse,
    summary="Update Daily Site Log",
    operation_id="daily_logs_update"
)
def update_daily_log(
    log_id: int,
    data: DailySiteLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    return daily_log_service.update_daily_log(log_id, data, db, current_user)


@router.delete(
    "/daily-logs/{log_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Daily Site Log",
    operation_id="daily_logs_delete"
)
def delete_daily_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    daily_log_service.delete_daily_log(log_id, db, current_user)
    return None
