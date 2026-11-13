from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated

from app.auth import get_current_user, CurrentUser
from app.db import get_pool
from app.models.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/unread-count")
async def unread_count(current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    count = await pool.fetchval(
        "SELECT COUNT(*) FROM notification WHERE user_id = $1 AND is_read = false",
        current_user.user_id,
    )
    return {"count": count}


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    skip: int = 0,
    limit: int = 50,
    current_user: CurrentUser = Depends(get_current_user),
):
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT * FROM notification WHERE user_id = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3",
        current_user.user_id, skip, limit,
    )
    return [dict(r) for r in rows]


@router.put("/read-all", response_model=dict)
async def mark_all_read(current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    await pool.execute(
        "UPDATE notification SET is_read = true WHERE user_id = $1 AND is_read = false",
        current_user.user_id,
    )
    return {"detail": "All notifications marked as read"}


@router.put("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(notification_id: int, current_user: CurrentUser = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(
        "UPDATE notification SET is_read = true WHERE notification_id = $1 AND user_id = $2 RETURNING *",
        notification_id, current_user.user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    return dict(row)
