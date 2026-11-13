from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DiagnosisCreate(BaseModel):
    appointment_id: int
    patient_id: int
    condition_name: str
    description: Optional[str] = None
    severity: str


class DiagnosisUpdate(BaseModel):
    condition_name: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None


class DiagnosisOut(BaseModel):
    diagnosis_id: int
    appointment_id: int
    patient_id: int
    condition_name: str
    description: Optional[str]
    severity: str
    recorded_at: datetime
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True
