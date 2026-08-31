from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_verified_user
from app.models.user import User
from app.schemas.prediction import (
    PredictionListResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services.prediction_service import (
    get_prediction_by_id,
    list_project_predictions,
    run_project_prediction,
)

router = APIRouter()


@router.post(
    "/projects/{project_id}/predictions",
    response_model=PredictionResponse,
    summary="Run Delay Risk Prediction",
    description="Run AI prediction for the selected project and store history.",
    operation_id="predictions_run_for_project"
)
def run_prediction(
    project_id: int,
    req: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    return run_project_prediction(project_id, req, db)


@router.get(
    "/projects/{project_id}/predictions",
    response_model=PredictionListResponse,
    summary="List Project Predictions",
    description="View prediction history for one project.",
    operation_id="predictions_list_for_project"
)
def list_predictions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    return list_project_predictions(project_id, db)


@router.get(
    "/predictions/{prediction_id}",
    response_model=PredictionResponse,
    summary="Get Prediction",
    description="Get one prediction by id.",
    operation_id="predictions_get_by_id"
)
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    return get_prediction_by_id(prediction_id, db)
