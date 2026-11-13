"""
seed_media.py — insert synthetic ECG CSVs and optional X-ray JPEGs into the DB.

Usage:
  python seed_media.py                      # ECG only (auto-generated)
  python seed_media.py --xrays db/seed_media/xrays/  # ECG + X-rays from a directory

Place JPEG files in the --xrays directory, one per patient (patient IDs 1, 2, 3 are used).
Requires: numpy, asyncpg, python-dotenv (all already in requirements.txt)
"""

import argparse
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


def generate_ecg_csv(heart_rate: int = 70, duration_sec: int = 10, sample_rate: int = 500) -> bytes:
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


async def seed(xrays_dir: str | None):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # verify patients 1–3 exist
        existing = await conn.fetch("SELECT patient_id FROM patient WHERE patient_id = ANY($1)", [1, 2, 3])
        existing_ids = {r["patient_id"] for r in existing}
        if not existing_ids:
            print("No patients with IDs 1–3 found. Skipping seed.")
            return

        # ECG records
        ecg_params = [
            (1, 70, "ecg_patient1_70bpm.csv"),
            (2, 75, "ecg_patient2_75bpm.csv"),
            (3, 80, "ecg_patient3_80bpm.csv"),
        ]
        for patient_id, bpm, fname in ecg_params:
            if patient_id not in existing_ids:
                print(f"  skip ECG for patient {patient_id} (not in DB)")
                continue
            # skip if already seeded
            already = await conn.fetchval(
                "SELECT 1 FROM ecg_audio_record WHERE patient_id = $1 AND metadata->>'file_name' = $2",
                patient_id, fname,
            )
            if already:
                print(f"  skip ECG {fname} (already seeded)")
                continue
            data = generate_ecg_csv(heart_rate=bpm)
            meta = json.dumps({
                "file_name": fname,
                "mime_type": "text/csv",
                "file_size_bytes": len(data),
                "sample_rate": 500,
                "duration_sec": 10,
                "lead_count": 1,
                "heart_rate_bpm": bpm,
            })
            await conn.execute(
                "INSERT INTO ecg_audio_record (patient_id, record_data, metadata) VALUES ($1, $2, $3)",
                patient_id, data, meta,
            )
            print(f"  inserted ECG {fname} ({len(data)} bytes)")

        # X-ray images (optional)
        if xrays_dir:
            xray_files = sorted(
                f for f in os.listdir(xrays_dir)
                if f.lower().endswith((".jpg", ".jpeg", ".png"))
            )
            for i, fname in enumerate(xray_files[:3]):
                patient_id = i + 1
                if patient_id not in existing_ids:
                    print(f"  skip X-ray {fname} for patient {patient_id} (not in DB)")
                    continue
                already = await conn.fetchval(
                    "SELECT 1 FROM medical_image WHERE patient_id = $1 AND metadata->>'file_name' = $2",
                    patient_id, fname,
                )
                if already:
                    print(f"  skip X-ray {fname} (already seeded)")
                    continue
                path = os.path.join(xrays_dir, fname)
                with open(path, "rb") as f:
                    data = f.read()
                mime = "image/png" if fname.lower().endswith(".png") else "image/jpeg"
                meta = json.dumps({
                    "file_name": fname,
                    "mime_type": mime,
                    "file_size_bytes": len(data),
                    "modality": "X-Ray",
                    "body_part": "Chest",
                })
                await conn.execute(
                    "INSERT INTO medical_image (patient_id, image_data, metadata) VALUES ($1, $2, $3)",
                    patient_id, data, meta,
                )
                print(f"  inserted X-ray {fname} → patient {patient_id} ({len(data)} bytes)")
        else:
            print("  no --xrays dir given; skipping image seed (upload via UI)")

        print("Seed complete.")
    finally:
        await conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--xrays", default=None, help="Directory containing JPEG/PNG X-ray files")
    args = parser.parse_args()
    asyncio.run(seed(args.xrays))
