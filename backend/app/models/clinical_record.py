from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ClinicalRecordCreate(BaseModel):
    patient_id: int
    summary_notes: Optional[str] = None


class ClinicalRecordUpdate(BaseModel):
    summary_notes: Optional[str] = None


class ClinicalRecordOut(BaseModel):
    record_id: int
    patient_id: int
    created_at: datetime
    summary_notes: Optional[str]

    class Config:
        from_attributes = True
