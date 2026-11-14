from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MedicalImageOut(BaseModel):
    image_id: int
    patient_id: int
    appointment_id: Optional[int] = None
    metadata: dict
    uploaded_at: datetime
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True
