from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_verified_user, require_admin
from app.models.user import User
from app.schemas.milestone import (
	MilestoneCreateRequest,
	MilestoneListResponse,
	MilestoneResponse,
	MilestoneUpdateRequest,
)
from app.services.milestone_service import (
	create_milestone,
	delete_milestone,
	get_milestone_by_id,
	list_project_milestones,
	update_milestone,
)


router = APIRouter()


@router.post(
	"/projects/{project_id}/milestones",
	response_model=MilestoneResponse,
	summary="Create Milestone",
	description="Create a milestone under a project.",
	operation_id="milestones_create"
)
def create(
	project_id: int,
	data: MilestoneCreateRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user)
):
	return create_milestone(project_id, data, db)


@router.get(
	"/projects/{project_id}/milestones",
	response_model=MilestoneListResponse,
	summary="List Project Milestones",
	description="List milestones for a project.",
	operation_id="milestones_list_by_project"
)
def list_by_project(
	project_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user)
):
	return list_project_milestones(project_id, db)


@router.get(
	"/milestones/{milestone_id}",
	response_model=MilestoneResponse,
	summary="Get Milestone",
	description="Get one milestone by id.",
	operation_id="milestones_get_by_id"
)
def get_by_id(
	milestone_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user)
):
	return get_milestone_by_id(milestone_id, db)


@router.patch(
	"/milestones/{milestone_id}",
	response_model=MilestoneResponse,
	summary="Update Milestone",
	description="Update milestone details and progress.",
	operation_id="milestones_update"
)
def update(
	milestone_id: int,
	data: MilestoneUpdateRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user)
):
	return update_milestone(milestone_id, data, db)


@router.delete(
	"/milestones/{milestone_id}",
	summary="Delete Milestone",
	description="Delete a milestone. ADMIN only.",
	operation_id="milestones_delete"
)
def delete(
	milestone_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_admin)
):
	return delete_milestone(milestone_id, db)
