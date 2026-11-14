from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db import get_pool, close_pool
from app.routers import auth, patients, professionals, appointments, diagnoses, prescriptions, lab_investigations, lab_results, clinical_records, notifications
from app.routers import medical_images, ecg_records


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(
    title="Smart Patient & Clinical Record Management System",
    version="1.0.0",
    lifespan=lifespan,
)

import os

_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]
_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url:
    _origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(professionals.router)
app.include_router(appointments.router)
app.include_router(diagnoses.router)
app.include_router(prescriptions.router)
app.include_router(lab_investigations.router)
app.include_router(lab_results.router)
app.include_router(clinical_records.router)
app.include_router(notifications.router)
app.include_router(medical_images.router)
app.include_router(ecg_records.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
