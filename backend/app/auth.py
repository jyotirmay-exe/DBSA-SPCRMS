from datetime import datetime, timedelta
from typing import Annotated
import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.db import get_pool

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY", "changeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


class CurrentUser:
    def __init__(self, user_id: int, email: str, role: str, linked_id: int | None):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.linked_id = linked_id


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> CurrentUser:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    pool = await get_pool()
    row = await pool.fetchrow(
        """SELECT user_id, email, role,
                  COALESCE(linked_patient_id, linked_professional_id) AS linked_id,
                  is_active
           FROM user_account WHERE user_id = $1""",
        int(user_id),
    )
    if row is None or not row["is_active"]:
        raise credentials_exc
    return CurrentUser(
        user_id=row["user_id"],
        email=row["email"],
        role=row["role"].lower().replace(" ", "_"),  # 'Lab Technician' -> 'lab_technician'
        linked_id=row["linked_id"],
    )


def require_role(*roles: str):
    async def _check(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return _check
