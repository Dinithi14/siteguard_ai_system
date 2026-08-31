from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.role import RoleName
from app.models.user import User
from app.schemas.project import ProjectCreateRequest, ProjectUpdateRequest


def _validate_project_dates(start_date, expected_end_date):
	if expected_end_date < start_date:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="expected_end_date must be greater than or equal to start_date"
		)


from app.services.auth_service import send_smtp_email
from app.services.alert_service import create_assignment_alert
import threading

def _notify_supervisor(project_id: int, project_name: str, supervisor_id: int, db: Session):
	supervisor = db.query(User).filter(User.id == supervisor_id).first()
	if not supervisor:
		return
	
	# Create internal alert
	create_assignment_alert(project_id, project_name, db)
	
	# Send email asynchronously to not block the request
	subject = "New Project Assignment"
	body = f"Hello {supervisor.first_name},\n\nYou have been assigned as the supervisor for the project '{project_name}'.\nPlease log in to SiteGuard AI to review the project details."
	
	def send_email():
		try:
			send_smtp_email(supervisor.email, subject, body)
		except Exception as e:
			print(f"Failed to send assignment email: {e}")
			
	threading.Thread(target=send_email).start()


def _serialize_project(project: Project) -> dict:
	supervisor_data = None
	if project.supervisor:
		supervisor_data = {
			"id": project.supervisor.id,
			"first_name": project.supervisor.first_name,
			"last_name": project.supervisor.last_name,
			"email": project.supervisor.email,
		}
	return {

		"id": project.id,
		"name": project.name,
		"description": project.description,
		"project_type": project.project_type,
		"location": project.location,
		"latitude": project.latitude,
		"longitude": project.longitude,
		"client_name": project.client_name,
		"budget": project.budget,
		"labourers_count": project.labourers_count,
		"start_date": project.start_date,
		"expected_end_date": project.expected_end_date,
		"status": project.status,
		"created_by": project.created_by,
		"supervisor_id": project.supervisor_id,
		"supervisor": supervisor_data,
		"created_at": project.created_at,
		"updated_at": project.updated_at,
		
	}


def create_project(
	data: ProjectCreateRequest,
	created_by: int,
	db: Session
):
	_validate_project_dates(data.start_date, data.expected_end_date)

	valid_supervisor_id = None
	if data.supervisor_id:
		supervisor = db.query(User).filter(User.id == data.supervisor_id).first()
		if supervisor:
			valid_supervisor_id = supervisor.id

	project = Project(
		name=data.name,
		description=data.description,
		project_type=data.project_type,
		location=data.location,
		latitude=data.latitude,
		longitude=data.longitude,
		client_name=data.client_name,
		budget=data.budget,
		labourers_count=data.labourers_count,
		start_date=data.start_date,
		expected_end_date=data.expected_end_date,
		status=data.status,
		created_by=created_by,
		supervisor_id=valid_supervisor_id,
	)

	db.add(project)
	db.commit()
	db.refresh(project)

	if project.supervisor_id:
		_notify_supervisor(project.id, project.name, project.supervisor_id, db)

	return _serialize_project(project)


def list_projects(db: Session, current_user: User = None):
	query = db.query(Project)

	if current_user and current_user.role and current_user.role.name != RoleName.ADMIN:
		query = query.filter(Project.supervisor_id == current_user.id)

	projects = (
		query
		.order_by(Project.created_at.desc())
		.all()
	)

	return {"data": projects}


def get_project_by_id(
	project_id: int,
	db: Session,
	current_user: User = None
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

	if current_user and current_user.role and current_user.role.name != RoleName.ADMIN:
		if project.supervisor_id != current_user.id:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="You do not have access to this project"
			)

	return project


def update_project(
	project_id: int,
	data: ProjectUpdateRequest,
	db: Session
):

	project = get_project_by_id(project_id, db)

	next_start_date = data.start_date if data.start_date is not None else project.start_date
	next_end_date = data.expected_end_date if data.expected_end_date is not None else project.expected_end_date
	_validate_project_dates(next_start_date, next_end_date)

	if data.name is not None:
		project.name = data.name
	if data.description is not None:
		project.description = data.description
	if data.project_type is not None:
		project.project_type = data.project_type
	if data.location is not None:
		project.location = data.location
	if data.latitude is not None:
		project.latitude = data.latitude
	if data.longitude is not None:
		project.longitude = data.longitude
	if data.client_name is not None:
		project.client_name = data.client_name
	if data.budget is not None:
		project.budget = data.budget
	if data.start_date is not None:
		project.start_date = data.start_date
	if data.expected_end_date is not None:
		project.expected_end_date = data.expected_end_date
	if data.status is not None and data.status != project.status:
		current_status = project.status
		new_status = data.status
		if current_status == "PLANNED" and new_status != "ACTIVE":
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Planned projects can only transition to ACTIVE."
			)
		if current_status == "ACTIVE" and new_status not in ["ON_HOLD", "COMPLETED"]:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Active projects can only transition to ON_HOLD or COMPLETED."
			)
		if current_status == "ON_HOLD" and new_status != "ACTIVE":
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Projects on hold can only transition back to ACTIVE."
			)
		if current_status == "COMPLETED" and new_status != "ARCHIVED":
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Completed projects can only transition to ARCHIVED."
			)
		if current_status == "ARCHIVED":
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Archived projects cannot change status."
			)
		project.status = new_status
		
	old_supervisor_id = project.supervisor_id
	if data.supervisor_id is not None:
		project.supervisor_id = data.supervisor_id

	db.commit()
	db.refresh(project)

	if data.supervisor_id is not None and data.supervisor_id != old_supervisor_id:
		_notify_supervisor(project.id, project.name, project.supervisor_id, db)

	return _serialize_project(project)


def delete_project(
	project_id: int,
	db: Session
):
	project = get_project_by_id(project_id, db)

	db.delete(project)
	db.commit()

	return {"message": "Project deleted successfully"}
