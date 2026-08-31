from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertSeverity
from app.models.project import Project


def _get_project_or_404(project_id: int, db: Session):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )


    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )


    return project



def create_high_risk_alert(
    project_id: int,
    risk_score: float,
    db: Session
):
    _get_project_or_404(project_id, db)

    alert = Alert(
        project_id=project_id,
        title="High Delay Risk Detected",
        message=(
            f"AI prediction indicates high delay risk ({risk_score:.1f}%). "
            "Review project schedule, resources, and mitigation actions."
        ),
        severity=AlertSeverity.HIGH,
        is_read=False,
    )

    db.add(alert)
    db.flush()

def create_assignment_alert(
    project_id: int,
    project_name: str,
    db: Session
):
    _get_project_or_404(project_id, db)

    alert = Alert(
        project_id=project_id,
        title="Project Assignment",
        message=(
            f"You have been assigned as the supervisor for project: {project_name}. "
            "Please review the project details and schedule."
        ),
        severity=AlertSeverity.MEDIUM,
        is_read=False,
    )

    db.add(alert)
    db.commit()



def list_project_alerts(
    project_id: int,
    db: Session
):
    _get_project_or_404(project_id, db)

    alerts = (
        db.query(Alert)
        .filter(Alert.project_id == project_id)
        .order_by(Alert.created_at.desc())
        .all()
    )

    return {"data": alerts}


def mark_alert_as_read(
    alert_id: int,
    db: Session
):
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    alert.is_read = True
    db.commit()
    db.refresh(alert)

    return alert
