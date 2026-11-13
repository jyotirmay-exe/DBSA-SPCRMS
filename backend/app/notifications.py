# notification helper used by routers
import asyncpg


async def create_notification(conn: asyncpg.Connection, user_id: int, message: str, notification_type: str):
    await conn.execute(
        """
        INSERT INTO notification (user_id, message, notification_type, is_read, created_at)
        VALUES ($1, $2, $3, false, now())
        """,
        user_id, message, notification_type,
    )


async def get_user_id_for_patient(conn: asyncpg.Connection, patient_id: int) -> int | None:
    row = await conn.fetchrow(
        "SELECT user_id FROM user_account WHERE linked_patient_id = $1 AND role = 'Patient'", patient_id
    )
    return row["user_id"] if row else None


async def get_user_id_for_professional(conn: asyncpg.Connection, professional_id: int) -> int | None:
    row = await conn.fetchrow(
        "SELECT user_id FROM user_account WHERE linked_professional_id = $1 AND role IN ('Doctor','Lab Technician')",
        professional_id,
    )
    return row["user_id"] if row else None
