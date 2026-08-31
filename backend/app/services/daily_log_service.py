from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.daily_log import DailySiteLog
from app.models.project import Project
from app.models.user import User
from app.schemas.daily_log import DailySiteLogCreate, DailySiteLogUpdate


def _get_project_or_404(project_id: int, db: Session):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _get_log_or_404(log_id: int, db: Session):
    log = db.query(DailySiteLog).filter(DailySiteLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily site log not found")
    return log


def create_daily_log(
    project_id: int,
    data: DailySiteLogCreate,
    db: Session,
    current_user: User
):
    _get_project_or_404(project_id, db)
    
    # Optional check: duplicate date prevention if needed, but for now allow multiple or handle in UI
    
    new_log = DailySiteLog(
        project_id=project_id,
        created_by=current_user.id,
        **data.model_dump()
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


def list_project_daily_logs(
    project_id: int,
    db: Session
):
    _get_project_or_404(project_id, db)
    
    logs = (
        db.query(DailySiteLog)
        .filter(DailySiteLog.project_id == project_id)
        .order_by(DailySiteLog.log_date.desc())
        .all()
    )
    return {"data": logs}


def get_daily_log_by_id(
    log_id: int,
    db: Session
):
    log = _get_log_or_404(log_id, db)
    return log


def update_daily_log(
    log_id: int,
    data: DailySiteLogUpdate,
    db: Session,
    current_user: User
):
    log = _get_log_or_404(log_id, db)
    
    # Only creator or admin can update
    if log.created_by != current_user.id and current_user.role.name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(log, key, value)

    db.commit()
    db.refresh(log)
    return log


def delete_daily_log(
    log_id: int,
    db: Session,
    current_user: User
):
    log = _get_log_or_404(log_id, db)
    
    # Only creator or admin can delete
    if log.created_by != current_user.id and current_user.role.name != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
        
    db.delete(log)
    db.commit()
