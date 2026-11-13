from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class AppointmentCreate(BaseModel):
    patient_id: int
    professional_id: int
    scheduled_at: datetime
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[Literal["Scheduled", "Completed", "Cancelled"]] = None
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    appointment_id: int
    patient_id: int
    professional_id: int
    scheduled_at: datetime
    status: str
    notes: Optional[str]
    patient_name: Optional[str] = None
    professional_name: Optional[str] = None

    class Config:
        from_attributes = True
