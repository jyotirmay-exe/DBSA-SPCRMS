from fastapi import APIRouter, HTTPException, Depends

from app.auth import get_current_user, require_role, CurrentUser
from app.db import get_pool
from app.models.professional import ProfessionalCreate, ProfessionalUpdate, ProfessionalOut

router = APIRouter(prefix="/professionals", tags=["professionals"])

_PROF_ROLE_MAP = {
    "doctor": "Doctor",
    "lab_technician": "Lab Technician",
}


@router.get("", response_model=list[ProfessionalOut], dependencies=[Depends(require_role("admin", "doctor"))])
async def list_professionals(skip: int = 0, limit: int = 50):
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT * FROM healthcare_professional ORDER BY professional_id OFFSET $1 LIMIT $2", skip, limit
    )
    return [dict(r) for r in rows]


@router.get("/{professional_id}", response_model=ProfessionalOut, dependencies=[Depends(get_current_user)])
async def get_professional(professional_id: int):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM healthcare_professional WHERE professional_id = $1", professional_id)
    if not row:
        raise HTTPException(status_code=404, detail="Professional not found")
    return dict(row)


@router.post("", response_model=ProfessionalOut, dependencies=[Depends(require_role("admin"))])
async def create_professional(body: ProfessionalCreate):
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO healthcare_professional (full_name, role, specialization, contact_number, email, is_active)
        VALUES ($1,$2,$3,$4,$5,true) RETURNING *
        """,
        body.full_name, _PROF_ROLE_MAP.get(body.role, body.role), body.specialization, body.contact_number, body.email,
    )
    return dict(row)


@router.put("/{professional_id}", response_model=ProfessionalOut, dependencies=[Depends(require_role("admin"))])
async def update_professional(professional_id: int, body: ProfessionalUpdate):
    pool = await get_pool()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    row = await pool.fetchrow(
        f"UPDATE healthcare_professional SET {set_clause} WHERE professional_id = $1 RETURNING *",
        professional_id, *updates.values(),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Professional not found")
    return dict(row)


@router.delete("/{professional_id}", dependencies=[Depends(require_role("admin"))])
async def deactivate_professional(professional_id: int):
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE healthcare_professional SET is_active = false WHERE professional_id = $1", professional_id
    )
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Professional not found")
    return {"detail": "Professional deactivated"}
