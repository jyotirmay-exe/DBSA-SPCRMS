from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated

from app.auth import get_current_user, require_role, CurrentUser
from app.db import get_pool
from app.models.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.notifications import create_notification, get_user_id_for_patient, get_user_id_for_professional

router = APIRouter(prefix="/appointments", tags=["appointments"])

_JOIN = """
    SELECT a.*,
           p.full_name AS patient_name,
           hp.full_name AS professional_name
    FROM appointment a
    JOIN patient p ON p.patient_id = a.patient_id
    JOIN healthcare_professional hp ON hp.professional_id = a.professional_id
"""


@router.get("", response_model=list[AppointmentOut])
async def list_appointments(
    skip: int = 0,
    limit: int = 50,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if current_user.role == "patient":
        rows = await pool.fetch(
            _JOIN + "WHERE a.patient_id = $1 ORDER BY a.scheduled_at OFFSET $2 LIMIT $3",
            current_user.linked_id, skip, limit,
        )
    elif current_user.role == "doctor":
        rows = await pool.fetch(
            _JOIN + "WHERE a.professional_id = $1 ORDER BY a.scheduled_at OFFSET $2 LIMIT $3",
            current_user.linked_id, skip, limit,
        )
    else:
        rows = await pool.fetch(
            _JOIN + "ORDER BY a.scheduled_at OFFSET $1 LIMIT $2", skip, limit
        )
    return [dict(r) for r in rows]


@router.get("/{appointment_id}", response_model=AppointmentOut)
async def get_appointment(appointment_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(_JOIN + "WHERE a.appointment_id = $1", appointment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if current_user.role == "patient" and row["patient_id"] != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "doctor" and row["professional_id"] != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return dict(row)


@router.post("", response_model=AppointmentOut)
async def create_appointment(
    body: AppointmentCreate,
    current_user: CurrentUser = Depends(require_role("admin", "doctor")),
):
    pool = await get_pool()
    conflict = await pool.fetchrow(
        "SELECT 1 FROM appointment WHERE professional_id = $1 AND scheduled_at = $2 AND status != 'Cancelled'",
        body.professional_id, body.scheduled_at,
    )
    if conflict:
        raise HTTPException(status_code=409, detail="Doctor already has an appointment at this time")

    async with pool.acquire() as conn:
        async with conn.transaction():
            ins = await conn.fetchrow(
                """
                INSERT INTO appointment (patient_id, professional_id, scheduled_at, status, notes)
                VALUES ($1,$2,$3,'Scheduled',$4) RETURNING appointment_id
                """,
                body.patient_id, body.professional_id, body.scheduled_at, body.notes,
            )
            patient_uid = await get_user_id_for_patient(conn, body.patient_id)
            doctor_uid = await get_user_id_for_professional(conn, body.professional_id)
            if patient_uid:
                await create_notification(conn, patient_uid, "Your appointment has been scheduled.", "appointment_scheduled")
            if doctor_uid:
                await create_notification(conn, doctor_uid, "A new appointment has been assigned to you.", "appointment_assigned")
    row = await pool.fetchrow(_JOIN + "WHERE a.appointment_id = $1", ins["appointment_id"])
    return dict(row)


@router.put("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: int,
    body: AppointmentUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    existing = await pool.fetchrow("SELECT * FROM appointment WHERE appointment_id = $1", appointment_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if current_user.role == "doctor" and existing["professional_id"] != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role not in ("admin", "doctor"):
        raise HTTPException(status_code=403, detail="Access denied")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                f"UPDATE appointment SET {set_clause} WHERE appointment_id = $1",
                appointment_id, *updates.values(),
            )
            if updates.get("status") == "Cancelled":
                patient_uid = await get_user_id_for_patient(conn, existing["patient_id"])
                if patient_uid:
                    await create_notification(conn, patient_uid, "Your appointment has been cancelled.", "appointment_cancelled")
    row = await pool.fetchrow(_JOIN + "WHERE a.appointment_id = $1", appointment_id)
    return dict(row)


@router.delete("/{appointment_id}", dependencies=[Depends(require_role("admin"))])
async def cancel_appointment(appointment_id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                "UPDATE appointment SET status = 'Cancelled' WHERE appointment_id = $1 RETURNING *",
                appointment_id,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Appointment not found")
            patient_uid = await get_user_id_for_patient(conn, row["patient_id"])
            if patient_uid:
                await create_notification(conn, patient_uid, "Your appointment has been cancelled.", "appointment_cancelled")
    return {"detail": "Appointment cancelled"}
