from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class LabResultCreate(BaseModel):
    investigation_id: int
    result_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    result_status: Literal["Normal", "Abnormal"]


class LabResultUpdate(BaseModel):
    result_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    result_status: Optional[Literal["Normal", "Abnormal"]] = None


class LabResultOut(BaseModel):
    result_id: int
    investigation_id: int
    result_value: str
    unit: Optional[str]
    reference_range: Optional[str]
    result_status: str
    entered_by: int
    entered_at: datetime
    # enriched from v_lab_result_full
    test_name: Optional[str] = None
    test_type: Optional[str] = None
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    ordered_by: Optional[int] = None
    entered_by_name: Optional[str] = None

    class Config:
        from_attributes = True
