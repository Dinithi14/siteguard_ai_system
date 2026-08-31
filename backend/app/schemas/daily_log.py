from datetime import date, datetime
from pydantic import BaseModel, Field

class DailySiteLogBase(BaseModel):
    log_date: date
    weather_condition: str = Field(..., examples=["Clear", "Rainy", "Monsoon"])
    labour_count: int = Field(..., ge=0)
    material_availability: str = Field(..., examples=["High", "Medium", "Low"])
    work_completed: str | None = None
    issues_encountered: str | None = None
    notes: str | None = None

class DailySiteLogCreate(DailySiteLogBase):
    pass

class DailySiteLogUpdate(BaseModel):
    log_date: date | None = None
    weather_condition: str | None = Field(None, examples=["Clear", "Rainy", "Monsoon"])
    labour_count: int | None = Field(None, ge=0)
    material_availability: str | None = Field(None, examples=["High", "Medium", "Low"])
    work_completed: str | None = None
    issues_encountered: str | None = None
    notes: str | None = None

class DailySiteLogResponse(DailySiteLogBase):
    id: int
    project_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DailySiteLogListResponse(BaseModel):
    data: list[DailySiteLogResponse]
