from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.milestone import Milestone
from app.models.project import Project
from app.schemas.milestone import MilestoneCreateRequest, MilestoneUpdateRequest


def _get_project_or_404(
	project_id: int,
	db: Session
):
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


def _update_milestone_delay(milestone: Milestone):
	planned_end = milestone.planned_end_date
	actual_end = milestone.actual_end_date

	if actual_end:
		if actual_end > planned_end:
			milestone.delay_days = (actual_end - planned_end).days
		else:
			milestone.delay_days = 0
	elif milestone.status == "COMPLETED" or milestone.progress_percentage == 100:
		milestone.delay_days = 0
	else:
		from datetime import date
		today = date.today()
		if today > planned_end:
			milestone.delay_days = (today - planned_end).days
		else:
			milestone.delay_days = 0


def _handle_status_transitions(milestone: Milestone, old_status: str | None, new_status: str):
	from datetime import date
	today = date.today()

	if new_status == "IN_PROGRESS" and (old_status == "NOT_STARTED" or old_status is None):
		if not milestone.actual_start_date:
			milestone.actual_start_date = today

	if new_status == "COMPLETED":
		if not milestone.actual_end_date:
			milestone.actual_end_date = today
			milestone.actual_date = today
		if not milestone.actual_start_date:
			milestone.actual_start_date = milestone.planned_start_date
		milestone.progress_percentage = 100


def _validate_milestone_status_transition(current: str, new: str):
	if current == new:
		return
	if current == "COMPLETED" and new in ["NOT_STARTED", "DELAYED"]:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Completed milestones cannot transition back to NOT_STARTED or DELAYED."
		)


def create_milestone(
	project_id: int,
	data: MilestoneCreateRequest,
	db: Session
):
	_get_project_or_404(project_id, db)

	if data.progress_percentage < 0 or data.progress_percentage > 100:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="progress_percentage must be between 0 and 100"
		)

	milestone = Milestone(
		project_id=project_id,
		name=data.name,
		description=data.description,
		planned_date=data.planned_end_date,
		actual_date=None,
		planned_start_date=data.planned_start_date,
		planned_end_date=data.planned_end_date,
		actual_start_date=None,
		actual_end_date=None,
		progress_percentage=data.progress_percentage,
		status=data.status,
		priority=data.priority,
		sequence=data.sequence,
		responsible_id=data.responsible_id,
	)

	_handle_status_transitions(milestone, None, data.status)
	_update_milestone_delay(milestone)

	db.add(milestone)
	db.commit()
	db.refresh(milestone)

	return milestone


def list_project_milestones(
	project_id: int,
	db: Session
):
	_get_project_or_404(project_id, db)

	milestones = (
		db.query(Milestone)
		.filter(Milestone.project_id == project_id)
		.order_by(Milestone.sequence.asc(), Milestone.id.asc())
		.all()
	)

	return {"data": milestones}


def get_milestone_by_id(
	milestone_id: int,
	db: Session
):
	milestone = (
		db.query(Milestone)
		.filter(Milestone.id == milestone_id)
		.first()
	)

	if not milestone:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Milestone not found"
		)

	return milestone


def update_milestone(
	milestone_id: int,
	data: MilestoneUpdateRequest,
	db: Session
):
	milestone = get_milestone_by_id(milestone_id, db)
	old_status = milestone.status.value if hasattr(milestone.status, 'value') else milestone.status

	if data.name is not None:
		milestone.name = data.name
	if data.description is not None:
		milestone.description = data.description
	
	if data.planned_start_date is not None:
		milestone.planned_start_date = data.planned_start_date
	if data.planned_end_date is not None:
		milestone.planned_end_date = data.planned_end_date
		milestone.planned_date = data.planned_end_date
	
	if data.actual_start_date is not None:
		milestone.actual_start_date = data.actual_start_date
	if data.actual_end_date is not None:
		milestone.actual_end_date = data.actual_end_date
		milestone.actual_date = data.actual_end_date

	if data.progress_percentage is not None:
		if data.progress_percentage < 0 or data.progress_percentage > 100:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="progress_percentage must be between 0 and 100"
			)
		milestone.progress_percentage = data.progress_percentage
	
	if data.status is not None:
		_validate_milestone_status_transition(old_status, data.status)
		milestone.status = data.status
		_handle_status_transitions(milestone, old_status, data.status)
	elif milestone.progress_percentage == 100 and old_status != "COMPLETED":
		milestone.status = "COMPLETED"
		_handle_status_transitions(milestone, old_status, "COMPLETED")

	if data.priority is not None:
		milestone.priority = data.priority
	if data.sequence is not None:
		milestone.sequence = data.sequence
	if data.responsible_id is not None:
		milestone.responsible_id = data.responsible_id

	_update_milestone_delay(milestone)

	db.commit()
	db.refresh(milestone)

	return milestone


def delete_milestone(
	milestone_id: int,
	db: Session
):
	milestone = get_milestone_by_id(milestone_id, db)

	db.delete(milestone)
	db.commit()

	return {"message": "Milestone deleted successfully"}
