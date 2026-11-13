from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class ProfessionalCreate(BaseModel):
    full_name: str
    role: Literal["doctor", "lab_technician"]
    specialization: Optional[str] = None
    contact_number: str
    email: EmailStr


class ProfessionalUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class ProfessionalOut(BaseModel):
    professional_id: int
    full_name: str
    role: str
    specialization: Optional[str]
    contact_number: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True
