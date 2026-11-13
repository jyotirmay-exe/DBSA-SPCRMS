# Software Requirements Specification

## Smart Patient & Clinical Record Management System

---

**Team Number:** Team 9

**Team Members:**

| Name | ID |
|------|-----|
| Sujal Kumar | 2025SL70040 |
| Jyotirmay Kumar Jha | 2025SL70034 |

**Course Name / Number:** Database Systems and Application — SESAP ZC337

**Date:** 17 October 2026

**Version:** 1.0

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the Smart Patient & Clinical Record Management System (SPCRMS). It is intended for the course faculty, the development team, and any stakeholder reviewing the system design and prototype.

### 1.2 Scope

SPCRMS is a web-based database application that provides a single, unified system of record for a healthcare setting. It manages patients, healthcare professionals, appointments, diagnoses, prescriptions, laboratory investigations, and clinical records.

The Term 1 implementation focuses on a structured, text-based relational database with a working full-stack prototype. Term 2 will extend the same database to support multimodal healthcare data such as medical images, laboratory report documents, and ECG/audio records.

The system is not a replacement for commercial Electronic Medical Record (EMR) systems. Its purpose is to demonstrate the design, normalization, and application of a relational database at Bloom's levels 5–6, with a clean extensible schema.

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|-----------|
| SRS | Software Requirements Specification |
| EMR | Electronic Medical Record |
| SPCRMS | Smart Patient & Clinical Record Management System |
| ER / EER | Entity-Relationship / Enhanced Entity-Relationship model |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token — used for stateless authentication |
| CRUD | Create, Read, Update, Delete |
| API | Application Programming Interface |
| DDL | Data Definition Language |
| DML | Data Manipulation Language |
| 3NF | Third Normal Form |
| BCNF | Boyce-Codd Normal Form |

### 1.4 References

- BITS Pilani WILP — Database Systems and Application (SESAP ZC337) Capstone Handout
- IEEE Std 830-1998 — Recommended Practice for Software Requirements Specifications
- PostgreSQL 16 Documentation
- FastAPI Documentation

### 1.5 Overview

Section 2 provides an overall description of the system — its context, users, and assumptions. Section 3 specifies the detailed functional and non-functional requirements. An ER summary is provided as an appendix.

---

## 2. Overall Description

### 2.1 Product Perspective

SPCRMS is a standalone web application. It does not integrate with external hospital systems, insurance platforms, or pharmacy systems in Term 1. All data entry is performed through the application interface by authorized users.

The system consists of three tiers:
- **Database:** PostgreSQL — stores all structured clinical and administrative data.
- **Backend API:** Python + FastAPI — exposes REST endpoints; enforces business logic and role-based access.
- **Frontend:** React — browser-based interface for all user roles.

### 2.2 Product Functions

At a high level, the system provides:

- Patient registration and profile management
- Healthcare professional registration and management
- Appointment scheduling and status tracking
- Diagnosis recording linked to appointments
- Prescription management linked to diagnoses
- Laboratory investigation ordering and result entry
- Consolidated clinical record view per patient
- Role-based access control with secure login
- In-app notifications for key events

### 2.3 User Classes and Characteristics

| Role | Description | Access Level |
|------|-------------|-------------|
| **Patient** | Registered patient of the healthcare facility. Limited technical proficiency assumed. | Read-only access to own records |
| **Doctor** | Licensed healthcare professional. Primary creator of diagnoses and prescriptions. | Read/write for their patients' clinical data |
| **Lab Technician** | Healthcare professional responsible for laboratory investigations. | Read pending orders; write lab results |
| **Admin** | System administrator. Manages user accounts and has full system access. | Full access |

### 2.4 Operating Environment

- **Client:** Any modern web browser (Chrome, Firefox, Safari, Edge) on desktop or laptop.
- **Server:** Python 3.11+, FastAPI, Uvicorn ASGI server.
- **Database:** PostgreSQL 15+.
- **Deployment (Term 1):** Local development environment for prototype demonstration. Optional cloud deployment: Neon (DB) + Render (backend) + Vercel (frontend).
- **Platform:** Web only. No mobile application in Term 1.

