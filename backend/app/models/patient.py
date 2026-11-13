from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Literal, Optional


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: date
    gender: Literal["Male", "Female", "Other"]
    contact_number: str
    email: EmailStr
    address: str


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class PatientOut(BaseModel):
    patient_id: int
    full_name: str
    date_of_birth: date
    gender: str
    contact_number: str
    email: str
    address: str
    is_active: bool

    class Config:
        from_attributes = True
