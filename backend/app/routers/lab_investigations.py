from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.auth import get_current_user, require_role, CurrentUser
from app.db import get_pool
from app.models.lab_investigation import LabInvestigationCreate, LabInvestigationUpdate, LabInvestigationOut

router = APIRouter(prefix="/lab-investigations", tags=["lab-investigations"])

@router.get("", response_model=list[LabInvestigationOut])
async def list_investigations(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    patient_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    if current_user.role == "patient":
        rows = await pool.fetch(
            "SELECT * FROM v_lab_investigation_full WHERE patient_id = $1 ORDER BY ordered_at OFFSET $2 LIMIT $3",
            current_user.linked_id, skip, limit,
        )
    elif current_user.role == "lab_technician":
        if status:
            rows = await pool.fetch(
                "SELECT * FROM v_lab_investigation_full WHERE status = $1 ORDER BY ordered_at OFFSET $2 LIMIT $3",
                status, skip, limit,
            )
        else:
            rows = await pool.fetch(
                "SELECT * FROM v_lab_investigation_full ORDER BY ordered_at OFFSET $1 LIMIT $2", skip, limit,
            )
    elif current_user.role == "doctor":
        if patient_id:
            rows = await pool.fetch(
                "SELECT * FROM v_lab_investigation_full WHERE ordered_by = $1 AND patient_id = $2 ORDER BY ordered_at OFFSET $3 LIMIT $4",
                current_user.linked_id, patient_id, skip, limit,
            )
        else:
            rows = await pool.fetch(
                "SELECT * FROM v_lab_investigation_full WHERE ordered_by = $1 ORDER BY ordered_at OFFSET $2 LIMIT $3",
                current_user.linked_id, skip, limit,
            )
    else:
        if patient_id:
            rows = await pool.fetch(
                "SELECT * FROM v_lab_investigation_full WHERE patient_id = $1 ORDER BY ordered_at OFFSET $2 LIMIT $3",
                patient_id, skip, limit,
            )
        elif status:
            rows = await pool.fetch(
                "SELECT * FROM v_lab_investigation_full WHERE status = $1 ORDER BY ordered_at OFFSET $2 LIMIT $3",
                status, skip, limit,
            )
        else:
            rows = await pool.fetch(
                "SELECT * FROM v_lab_investigation_full ORDER BY ordered_at OFFSET $1 LIMIT $2", skip, limit
            )
    return [dict(r) for r in rows]


@router.get("/{investigation_id}", response_model=LabInvestigationOut)
async def get_investigation(investigation_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM v_lab_investigation_full WHERE investigation_id = $1", investigation_id)
    if not row:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if current_user.role == "patient" and row["patient_id"] != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "doctor" and row["ordered_by"] != current_user.linked_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return dict(row)


@router.post("", response_model=LabInvestigationOut)
async def order_investigation(
    body: LabInvestigationCreate,
    current_user: CurrentUser = Depends(require_role("admin", "doctor")),
):
    pool = await get_pool()
    ins = await pool.fetchrow(
        """
        INSERT INTO laboratory_investigation (appointment_id, patient_id, ordered_by, test_name, test_type, status, ordered_at)
        VALUES ($1,$2,$3,$4,$5,'Pending',now()) RETURNING investigation_id
        """,
        body.appointment_id, body.patient_id, current_user.linked_id,
        body.test_name, body.test_type,
    )
    row = await pool.fetchrow("SELECT * FROM v_lab_investigation_full WHERE investigation_id = $1", ins["investigation_id"])
    return dict(row)


@router.put("/{investigation_id}", response_model=LabInvestigationOut, dependencies=[Depends(require_role("admin", "doctor"))])
async def update_investigation(investigation_id: int, body: LabInvestigationUpdate):
    pool = await get_pool()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    await pool.execute(
        f"UPDATE laboratory_investigation SET {set_clause} WHERE investigation_id = $1",
        investigation_id, *updates.values(),
    )
    row = await pool.fetchrow("SELECT * FROM v_lab_investigation_full WHERE investigation_id = $1", investigation_id)
    if not row:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return dict(row)


@router.delete("/{investigation_id}", dependencies=[Depends(require_role("admin"))])
async def delete_investigation(investigation_id: int):
    result = await (await get_pool()).execute("DELETE FROM laboratory_investigation WHERE investigation_id = $1", investigation_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Investigation not found")
    return {"detail": "Deleted"}
