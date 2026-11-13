import io
import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.auth import CurrentUser, get_current_user, require_role
from app.db import get_pool
from app.models.medical_image import MedicalImageOut

router = APIRouter(prefix="/medical-images", tags=["medical-images"])

_ALLOWED_TYPES = {"image/jpeg", "image/png"}
_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=MedicalImageOut, status_code=201)
async def upload_image(
    patient_id: int = Form(...),
    appointment_id: Optional[int] = Form(None),
    body_part: Optional[str] = Form(None),
    image: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role("admin", "lab_technician")),
):
    if image.content_type not in _ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG/PNG images accepted")
    data = await image.read()
    if len(data) > _MAX_BYTES:
        raise HTTPException(400, "File exceeds 10 MB limit")

    meta = {
        "file_name": image.filename,
        "mime_type": image.content_type,
        "file_size_bytes": len(data),
        "modality": "X-Ray",
        "body_part": body_part or "Chest",
    }
    pool = await get_pool()
    # verify patient exists
    if not await pool.fetchval("SELECT 1 FROM patient WHERE patient_id = $1", patient_id):
        raise HTTPException(404, "Patient not found")

    row = await pool.fetchrow(
        """
        INSERT INTO medical_image (patient_id, appointment_id, image_data, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING image_id, patient_id, appointment_id, metadata, uploaded_at
        """,
        patient_id, appointment_id, data, json.dumps(meta),
    )
    result = dict(row)
    result["metadata"] = json.loads(result["metadata"]) if isinstance(result["metadata"], str) else result["metadata"]
    # attach patient name
    p = await pool.fetchrow("SELECT full_name FROM patient WHERE patient_id = $1", patient_id)
    result["patient_name"] = p["full_name"] if p else None
    return result


@router.get("", response_model=list[MedicalImageOut])
async def list_images(
    patient_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if current_user.role == "patient":
        rows = await pool.fetch(
            """SELECT mi.image_id, mi.patient_id, mi.appointment_id, mi.metadata, mi.uploaded_at,
                      p.full_name AS patient_name
               FROM medical_image mi JOIN patient p ON p.patient_id = mi.patient_id
               WHERE mi.patient_id = $1 ORDER BY mi.uploaded_at DESC""",
            current_user.linked_id,
        )
    elif patient_id:
        rows = await pool.fetch(
            """SELECT mi.image_id, mi.patient_id, mi.appointment_id, mi.metadata, mi.uploaded_at,
                      p.full_name AS patient_name
               FROM medical_image mi JOIN patient p ON p.patient_id = mi.patient_id
               WHERE mi.patient_id = $1 ORDER BY mi.uploaded_at DESC""",
            patient_id,
        )
    else:
        rows = await pool.fetch(
            """SELECT mi.image_id, mi.patient_id, mi.appointment_id, mi.metadata, mi.uploaded_at,
                      p.full_name AS patient_name
               FROM medical_image mi JOIN patient p ON p.patient_id = mi.patient_id
               ORDER BY mi.uploaded_at DESC LIMIT 100""",
        )
    out = []
    for r in rows:
        d = dict(r)
        d["metadata"] = json.loads(d["metadata"]) if isinstance(d["metadata"], str) else d["metadata"]
        out.append(d)
    return out


@router.get("/{image_id}", response_model=MedicalImageOut)
async def get_image(image_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(
        """SELECT mi.image_id, mi.patient_id, mi.appointment_id, mi.metadata, mi.uploaded_at,
                  p.full_name AS patient_name
           FROM medical_image mi JOIN patient p ON p.patient_id = mi.patient_id
           WHERE mi.image_id = $1""",
        image_id,
    )
    if not row:
        raise HTTPException(404, "Image not found")
    await _check_read_access(current_user, row["patient_id"], pool)
    d = dict(row)
    d["metadata"] = json.loads(d["metadata"]) if isinstance(d["metadata"], str) else d["metadata"]
    return d


@router.get("/{image_id}/data")
async def serve_image(image_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT image_data, metadata, patient_id FROM medical_image WHERE image_id = $1",
        image_id,
    )
    if not row:
        raise HTTPException(404, "Image not found")
    await _check_read_access(current_user, row["patient_id"], pool)
    meta = json.loads(row["metadata"]) if isinstance(row["metadata"], str) else row["metadata"]
    return StreamingResponse(
        io.BytesIO(bytes(row["image_data"])),
        media_type=meta.get("mime_type", "application/octet-stream"),
        headers={"Content-Disposition": f'inline; filename="{meta.get("file_name", "image")}"'},
    )


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    image_id: int,
    current_user: CurrentUser = Depends(require_role("admin")),
):
    pool = await get_pool()
    result = await pool.execute("DELETE FROM medical_image WHERE image_id = $1", image_id)
    if result == "DELETE 0":
        raise HTTPException(404, "Image not found")


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
