from pydantic import BaseModel, Field
from datetime import datetime


class PredictionRequest(BaseModel):
    project_type: str = Field(..., examples=["Residential"])
    planned_duration: int = Field(..., gt=0, description="Planned duration in days")
    contract_value_lkr: float = Field(..., gt=0)
    project_size: str = Field(..., examples=["Medium"])
    labourers_count: int = Field(..., gt=0)
    material_availability: str = Field(..., examples=["High", "Medium", "Low"])
    weather_condition: str = Field(..., examples=["Clear", "Rainy", "Monsoon"])


class Recommendation(BaseModel):
    factor: str
    severity: str
    recommendation: str

class PredictionResponse(BaseModel):
    id: int
    project_id: int
    risk_score: float
    risk_level: str
    estimated_delay_days: int | None
    model_version: str
    created_at: datetime
    recommendations: list[Recommendation] | None = None

class PredictionListResponse(BaseModel):
    data: list[PredictionResponse]
