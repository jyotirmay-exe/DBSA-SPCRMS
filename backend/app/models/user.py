from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Literal["patient", "doctor", "lab_technician", "admin"]
    linked_id: Optional[int] = None


class UserOut(BaseModel):
    user_id: int
    email: str
    role: str
    linked_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    role: Optional[Literal["patient", "doctor", "lab_technician", "admin"]] = None
    is_active: Optional[bool] = None


class PasswordReset(BaseModel):
    new_password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
