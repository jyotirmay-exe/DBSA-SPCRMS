from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated

from app.auth import get_current_user, require_role, CurrentUser
from app.db import get_pool
from app.models.patient import PatientCreate, PatientUpdate, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientOut])
async def list_patients(
    skip: int = 0,
    limit: int = 50,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if current_user.role == "patient":
        rows = await pool.fetch(
            "SELECT * FROM patient WHERE patient_id = $1", current_user.linked_id
        )
    else:
        rows = await pool.fetch(
            "SELECT * FROM patient ORDER BY patient_id OFFSET $1 LIMIT $2", skip, limit
        )
    return [dict(r) for r in rows]


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(patient_id: int, current_user: CurrentUser = Depends(get_current_user)):
    if current_user.role == "patient" and current_user.linked_id != patient_id:
        raise HTTPException(status_code=403, detail="Access denied")
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM patient WHERE patient_id = $1", patient_id)
    if not row:
        raise HTTPException(status_code=404, detail="Patient not found")
    return dict(row)


@router.post("", response_model=PatientOut, dependencies=[Depends(require_role("admin"))])
async def create_patient(body: PatientCreate):
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO patient (full_name, date_of_birth, gender, contact_number, email, address, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,true)
        RETURNING *
        """,
        body.full_name, body.date_of_birth, body.gender,
        body.contact_number, body.email, body.address,
    )
    return dict(row)


@router.put("/{patient_id}", response_model=PatientOut, dependencies=[Depends(require_role("admin"))])
async def update_patient(patient_id: int, body: PatientUpdate):
    pool = await get_pool()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    row = await pool.fetchrow(
        f"UPDATE patient SET {set_clause} WHERE patient_id = $1 RETURNING *",
        patient_id, *updates.values(),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Patient not found")
    return dict(row)


@router.delete("/{patient_id}", dependencies=[Depends(require_role("admin"))])
async def deactivate_patient(patient_id: int):
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE patient SET is_active = false WHERE patient_id = $1", patient_id
    )
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"detail": "Patient deactivated"}
