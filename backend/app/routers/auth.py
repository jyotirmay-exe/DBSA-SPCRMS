from fastapi import APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from fastapi import Depends

from app.auth import verify_password, create_access_token, get_current_user, require_role, hash_password, CurrentUser
from app.db import get_pool
from app.models.user import Token, UserCreate, UserOut, UserUpdate, PasswordReset

router = APIRouter(prefix="/auth", tags=["auth"])

_SELECT_USER = """
    SELECT user_id, email, role,
           COALESCE(linked_patient_id, linked_professional_id) AS linked_id,
           is_active
    FROM user_account
"""


@router.post("/login", response_model=Token)
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()]):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT user_id, password_hash, is_active FROM user_account WHERE email = $1",
        form.username,
    )
    if not row or not row["is_active"] or not verify_password(form.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(row["user_id"])})
    return Token(access_token=token)


_ROLE_MAP = {
    "patient": "Patient",
    "doctor": "Doctor",
    "lab_technician": "Lab Technician",
    "admin": "Admin",
}


@router.post("/users", response_model=UserOut, dependencies=[Depends(require_role("admin"))])
async def create_user(body: UserCreate):
    pool = await get_pool()
    db_role = _ROLE_MAP.get(body.role, body.role)
    if db_role == "Patient":
        linked_patient_id = body.linked_id
        linked_professional_id = None
    elif db_role in ("Doctor", "Lab Technician"):
        linked_patient_id = None
        linked_professional_id = body.linked_id
    else:
        linked_patient_id = None
        linked_professional_id = None

    try:
        row = await pool.fetchrow(
            """
            INSERT INTO user_account (email, password_hash, role, linked_patient_id, linked_professional_id, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING user_id, email, role,
                      COALESCE(linked_patient_id, linked_professional_id) AS linked_id,
                      is_active
            """,
            body.email, hash_password(body.password), db_role,
            linked_patient_id, linked_professional_id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    d = dict(row)
    d["role"] = d["role"].lower().replace(" ", "_")
    return d


@router.get("/users", response_model=list[UserOut], dependencies=[Depends(require_role("admin"))])
async def list_users(skip: int = 0, limit: int = 50):
    pool = await get_pool()
    rows = await pool.fetch(
        _SELECT_USER + "ORDER BY user_id OFFSET $1 LIMIT $2",
        skip, limit,
    )
    result = []
    for r in rows:
        d = dict(r)
        d["role"] = d["role"].lower().replace(" ", "_")
        result.append(d)
    return result


@router.put("/users/{user_id}", response_model=UserOut, dependencies=[Depends(require_role("admin"))])
async def update_user(user_id: int, body: UserUpdate):
    pool = await get_pool()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = list(updates.values())
    row = await pool.fetchrow(
        f"UPDATE user_account SET {set_clause} WHERE user_id = $1 "
        f"RETURNING user_id, email, role, "
        f"COALESCE(linked_patient_id, linked_professional_id) AS linked_id, is_active",
        user_id, *values,
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)


@router.post("/users/{user_id}/reset-password", dependencies=[Depends(require_role("admin"))])
async def reset_password(user_id: int, body: PasswordReset):
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE user_account SET password_hash = $2 WHERE user_id = $1",
        user_id, hash_password(body.new_password),
    )
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "Password updated"}


@router.get("/me", response_model=UserOut)
async def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    pool = await get_pool()
    row = await pool.fetchrow(
        _SELECT_USER + "WHERE user_id = $1",
        current_user.user_id,
    )
    d = dict(row)
    d["role"] = d["role"].lower().replace(" ", "_")
    return d