### 2.5 Assumptions and Dependencies

- All users access the system via a web browser; no native mobile app is required.
- Synthetic or de-identified data will be used for demonstration; no real patient data is used.
- A single healthcare facility context is assumed; multi-tenant / multi-facility support is out of scope.
- Network connectivity is available between the frontend, backend, and database.
- Email and SMS notification delivery is out of scope for Term 1; in-app notifications only.

### 2.6 Out of Scope

The following are explicitly excluded from this system:

- Billing, payments, and invoicing
- Insurance claims processing
- Pharmacy dispensing and inventory management
- Telemedicine and video consultation
- Integration with external laboratory systems or third-party EMR platforms
- Mobile application (iOS / Android)
- Email or SMS notifications (deferred to future enhancement)

---

## 3. Specific Requirements

### 3.1 Functional Requirements

Requirements are grouped by feature module.

---

#### FR-01: User Authentication and Authorization

| ID | Requirement |
|----|-------------|
| FR-01.1 | The system shall allow users to log in using a registered email address and password. |
| FR-01.2 | The system shall authenticate users via JWT tokens with a configurable expiry. |
| FR-01.3 | The system shall enforce role-based access control (RBAC) — Patient, Doctor, Lab Technician, Admin. |
| FR-01.4 | The system shall deny access to any resource not permitted for the authenticated user's role. |
| FR-01.5 | The system shall allow users to log out, invalidating their session token. |
| FR-01.6 | The Admin shall be able to reset a user's password. |

---

#### FR-02: Patient Management

| ID | Requirement |
|----|-------------|
| FR-02.1 | The Admin shall be able to register a new patient with demographics: full name, date of birth, gender, contact number, email, and address. |
| FR-02.2 | The Admin and Doctor shall be able to view a patient's profile. |
| FR-02.3 | The Admin shall be able to update patient profile details. |
| FR-02.4 | The system shall assign a unique patient ID to each registered patient. |
| FR-02.5 | A Patient shall be able to view their own profile only. |
| FR-02.6 | The Admin shall be able to deactivate (not delete) a patient account. |

---

#### FR-03: Healthcare Professional Management

| ID | Requirement |
|----|-------------|
| FR-03.1 | The Admin shall be able to register a healthcare professional with: full name, role (Doctor / Lab Technician), specialization, contact number, and email. |
| FR-03.2 | The Admin shall be able to view and update healthcare professional profiles. |
| FR-03.3 | The system shall assign a unique professional ID to each registered healthcare professional. |
| FR-03.4 | The Admin shall be able to deactivate a healthcare professional account. |

---

#### FR-04: Appointment Management

| ID | Requirement |
|----|-------------|
| FR-04.1 | The Admin or Doctor shall be able to schedule an appointment for a patient with a specific doctor, date, and time. |
| FR-04.2 | The system shall record appointment status: Scheduled, Completed, Cancelled. |
| FR-04.3 | The Doctor shall be able to update the status of their appointments. |
| FR-04.4 | The Admin shall be able to cancel any appointment. |
| FR-04.5 | A Patient shall be able to view their own upcoming and past appointments. |
| FR-04.6 | A Doctor shall be able to view all appointments assigned to them. |
| FR-04.7 | The system shall prevent scheduling two appointments for the same doctor at the same date and time. |

---

#### FR-05: Diagnosis Management

| ID | Requirement |
|----|-------------|
| FR-05.1 | A Doctor shall be able to record one or more diagnoses against a completed appointment. |
| FR-05.2 | Each diagnosis shall include: condition name, description, severity, and date recorded. |
| FR-05.3 | A Doctor shall be able to view and update diagnoses for their patients. |
| FR-05.4 | A Patient shall be able to view their own diagnoses. |
| FR-05.5 | The Admin shall be able to view all diagnoses. |

