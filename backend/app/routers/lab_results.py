from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.auth import get_current_user, require_role, CurrentUser
from app.db import get_pool
from app.models.lab_result import LabResultCreate, LabResultUpdate, LabResultOut
from app.notifications import create_notification, get_user_id_for_patient, get_user_id_for_professional

router = APIRouter(prefix="/lab-results", tags=["lab-results"])


@router.get("", response_model=list[LabResultOut])
async def list_results(
    skip: int = 0,
    limit: int = 50,
    investigation_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if investigation_id:
        rows = await pool.fetch(
            "SELECT * FROM lab_result WHERE investigation_id = $1 ORDER BY entered_at",
            investigation_id,
        )
    elif current_user.role == "patient":
        rows = await pool.fetch(
            """
            SELECT lr.* FROM lab_result lr
            JOIN laboratory_investigation li ON li.investigation_id = lr.investigation_id
            WHERE li.patient_id = $1
            ORDER BY lr.entered_at OFFSET $2 LIMIT $3
            """,
            current_user.linked_id, skip, limit,
        )
    elif current_user.role == "doctor":
        rows = await pool.fetch(
            """
            SELECT lr.* FROM lab_result lr
            JOIN laboratory_investigation li ON li.investigation_id = lr.investigation_id
            WHERE li.ordered_by = $1
            ORDER BY lr.entered_at OFFSET $2 LIMIT $3
            """,
            current_user.linked_id, skip, limit,
        )
    else:
        rows = await pool.fetch(
            "SELECT * FROM lab_result ORDER BY entered_at OFFSET $1 LIMIT $2", skip, limit
        )
    return [dict(r) for r in rows]


@router.get("/{result_id}", response_model=LabResultOut)
async def get_result(result_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM lab_result WHERE result_id = $1", result_id)
    if not row:
        raise HTTPException(status_code=404, detail="Result not found")
    if current_user.role == "patient":
        inv = await pool.fetchrow("SELECT patient_id FROM laboratory_investigation WHERE investigation_id = $1", row["investigation_id"])
        if not inv or inv["patient_id"] != current_user.linked_id:
            raise HTTPException(status_code=403, detail="Access denied")
    return dict(row)


@router.post("", response_model=LabResultOut)
async def create_result(
    body: LabResultCreate,
    current_user: CurrentUser = Depends(require_role("admin", "lab_technician")),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """
                INSERT INTO lab_result (investigation_id, result_value, unit, reference_range, result_status, entered_by, entered_at)
                VALUES ($1,$2,$3,$4,$5,$6,now()) RETURNING *
                """,
                body.investigation_id, body.result_value, body.unit,
                body.reference_range, body.result_status, current_user.linked_id,
            )
            await conn.execute(
                "UPDATE laboratory_investigation SET status = 'Completed' WHERE investigation_id = $1",
                body.investigation_id,
            )
            inv = await conn.fetchrow(
                "SELECT patient_id, ordered_by FROM laboratory_investigation WHERE investigation_id = $1",
                body.investigation_id,
            )
            if inv:
                patient_uid = await get_user_id_for_patient(conn, inv["patient_id"])
                doctor_uid = await get_user_id_for_professional(conn, inv["ordered_by"])
                if patient_uid:
                    await create_notification(conn, patient_uid, "Your lab results are now available.", "lab_result_available")
                if doctor_uid:
                    await create_notification(conn, doctor_uid, "Lab results have been entered for your patient.", "lab_result_entered")
    return dict(row)


@router.put("/{result_id}", response_model=LabResultOut, dependencies=[Depends(require_role("admin", "lab_technician"))])
async def update_result(result_id: int, body: LabResultUpdate):
    pool = await get_pool()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    row = await pool.fetchrow(
        f"UPDATE lab_result SET {set_clause} WHERE result_id = $1 RETURNING *",
        result_id, *updates.values(),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Result not found")
    return dict(row)
