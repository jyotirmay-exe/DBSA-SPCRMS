# Work Plan and Progress Report

## Smart Patient & Clinical Record Management System

---

**Team Number:** Team 9

**Team Members:**

| Name | ID |
|------|-----|
| Sujal Kumar | 2025SL70040 |
| Jyotirmay Kumar Jha | 2025SL70034 |

**Course Name / Number:** Database Systems and Application — SESAP ZC337

**Date:** 26th September 2026

---

## 1. Problem Statement

### Smart Patient & Clinical Record Management System

Design, develop, and demonstrate a database application for a Smart Patient & Clinical Record Management System to manage patients, healthcare professionals, appointments, diagnoses, prescriptions, laboratory investigations, and clinical records.

The Term 1 implementation shall focus on a structured/text-based relational database. 

In Term 2, progressively extend the database to support multimodal healthcare data such as medical images, laboratory reports, ECG/audio records, and other relevant clinical data.

---

## 2. Planned Approach / Solution / Technology

### Approach

We will build a **full-stack application** backed by a normalized relational database. The
design work proceeds top-down: first the SRS, then an Entity-Relationship / Enhanced-ER
(ER / EER) model of the healthcare domain, then a relational schema normalized to at least
Third Normal Form (3NF), followed by SQL operations and queries, the backend API, and a web
frontend for demonstration.

The core entities identified so far:

- **Patient** — demographics, contact details, medical history summary.
- **Healthcare Professional** — doctors, nurses, lab technicians; role and specialization.
- **Appointment** — links a patient to a professional at a scheduled time, with status.
- **Diagnosis** — condition(s) recorded against an appointment / patient.
- **Prescription** — medications prescribed, linked to a diagnosis / appointment.
- **Laboratory Investigation** — tests ordered, sample details, and results.
- **Clinical Record** — the consolidated record tying the above together per patient visit.

The schema will be deliberately designed so that Term 2's multimodal data (images, report
files, ECG / audio) can be attached to the relevant entities without redesigning the core
model.

### Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Database | **PostgreSQL** | Strong relational features; native `JSONB` and binary (`bytea`) / large-object support that eases the Term 2 extension to multimodal data. |
| Backend / API | **Python + FastAPI** | Fast to develop, clean REST endpoints, automatic API documentation (Swagger). Team is comfortable with Python. |
| Frontend | **React** | Component-based web UI to demonstrate the data and workflows in a browser console. |
| Tooling | Git (version control), pgAdmin / psql, VS Code | Collaboration and standard development environment. |

---

## 3. Plan, Deliverables, and Dates

The project is delivered across two graded milestones:

- **Term 1 — final SRS + working prototype UI:** 17 October 2026
- **Term 2 — complete end-to-end multimodal system:** 28 November 2026

### Term 1 plan (target: 17 October 2026)

| # | Deliverable | Target Date |
|---|-------------|-------------|
| 1 | Finalize requirements and entity list; draft **SRS** (Software Requirements Specification) | 29 Sept 2026 |
| 2 | **ER / EER diagram** of the full domain |  |
| 3 | **Relational schema** (mapping from EER), with keys and constraints |  |
| 4 | Apply **normalization** (up to 3NF / BCNF) and document the normalized design |  |
| 5 | Database created in PostgreSQL; tables + constraints + sample seed data |  |
| 6 | **SQL operations and queries** — DDL, DML, and representative reporting queries |  |
| 7 | Backend API (FastAPI) — CRUD for core entities |  |
| 8 | React frontend — views for patients, appointments, diagnoses, prescriptions, lab results |  |
| 9 | Integration, end-to-end **working prototype** demo + finalized SRS |  |
| 10 | **Term 1 submission — final SRS + prototype UI** | **17 Oct 2026** |

### Term 2 plan (target: 28 November 2026)

| # | Deliverable | Target Date     |
|---|-------------|-----------------|
| 11 | Extend schema for multimodal data — medical images, lab report documents, ECG / audio (time-series / audio); design storage and indexing | Oct-Nov 2026    |
| 12 | Application integration for upload / storage / retrieval of multimodal data | Nov 2026        |
| 13 | **Term 2 submission — complete end-to-end multimodal system** | **28 Nov 2026** |

*(Intermediate dates are indicative and will be adjusted to the lab schedule; the two submission dates are fixed.)*

---

## 4. Progress of Work as on 26th September

The team is in the **initial planning and design phase**. Progress to date:

- **Team formed** and roles discussed. Both members will collaborate on schema design; work on
  the backend and frontend will be split as the project progresses.
- **Problem domain analyzed** — the core entities (Patient, Healthcare Professional,
  Appointment, Diagnosis, Prescription, Laboratory Investigation, Clinical Record) and their
  relationships have been identified.
- **Technology stack selected and agreed** — PostgreSQL, FastAPI, and React (see Section 2),
  chosen for team skill fit and suitability for the Term 2 multimodal extension.
- **Development environment setup in progress** — installing PostgreSQL, Python / FastAPI, and
  setting up a shared Git repository for collaboration.
- **Draft ER model started** — first pass at entities and their relationships is underway;
  will be finalized as the first design deliverable.

No database tables or application code have been implemented yet; this is the immediate next
step per the plan in Section 3.

---

## 5. Issues / Points to Inform Faculty

- **Sample / demo data:** Guidance on whether synthetic sample data is acceptable for the
  demonstration (given real patient data cannot be used for privacy reasons).
- **Term 2 readiness:** Confirmation that designing the Term 1 schema with hooks for multimodal
  data (rather than a strict text-only schema) is acceptable, so the Term 2 extension is
  smoother. We currently intend to target medical images, laboratory report documents, and
  ECG / audio records in Term 2 — we would welcome guidance on whether this set is appropriate.
- No other blockers at this stage.

---
