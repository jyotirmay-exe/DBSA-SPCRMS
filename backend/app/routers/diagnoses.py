from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.auth import get_current_user, require_role, CurrentUser
from app.db import get_pool
from app.models.diagnosis import DiagnosisCreate, DiagnosisUpdate, DiagnosisOut

router = APIRouter(prefix="/diagnoses", tags=["diagnoses"])

@router.get("", response_model=list[DiagnosisOut])
async def list_diagnoses(
    skip: int = 0,
    limit: int = 50,
    patient_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if current_user.role == "patient":
        rows = await pool.fetch(
            "SELECT * FROM v_diagnosis_full WHERE patient_id = $1 ORDER BY recorded_at OFFSET $2 LIMIT $3",
            current_user.linked_id, skip, limit,
        )
    elif current_user.role == "doctor":
        if patient_id:
            rows = await pool.fetch(
                "SELECT * FROM v_diagnosis_full WHERE doctor_id = $1 AND patient_id = $2 ORDER BY recorded_at OFFSET $3 LIMIT $4",
                current_user.linked_id, patient_id, skip, limit,
            )
        else:
            rows = await pool.fetch(
                "SELECT * FROM v_diagnosis_full WHERE doctor_id = $1 ORDER BY recorded_at OFFSET $2 LIMIT $3",
                current_user.linked_id, skip, limit,
            )
    else:
        if patient_id:
            rows = await pool.fetch(
                "SELECT * FROM v_diagnosis_full WHERE patient_id = $1 ORDER BY recorded_at OFFSET $2 LIMIT $3",
                patient_id, skip, limit,
            )
        else:
            rows = await pool.fetch(
                "SELECT * FROM v_diagnosis_full ORDER BY recorded_at OFFSET $1 LIMIT $2", skip, limit
            )
    return [dict(r) for r in rows]


@router.get("/{diagnosis_id}", response_model=DiagnosisOut)
async def get_diagnosis(diagnosis_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM v_diagnosis_full WHERE diagnosis_id = $1", diagnosis_id)
    if not row:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    if current_user.role == "patient" and row["patient_id"] != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return dict(row)


@router.post("", response_model=DiagnosisOut, dependencies=[Depends(require_role("admin", "doctor"))])
async def create_diagnosis(body: DiagnosisCreate):
    pool = await get_pool()
    ins = await pool.fetchrow(
        """
        INSERT INTO diagnosis (appointment_id, patient_id, condition_name, description, severity, recorded_at)
        VALUES ($1,$2,$3,$4,$5,now()) RETURNING diagnosis_id
        """,
        body.appointment_id, body.patient_id, body.condition_name, body.description, body.severity,
    )
    row = await pool.fetchrow("SELECT * FROM v_diagnosis_full WHERE diagnosis_id = $1", ins["diagnosis_id"])
    return dict(row)


@router.put("/{diagnosis_id}", response_model=DiagnosisOut, dependencies=[Depends(require_role("admin", "doctor"))])
async def update_diagnosis(diagnosis_id: int, body: DiagnosisUpdate):
    pool = await get_pool()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    await pool.execute(
        f"UPDATE diagnosis SET {set_clause} WHERE diagnosis_id = $1",
        diagnosis_id, *updates.values(),
    )
    row = await pool.fetchrow("SELECT * FROM v_diagnosis_full WHERE diagnosis_id = $1", diagnosis_id)
    if not row:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return dict(row)


@router.delete("/{diagnosis_id}", dependencies=[Depends(require_role("admin"))])
async def delete_diagnosis(diagnosis_id: int):
    result = await (await get_pool()).execute("DELETE FROM diagnosis WHERE diagnosis_id = $1", diagnosis_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return {"detail": "Deleted"}
