from pydantic import BaseModel
from typing import Optional


class PrescriptionCreate(BaseModel):
    diagnosis_id: int
    patient_id: int
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None


class PrescriptionUpdate(BaseModel):
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None


class PrescriptionOut(BaseModel):
    prescription_id: int
    diagnosis_id: int
    patient_id: int
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str]
    condition_name: Optional[str] = None
    appointment_date: Optional[str] = None
    patient_name: Optional[str] = None
    # enriched from v_prescription_full
    doctor_id: Optional[int] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True
