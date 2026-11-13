from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class LabInvestigationCreate(BaseModel):
    appointment_id: int
    patient_id: int
    test_name: str
    test_type: str


class LabInvestigationUpdate(BaseModel):
    status: Optional[Literal["Pending", "Completed"]] = None


class LabInvestigationOut(BaseModel):
    investigation_id: int
    appointment_id: int
    patient_id: int
    ordered_by: int
    test_name: str
    test_type: str
    status: str
    ordered_at: datetime
    patient_name: Optional[str] = None
    ordered_by_name: Optional[str] = None

    class Config:
        from_attributes = True
