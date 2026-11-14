"""
seed_media.py — reset + reseed multimodal data.

Deletes ALL rows from medical_image and ecg_audio_record, then inserts
a fresh ECG for patient 3 (Ravi Iyer, 80 bpm).

Usage:
  python seed_media.py

Requires: numpy, asyncpg, python-dotenv
"""

import asyncio
import csv
import io
import json
import os
import sys

import asyncpg
import numpy as np
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("DATABASE_URL not set. Ensure .env is present.")

TARGET_PATIENT_ID = 3
TARGET_BPM = 80
TARGET_FNAME = "ecg_ravi_iyer_80bpm.csv"


def generate_ecg_csv(heart_rate: int = 80, duration_sec: int = 10, sample_rate: int = 500) -> bytes:
    t = np.linspace(0, duration_sec, duration_sec * sample_rate)
    period = 60.0 / heart_rate
    mv = np.zeros_like(t)
    for beat_t in np.arange(0, duration_sec, period):
        bt = t - beat_t
        mv += 0.15 * np.exp(-((bt - 0.10) ** 2) / (2 * 0.015 ** 2))
        mv -= 0.20 * np.exp(-((bt - 0.25) ** 2) / (2 * 0.005 ** 2))
        mv += 1.00 * np.exp(-((bt - 0.30) ** 2) / (2 * 0.005 ** 2))
        mv -= 0.10 * np.exp(-((bt - 0.35) ** 2) / (2 * 0.005 ** 2))
        mv += 0.30 * np.exp(-((bt - 0.45) ** 2) / (2 * 0.030 ** 2))
    mv += np.random.default_rng(heart_rate).normal(0, 0.02, len(t))

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["time_ms", "lead_II_mV"])
    for ti, v in zip(t, mv):
        w.writerow([round(float(ti) * 1000, 2), round(float(v), 4)])
    return buf.getvalue().encode()


async def reset_and_seed():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # verify target patient exists
        exists = await conn.fetchval(
            "SELECT 1 FROM patient WHERE patient_id = $1", TARGET_PATIENT_ID
        )
        if not exists:
            sys.exit(f"Patient {TARGET_PATIENT_ID} not found. Run reset.sql first.")

        # wipe all multimodal data
        deleted_img = await conn.execute("DELETE FROM medical_image")
        deleted_ecg = await conn.execute("DELETE FROM ecg_audio_record")
        print(f"  cleared medical_image ({deleted_img})")
        print(f"  cleared ecg_audio_record ({deleted_ecg})")

        # insert fresh ECG for Ravi Iyer
        data = generate_ecg_csv(heart_rate=TARGET_BPM)
        meta = json.dumps({
            "file_name": TARGET_FNAME,
            "mime_type": "text/csv",
            "file_size_bytes": len(data),
            "sample_rate": 500,
            "duration_sec": 10,
            "lead_count": 1,
            "heart_rate_bpm": TARGET_BPM,
        })
        await conn.execute(
            "INSERT INTO ecg_audio_record (patient_id, record_data, metadata) VALUES ($1, $2, $3)",
            TARGET_PATIENT_ID, data, meta,
        )
        print(f"  inserted ECG {TARGET_FNAME} → patient {TARGET_PATIENT_ID} ({len(data)} bytes)")
        print("Done.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(reset_and_seed())