---

#### FR-06: Prescription Management

| ID | Requirement |
|----|-------------|
| FR-06.1 | A Doctor shall be able to create a prescription linked to a diagnosis, specifying: medication name, dosage, frequency, duration, and notes. |
| FR-06.2 | A Doctor shall be able to view and update prescriptions for their patients. |
| FR-06.3 | A Patient shall be able to view their own prescriptions. |
| FR-06.4 | The Admin shall be able to view all prescriptions. |

---

#### FR-07: Laboratory Investigation Management

| ID | Requirement |
|----|-------------|
| FR-07.1 | A Doctor shall be able to order a laboratory investigation for a patient, specifying: test name, type, and notes. |
| FR-07.2 | A Lab Technician shall be able to view all pending laboratory investigation orders. |
| FR-07.3 | A Lab Technician shall be able to enter results for a completed investigation, including: result value, unit, reference range, and status (Normal / Abnormal). |
| FR-07.4 | A Doctor shall be able to view lab results for their patients. |
| FR-07.5 | A Patient shall be able to view their own lab results. |
| FR-07.6 | The system shall record the date and time results were entered. |

---

#### FR-08: Clinical Record

| ID | Requirement |
|----|-------------|
| FR-08.1 | The system shall maintain a consolidated clinical record per patient, linking their appointments, diagnoses, prescriptions, and lab investigations. |
| FR-08.2 | A Doctor shall be able to view the complete clinical history of their patients. |
| FR-08.3 | A Patient shall be able to view their own complete clinical record. |
| FR-08.4 | The Admin shall be able to view all clinical records. |

---

#### FR-09: In-App Notifications

| ID | Requirement |
|----|-------------|
| FR-09.1 | The system shall generate an in-app notification for a Patient when an appointment is scheduled or cancelled. |
| FR-09.2 | The system shall generate an in-app notification for a Doctor when a new appointment is assigned to them. |
| FR-09.3 | The system shall generate an in-app notification for a Patient when lab results are available. |
| FR-09.4 | The system shall generate an in-app notification for a Doctor when lab results for their patient are entered. |
| FR-09.5 | Users shall be able to view unread and read notifications via a notification panel. |
| FR-09.6 | Users shall be able to mark notifications as read. |

---

#### FR-10: Admin — User Management

| ID | Requirement |
|----|-------------|
| FR-10.1 | The Admin shall be able to create user accounts for all roles. |
| FR-10.2 | The Admin shall be able to assign and update roles for existing users. |
| FR-10.3 | The Admin shall be able to deactivate user accounts without deleting them. |
| FR-10.4 | The Admin shall be able to view a list of all registered users with their roles and status. |

---

### 3.2 Non-Functional Requirements

#### NFR-01: Security

| ID | Requirement |
|----|-------------|
| NFR-01.1 | All passwords shall be stored as salted hashes (bcrypt). Plain-text passwords shall never be stored. |
| NFR-01.2 | All API endpoints shall require a valid JWT token except the login endpoint. |
| NFR-01.3 | Role-based access shall be enforced on the backend — frontend role-hiding alone is not sufficient. |
| NFR-01.4 | Database credentials and secret keys shall be stored in environment variables, not in source code. |

#### NFR-02: Reliability and Data Integrity

| ID | Requirement |
|----|-------------|
| NFR-02.1 | The database shall enforce referential integrity via foreign key constraints. |
| NFR-02.2 | All critical operations (create appointment, record diagnosis, enter lab result) shall execute within a database transaction — committed fully or rolled back on failure. |
| NFR-02.3 | Unique constraints shall prevent duplicate records (e.g., two appointments for the same doctor at the same slot). |

#### NFR-03: Usability

| ID | Requirement |
|----|-------------|
| NFR-03.1 | The web interface shall be usable on any modern desktop browser without requiring installation of additional plugins. |
| NFR-03.2 | All forms shall display clear validation error messages inline when input is invalid. |
| NFR-03.3 | Navigation between modules (patients, appointments, diagnoses, prescriptions, lab results) shall require no more than two clicks from any main screen. |

