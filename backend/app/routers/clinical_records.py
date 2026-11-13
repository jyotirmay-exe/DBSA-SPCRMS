from fastapi import APIRouter, HTTPException, Depends

from app.auth import get_current_user, require_role, CurrentUser
from app.db import get_pool
from app.models.clinical_record import ClinicalRecordCreate, ClinicalRecordUpdate, ClinicalRecordOut

router = APIRouter(prefix="/clinical-records", tags=["clinical-records"])


@router.get("", response_model=list[ClinicalRecordOut])
async def list_records(
    skip: int = 0,
    limit: int = 50,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if current_user.role == "patient":
        rows = await pool.fetch(
            "SELECT * FROM clinical_record WHERE patient_id = $1 ORDER BY created_at OFFSET $2 LIMIT $3",
            current_user.linked_id, skip, limit,
        )
    elif current_user.role == "doctor":
        rows = await pool.fetch(
            """
            SELECT DISTINCT cr.* FROM clinical_record cr
            JOIN appointment a ON a.patient_id = cr.patient_id
            WHERE a.professional_id = $1
            ORDER BY cr.created_at OFFSET $2 LIMIT $3
            """,
            current_user.linked_id, skip, limit,
        )
    else:
        rows = await pool.fetch(
            "SELECT * FROM clinical_record ORDER BY created_at OFFSET $1 LIMIT $2", skip, limit
        )
    return [dict(r) for r in rows]


@router.get("/{record_id}", response_model=ClinicalRecordOut)
async def get_record(record_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM clinical_record WHERE record_id = $1", record_id)
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    if current_user.role == "patient" and row["patient_id"] != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "doctor":
        has_appt = await pool.fetchval(
            "SELECT 1 FROM appointment WHERE patient_id = $1 AND professional_id = $2",
            row["patient_id"], current_user.linked_id,
        )
        if not has_appt:
            raise HTTPException(status_code=403, detail="Access denied")
    return dict(row)


@router.post("", response_model=ClinicalRecordOut, dependencies=[Depends(require_role("admin", "doctor"))])
async def create_record(body: ClinicalRecordCreate):
    pool = await get_pool()
    row = await pool.fetchrow(
        "INSERT INTO clinical_record (patient_id, created_at, summary_notes) VALUES ($1,now(),$2) RETURNING *",
        body.patient_id, body.summary_notes,
    )
    return dict(row)


@router.put("/{record_id}", response_model=ClinicalRecordOut, dependencies=[Depends(require_role("admin", "doctor"))])
async def update_record(record_id: int, body: ClinicalRecordUpdate):
    pool = await get_pool()
    row = await pool.fetchrow(
        "UPDATE clinical_record SET summary_notes = $2 WHERE record_id = $1 RETURNING *",
        record_id, body.summary_notes,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    return dict(row)


@router.delete("/{record_id}", dependencies=[Depends(require_role("admin"))])
async def delete_record(record_id: int):
    result = await (await get_pool()).execute("DELETE FROM clinical_record WHERE record_id = $1", record_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Record not found")
    return {"detail": "Deleted"}
