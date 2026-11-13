from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.auth import get_current_user, require_role, CurrentUser
from app.db import get_pool
from app.models.prescription import PrescriptionCreate, PrescriptionUpdate, PrescriptionOut

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

_JOIN = """
    SELECT p.*,
           d.condition_name,
           a.scheduled_at::date::text AS appointment_date,
           pat.full_name AS patient_name
    FROM prescription p
    JOIN diagnosis d ON d.diagnosis_id = p.diagnosis_id
    JOIN appointment a ON a.appointment_id = d.appointment_id
    JOIN patient pat ON pat.patient_id = p.patient_id
"""


@router.get("", response_model=list[PrescriptionOut])
async def list_prescriptions(
    skip: int = 0,
    limit: int = 50,
    patient_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if current_user.role == "patient":
        rows = await pool.fetch(
            _JOIN + "WHERE p.patient_id = $1 ORDER BY p.prescription_id OFFSET $2 LIMIT $3",
            current_user.linked_id, skip, limit,
        )
    elif current_user.role == "doctor":
        if patient_id:
            rows = await pool.fetch(
                _JOIN + "WHERE a.professional_id = $1 AND p.patient_id = $2 ORDER BY p.prescription_id OFFSET $3 LIMIT $4",
                current_user.linked_id, patient_id, skip, limit,
            )
        else:
            rows = await pool.fetch(
                _JOIN + "WHERE a.professional_id = $1 ORDER BY p.prescription_id OFFSET $2 LIMIT $3",
                current_user.linked_id, skip, limit,
            )
    else:
        if patient_id:
            rows = await pool.fetch(
                _JOIN + "WHERE p.patient_id = $1 ORDER BY p.prescription_id OFFSET $2 LIMIT $3",
                patient_id, skip, limit,
            )
        else:
            rows = await pool.fetch(
                _JOIN + "ORDER BY p.prescription_id OFFSET $1 LIMIT $2", skip, limit
            )
    return [dict(r) for r in rows]


@router.get("/{prescription_id}", response_model=PrescriptionOut)
async def get_prescription(prescription_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(
        _JOIN + "WHERE p.prescription_id = $1", prescription_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if current_user.role == "patient" and row["patient_id"] != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return dict(row)


@router.post("", response_model=PrescriptionOut, dependencies=[Depends(require_role("admin", "doctor"))])
async def create_prescription(body: PrescriptionCreate):
    pool = await get_pool()
    ins = await pool.fetchrow(
        """
        INSERT INTO prescription (diagnosis_id, patient_id, medication_name, dosage, frequency, duration, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING prescription_id
        """,
        body.diagnosis_id, body.patient_id, body.medication_name,
        body.dosage, body.frequency, body.duration, body.notes,
    )
    row = await pool.fetchrow(_JOIN + "WHERE p.prescription_id = $1", ins["prescription_id"])
    return dict(row)


@router.put("/{prescription_id}", response_model=PrescriptionOut, dependencies=[Depends(require_role("admin", "doctor"))])
async def update_prescription(prescription_id: int, body: PrescriptionUpdate):
    pool = await get_pool()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    await pool.execute(
        f"UPDATE prescription SET {set_clause} WHERE prescription_id = $1",
        prescription_id, *updates.values(),
    )
    row = await pool.fetchrow(_JOIN + "WHERE p.prescription_id = $1", prescription_id)
    if not row:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return dict(row)


@router.delete("/{prescription_id}", dependencies=[Depends(require_role("admin"))])
async def delete_prescription(prescription_id: int):
    result = await (await get_pool()).execute("DELETE FROM prescription WHERE prescription_id = $1", prescription_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Prescription not found")
    return {"detail": "Deleted"}
