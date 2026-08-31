from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine

from app.models.user import User
from app.models.role import Role, RoleName
from app.models.project import Project
from app.models.milestone import Milestone
from app.models.prediction import Prediction
from app.models.alert import Alert
from app.models.email_verification import EmailVerification
from app.models.daily_log import DailySiteLog

from app.routers import analytics, auth, role, user, projects, milestones, predictions, alert, daily_logs

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse

app = FastAPI(
    title=settings.APP_NAME
)


@app.exception_handler(ResponseValidationError)
async def response_validation_handler(request: Request, exc: ResponseValidationError):
    import traceback
    traceback.print_exc()
    error_msg = str(exc.errors())
    print(f"❌ ResponseValidationError: {error_msg}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"ResponseValidationError: {error_msg}"}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    print(f"❌ Global Exception: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {str(exc)}"}
    )



# Automatically create database tables
Base.metadata.create_all(bind=engine)


def ensure_schema_updates():
    # create_all() only creates missing tables, it does not alter existing ones (no Alembic in this project)
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "must_change_password" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )

    if "projects" in inspector.get_table_names():
        project_columns = {column["name"] for column in inspector.get_columns("projects")}
        with engine.begin() as connection:
            if "supervisor_id" not in project_columns:
                connection.execute(
                    text(
                        "ALTER TABLE projects ADD COLUMN supervisor_id INT NULL, ADD CONSTRAINT fk_projects_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id)"
                    )
                )
            if "labourers_count" not in project_columns:
                connection.execute(
                    text(
                        "ALTER TABLE projects ADD COLUMN labourers_count INT NULL"
                    )
                )
            if "latitude" not in project_columns:
                connection.execute(
                    text(
                        "ALTER TABLE projects ADD COLUMN latitude DOUBLE NULL"
                    )
                )
            if "longitude" not in project_columns:
                connection.execute(
                    text(
                        "ALTER TABLE projects ADD COLUMN longitude DOUBLE NULL"
                    )
                )
            if "client_name" not in project_columns:
                connection.execute(
                    text(
                        "ALTER TABLE projects ADD COLUMN client_name VARCHAR(255) NULL"
                    )
                )
            try:
                connection.execute(text("ALTER TABLE projects MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PLANNED'"))
            except Exception:
                pass
            connection.execute(text("UPDATE projects SET status = 'ACTIVE' WHERE status = 'IN_PROGRESS'"))

    if "milestones" in inspector.get_table_names():
        milestone_columns = {column["name"] for column in inspector.get_columns("milestones")}
        with engine.begin() as connection:
            if "planned_start_date" not in milestone_columns:
                connection.execute(text("ALTER TABLE milestones ADD COLUMN planned_start_date DATE NULL"))
                connection.execute(text("UPDATE milestones SET planned_start_date = planned_date"))
                connection.execute(text("ALTER TABLE milestones MODIFY COLUMN planned_start_date DATE NOT NULL"))

            if "planned_end_date" not in milestone_columns:
                connection.execute(text("ALTER TABLE milestones ADD COLUMN planned_end_date DATE NULL"))
                connection.execute(text("UPDATE milestones SET planned_end_date = planned_date"))
                connection.execute(text("ALTER TABLE milestones MODIFY COLUMN planned_end_date DATE NOT NULL"))

            if "actual_start_date" not in milestone_columns:
                connection.execute(text("ALTER TABLE milestones ADD COLUMN actual_start_date DATE NULL"))
                connection.execute(text("UPDATE milestones SET actual_start_date = actual_date"))

            if "actual_end_date" not in milestone_columns:
                connection.execute(text("ALTER TABLE milestones ADD COLUMN actual_end_date DATE NULL"))
                connection.execute(text("UPDATE milestones SET actual_end_date = actual_date"))

            if "priority" not in milestone_columns:
                connection.execute(text("ALTER TABLE milestones ADD COLUMN priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM'"))

            if "sequence" not in milestone_columns:
                connection.execute(text("ALTER TABLE milestones ADD COLUMN sequence INT NOT NULL DEFAULT 1"))

            if "delay_days" not in milestone_columns:
                connection.execute(text("ALTER TABLE milestones ADD COLUMN delay_days INT NOT NULL DEFAULT 0"))

            if "responsible_id" not in milestone_columns:
                connection.execute(
                    text(
                        "ALTER TABLE milestones ADD COLUMN responsible_id INT NULL, ADD CONSTRAINT fk_milestones_responsible FOREIGN KEY (responsible_id) REFERENCES users(id)"
                    )
                )


ensure_schema_updates()


def seed_default_roles():
    db: Session = SessionLocal()
    try:
        existing_roles = {
            role.name for role in db.query(Role).all()
        }

        for role_name in (RoleName.ADMIN, RoleName.USER):
            if role_name not in existing_roles:
                db.add(Role(name=role_name))

        db.commit()
    finally:
        db.close()


seed_default_roles()


print("🚀 Swagger Docs: http://127.0.0.1:8000/docs")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)


app.include_router(
    role.router,
    prefix="/api/v1",
       tags=["Roles"]
)


app.include_router(
    user.router,
    prefix="/api/v1/users",
    tags=["Users"]
)


app.include_router(
    projects.router,
    prefix="/api/v1/projects",
    tags=["Projects"]
)


app.include_router(
    milestones.router,
    prefix="/api/v1",
    tags=["Milestones"]
)


app.include_router(
    predictions.router,
    prefix="/api/v1",
    tags=["Predictions"]
)


app.include_router(
    alert.router,
    prefix="/api/v1",
    tags=["Alerts"]
)


app.include_router(
    analytics.router,
    prefix="/api/v1",
    tags=["Analytics"]
)

app.include_router(
    daily_logs.router,
    prefix="/api/v1",
    tags=["Daily Site Logs"]
)

@app.get("/")
def root():
    return {
        "status": "SiteGuard AI backend running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }