from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_verified_user, require_admin
from app.models.user import User
from app.schemas.project import (
	ProjectCreateRequest,
	ProjectListResponse,
	ProjectResponse,
	ProjectUpdateRequest,
)
from app.services.project_service import (
	create_project,
	delete_project,
	get_project_by_id,
	list_projects,
	update_project,
)


router = APIRouter()


@router.post(
	"/",
	response_model=ProjectResponse,
	summary="Create Project",
	description="Create a new project. ADMIN only.",
	operation_id="projects_create"
)
def create(
	data: ProjectCreateRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_admin)
):
	try:
		return create_project(data, created_by=current_user.id, db=db)
	except HTTPException:
		db.rollback()
		raise
	except Exception as e:
		db.rollback()
		import traceback
		traceback.print_exc()
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=f"Database or Server Error: {str(e)}"
		)


@router.get(
	"/",
	response_model=ProjectListResponse,
	summary="List Projects",
	description="List available projects for authenticated users.",
	operation_id="projects_list"
)
def list_all(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user)
):
	return list_projects(db, current_user=current_user)


@router.get(
	"/{project_id}",
	response_model=ProjectResponse,
	summary="Get Project",
	description="Get one project by id.",
	operation_id="projects_get_by_id"
)
def get_by_id(
	project_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_verified_user)
):
	return get_project_by_id(project_id, db, current_user=current_user)


@router.patch(
	"/{project_id}",
	response_model=ProjectResponse,
	summary="Update Project",
	description="Update project details. ADMIN only.",
	operation_id="projects_update"
)
def update(
	project_id: int,
	data: ProjectUpdateRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_admin)
):
	return update_project(project_id, data, db)


@router.delete(
	"/{project_id}",
	summary="Delete Project",
	description="Delete project by id. ADMIN only.",
	operation_id="projects_delete"
)
def delete(
	project_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_admin)
):
	return delete_project(project_id, db)