#### NFR-04: Performance

| ID | Requirement |
|----|-------------|
| NFR-04.1 | API responses for standard read operations (patient list, appointment list) shall complete within 2 seconds under normal prototype load. |
| NFR-04.2 | The database schema shall include indexes on frequently queried foreign keys (patient_id, appointment_id, professional_id) to support efficient joins. |

#### NFR-05: Maintainability

| ID | Requirement |
|----|-------------|
| NFR-05.1 | The codebase shall be version-controlled in a shared Git repository. |
| NFR-05.2 | The database schema shall be documented alongside the ER / EER diagram. |
| NFR-05.3 | The Term 1 relational schema shall be designed to allow Term 2 multimodal tables to be added without altering existing tables. |

---

### 3.3 External Interface Requirements

#### 3.3.1 User Interface

- Web-based React single-page application (SPA).
- Role-specific dashboards: each role sees only the modules relevant to their access level.
- Screens required:
  - Login
  - Admin dashboard: user management, patient list, professional list
  - Doctor dashboard: appointment list, patient records, diagnosis + prescription entry, lab order + results
  - Lab Technician dashboard: pending orders, result entry
  - Patient dashboard: appointments, diagnoses, prescriptions, lab results, notifications
  - Notification panel (all roles)

#### 3.3.2 Software Interfaces

| Interface | Details |
|-----------|---------|
| Frontend ↔ Backend | REST API over HTTP/HTTPS. JSON request/response. JWT in Authorization header. |
| Backend ↔ Database | PostgreSQL via `asyncpg` or `psycopg2` driver from FastAPI. |
| API Documentation | Auto-generated Swagger UI at `/docs` (FastAPI default). |

#### 3.3.3 Hardware Interfaces

No specialized hardware interfaces. Standard server/client web architecture.

---

## Appendix A: Core Entity Summary (Term 1)

The following entities form the Term 1 relational schema. Full ER / EER diagram and normalized schema are separate deliverables.

| Entity | Key Attributes |
|--------|---------------|
| **Patient** | patient_id (PK), full_name, date_of_birth, gender, contact_number, email, address, is_active |
| **Healthcare Professional** | professional_id (PK), full_name, role, specialization, contact_number, email, is_active |
| **User Account** | user_id (PK), email, password_hash, role, linked_id (FK to Patient or Professional), is_active |
| **Appointment** | appointment_id (PK), patient_id (FK), professional_id (FK), scheduled_at, status, notes |
| **Diagnosis** | diagnosis_id (PK), appointment_id (FK), patient_id (FK), condition_name, description, severity, recorded_at |
| **Prescription** | prescription_id (PK), diagnosis_id (FK), patient_id (FK), medication_name, dosage, frequency, duration, notes |
| **Laboratory Investigation** | investigation_id (PK), appointment_id (FK), patient_id (FK), ordered_by (FK → professional), test_name, test_type, status, ordered_at |
| **Lab Result** | result_id (PK), investigation_id (FK), result_value, unit, reference_range, result_status, entered_by (FK → professional), entered_at |
| **Clinical Record** | record_id (PK), patient_id (FK), created_at, summary_notes |
| **Notification** | notification_id (PK), user_id (FK), message, notification_type, is_read, created_at |

---

## Appendix B: Term 2 Extension Plan (Multimodal)

The following tables will be added in Term 2 without altering Term 1 tables:

| Entity | Storage | Notes |
|--------|---------|-------|
| **Medical Image** | `bytea` + JSONB metadata | Linked to patient_id and appointment_id |
| **ECG / Audio Record** | `bytea` + JSONB metadata | TimescaleDB extension for time-series signal data |
| **Lab Report Document** | `bytea` + JSONB metadata | PDF/document storage; `tsvector` for full-text search |

---

