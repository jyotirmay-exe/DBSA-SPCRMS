from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ECGRecordOut(BaseModel):
    record_id: int
    patient_id: int
    appointment_id: Optional[int] = None
    metadata: dict
    recorded_at: datetime
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True
