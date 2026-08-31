from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_verified_user
from app.models.alert import Alert, AlertSeverity
from app.models.milestone import Milestone, MilestoneStatus
from app.models.prediction import Prediction
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.models.role import RoleName


router = APIRouter()


def _prediction_item(prediction: Prediction) -> dict:
	return {
		"id": prediction.id,
		"project_id": prediction.project_id,
		"project_name": prediction.project.name,
		"risk_score": round(prediction.risk_score, 2),
		"risk_level": prediction.risk_level,
		"estimated_delay_days": prediction.estimated_delay_days,
		"created_at": prediction.created_at,
	}


@router.get("/analytics/overview", summary="Get Dashboard Overview")
def overview(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user),
):
	project_query = db.query(Project)
	prediction_query = db.query(Prediction).join(Project)
	alert_query = db.query(Alert).join(Project)

	if current_user and current_user.role and current_user.role.name != RoleName.ADMIN:
		project_query = project_query.filter(Project.supervisor_id == current_user.id)
		prediction_query = prediction_query.filter(Project.supervisor_id == current_user.id)
		alert_query = alert_query.filter(Project.supervisor_id == current_user.id)

	projects = project_query.all()
	predictions = prediction_query.order_by(Prediction.created_at.desc()).all()
	alerts = alert_query.order_by(Alert.created_at.desc()).all()

	latest_by_project = {}
	for prediction in predictions:
		latest_by_project.setdefault(prediction.project_id, prediction)

	risk_distribution = {"low": 0, "medium": 0, "high": 0}
	for prediction in latest_by_project.values():
		level = prediction.risk_level.lower()
		if level in risk_distribution:
			risk_distribution[level] += 1

	average_risk = (
		sum(prediction.risk_score for prediction in latest_by_project.values())
		/ len(latest_by_project)
		if latest_by_project
		else 0
	)

	return {
		"total_users": db.query(User).count(),
		"total_projects": len(projects),
		"active_projects": sum(project.status == ProjectStatus.ACTIVE for project in projects),
		"completed_projects": sum(project.status == ProjectStatus.COMPLETED for project in projects),
		"high_risk_projects": risk_distribution["high"],
		"total_predictions": len(predictions),
		"average_risk_score": round(average_risk, 2),
		"total_alerts": len(alerts),
		"unread_alerts": sum(not alert.is_read for alert in alerts),
		"risk_distribution": risk_distribution,
		"recent_alerts": [
			{
				"id": alert.id,
				"project_id": alert.project_id,
				"project_name": alert.project.name,
				"title": alert.title,
				"message": alert.message,
				"severity": alert.severity.value,
				"is_read": alert.is_read,
				"created_at": alert.created_at,
			}
			for alert in alerts[:5]
		],
		"recent_predictions": [_prediction_item(prediction) for prediction in predictions[:10]],
	}


@router.get("/projects/{project_id}/analytics", summary="Get Project Analytics")
def project_analytics(
	project_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user),
):
	project = db.query(Project).filter(Project.id == project_id).first()
	if not project:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

	milestones = db.query(Milestone).filter(Milestone.project_id == project_id).all()
	predictions = (
		db.query(Prediction)
		.filter(Prediction.project_id == project_id)
		.order_by(Prediction.created_at.asc())
		.all()
	)
	alerts = db.query(Alert).filter(Alert.project_id == project_id).all()

	latest_prediction = predictions[-1] if predictions else None
	total_milestones = len(milestones)
	overall_progress = (
		round(sum(milestone.progress_percentage for milestone in milestones) / total_milestones)
		if total_milestones
		else 0
	)

	return {
		"project_id": project.id,
		"project_name": project.name,
		"latest_risk_score": round(latest_prediction.risk_score, 2) if latest_prediction else None,
		"latest_risk_level": latest_prediction.risk_level if latest_prediction else None,
		"latest_estimated_delay_days": latest_prediction.estimated_delay_days if latest_prediction else None,
		"total_alerts": len(alerts),
		"unread_alerts": sum(not alert.is_read for alert in alerts),
		"risk_trend": [
			{
				"risk_score": round(prediction.risk_score, 2),
				"risk_level": prediction.risk_level,
				"created_at": prediction.created_at,
			}
			for prediction in predictions
		],
		"milestones": {
			"total": total_milestones,
			"completed": sum(milestone.status == MilestoneStatus.COMPLETED for milestone in milestones),
			"in_progress": sum(milestone.status == MilestoneStatus.IN_PROGRESS for milestone in milestones),
			"not_started": sum(milestone.status == MilestoneStatus.NOT_STARTED for milestone in milestones),
			"delayed": sum(milestone.status == MilestoneStatus.DELAYED for milestone in milestones),
			"overall_progress": overall_progress,
		},
	}
