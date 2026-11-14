import io
import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.auth import CurrentUser, get_current_user, require_role
from app.db import get_pool
from app.models.ecg_record import ECGRecordOut

router = APIRouter(prefix="/ecg-records", tags=["ecg-records"])

_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/upload", response_model=ECGRecordOut, status_code=201)
async def upload_ecg(
    patient_id: int = Form(...),
    appointment_id: Optional[int] = Form(None),
    sample_rate: Optional[int] = Form(500),
    duration_sec: Optional[float] = Form(None),
    image: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role("admin", "lab_technician")),
):
    # accept CSV by content-type OR filename extension
    is_csv = (
        (image.content_type or "").startswith("text/")
        or (image.content_type == "application/octet-stream" and (image.filename or "").endswith(".csv"))
        or (image.filename or "").endswith(".csv")
    )
    if not is_csv:
        raise HTTPException(400, "Only CSV files accepted")
    data = await image.read()
    if len(data) > _MAX_BYTES:
        raise HTTPException(400, "File exceeds 5 MB limit")

    meta = {
        "file_name": image.filename,
        "mime_type": "text/csv",
        "file_size_bytes": len(data),
        "sample_rate": sample_rate or 500,
        "duration_sec": duration_sec,
        "lead_count": 1,
    }
    pool = await get_pool()
    if not await pool.fetchval("SELECT 1 FROM patient WHERE patient_id = $1", patient_id):
        raise HTTPException(404, "Patient not found")

    row = await pool.fetchrow(
        """
        INSERT INTO ecg_audio_record (patient_id, appointment_id, record_data, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING record_id, patient_id, appointment_id, metadata, recorded_at
        """,
        patient_id, appointment_id, data, json.dumps(meta),
    )
    result = dict(row)
    result["metadata"] = json.loads(result["metadata"]) if isinstance(result["metadata"], str) else result["metadata"]
    p = await pool.fetchrow("SELECT full_name FROM patient WHERE patient_id = $1", patient_id)
    result["patient_name"] = p["full_name"] if p else None
    return result


@router.get("", response_model=list[ECGRecordOut])
async def list_ecg(
    patient_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if current_user.role == "patient":
        rows = await pool.fetch(
            """SELECT e.record_id, e.patient_id, e.appointment_id, e.metadata, e.recorded_at,
                      p.full_name AS patient_name
               FROM ecg_audio_record e JOIN patient p ON p.patient_id = e.patient_id
               WHERE e.patient_id = $1 ORDER BY e.recorded_at DESC""",
            current_user.linked_id,
        )
    elif patient_id:
        rows = await pool.fetch(
            """SELECT e.record_id, e.patient_id, e.appointment_id, e.metadata, e.recorded_at,
                      p.full_name AS patient_name
               FROM ecg_audio_record e JOIN patient p ON p.patient_id = e.patient_id
               WHERE e.patient_id = $1 ORDER BY e.recorded_at DESC""",
            patient_id,
        )
    else:
        rows = await pool.fetch(
            """SELECT e.record_id, e.patient_id, e.appointment_id, e.metadata, e.recorded_at,
                      p.full_name AS patient_name
               FROM ecg_audio_record e JOIN patient p ON p.patient_id = e.patient_id
               ORDER BY e.recorded_at DESC LIMIT 100""",
        )
    out = []
    for r in rows:
        d = dict(r)
        d["metadata"] = json.loads(d["metadata"]) if isinstance(d["metadata"], str) else d["metadata"]
        out.append(d)
    return out


@router.get("/{record_id}", response_model=ECGRecordOut)
async def get_ecg(record_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(
        """SELECT e.record_id, e.patient_id, e.appointment_id, e.metadata, e.recorded_at,
                  p.full_name AS patient_name
           FROM ecg_audio_record e JOIN patient p ON p.patient_id = e.patient_id
           WHERE e.record_id = $1""",
        record_id,
    )
    if not row:
        raise HTTPException(404, "ECG record not found")
    await _check_read_access(current_user, row["patient_id"], pool)
    d = dict(row)
    d["metadata"] = json.loads(d["metadata"]) if isinstance(d["metadata"], str) else d["metadata"]
    return d


@router.get("/{record_id}/data")
async def serve_ecg(record_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT record_data, metadata, patient_id FROM ecg_audio_record WHERE record_id = $1",
        record_id,
    )
    if not row:
        raise HTTPException(404, "ECG record not found")
    await _check_read_access(current_user, row["patient_id"], pool)
    meta = json.loads(row["metadata"]) if isinstance(row["metadata"], str) else row["metadata"]
    return StreamingResponse(
        io.BytesIO(bytes(row["record_data"])),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{meta.get("file_name", "ecg.csv")}"'},
    )


@router.delete("/{record_id}", status_code=204)
async def delete_ecg(
    record_id: int,
    current_user: CurrentUser = Depends(require_role("admin")),
):
    pool = await get_pool()
    result = await pool.execute("DELETE FROM ecg_audio_record WHERE record_id = $1", record_id)
    if result == "DELETE 0":
        raise HTTPException(404, "ECG record not found")


async def _check_read_access(current_user: CurrentUser, patient_id: int, pool):
    if current_user.role in ("admin", "lab_technician"):
        return
    if current_user.role == "patient":
        if current_user.linked_id != patient_id:
            raise HTTPException(403, "Access denied")
        return
    if current_user.role == "doctor":
        has_appt = await pool.fetchval(
            "SELECT 1 FROM appointment WHERE patient_id = $1 AND professional_id = $2",
            patient_id, current_user.linked_id,
        )
        if not has_appt:
            raise HTTPException(403, "No appointment with this patient")
        return
    raise HTTPException(403, "Access denied")
