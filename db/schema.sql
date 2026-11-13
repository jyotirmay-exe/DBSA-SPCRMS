-- =============================================================
-- SPCRMS — Smart Patient & Clinical Record Management System
-- PostgreSQL DDL — Term 1 (structured) + Term 2 (multimodal stubs)
-- =============================================================

-- Enable pgcrypto for password hashing (optional helper)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- TERM 1 TABLES
-- =============================================================

CREATE TABLE patient (
    patient_id      SERIAL PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')) NOT NULL,
    contact_number  VARCHAR(20),
    email           VARCHAR(255) UNIQUE NOT NULL,
    address         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE healthcare_professional (
    professional_id SERIAL PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50) CHECK (role IN ('Doctor', 'Lab Technician')) NOT NULL,
    specialization  VARCHAR(255),
    contact_number  VARCHAR(20),
    email           VARCHAR(255) UNIQUE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE user_account (
    user_id                 SERIAL PRIMARY KEY,
    email                   VARCHAR(255) UNIQUE NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    role                    VARCHAR(50) CHECK (role IN ('Patient', 'Doctor', 'Lab Technician', 'Admin')) NOT NULL,
    linked_patient_id       INT REFERENCES patient(patient_id) ON DELETE SET NULL,
    linked_professional_id  INT REFERENCES healthcare_professional(professional_id) ON DELETE SET NULL,
    is_active               BOOLEAN NOT NULL DEFAULT true,
    -- A user is linked to at most one profile
    CONSTRAINT user_single_link CHECK (
        (linked_patient_id IS NULL OR linked_professional_id IS NULL)
    )
);

CREATE TABLE appointment (
    appointment_id  SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    professional_id INT NOT NULL REFERENCES healthcare_professional(professional_id) ON DELETE RESTRICT,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')) NOT NULL DEFAULT 'Scheduled',
    notes           TEXT,
    -- FR-04.7: prevent double-booking same doctor same slot
    UNIQUE (professional_id, scheduled_at)
);

CREATE TABLE diagnosis (
    diagnosis_id    SERIAL PRIMARY KEY,
    appointment_id  INT NOT NULL REFERENCES appointment(appointment_id) ON DELETE RESTRICT,
    patient_id      INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    condition_name  VARCHAR(255) NOT NULL,
    description     TEXT,
    severity        VARCHAR(20) CHECK (severity IN ('Mild', 'Moderate', 'Severe')) NOT NULL,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prescription (
    prescription_id SERIAL PRIMARY KEY,
    diagnosis_id    INT NOT NULL REFERENCES diagnosis(diagnosis_id) ON DELETE RESTRICT,
    patient_id      INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    medication_name VARCHAR(255) NOT NULL,
    dosage          VARCHAR(100) NOT NULL,
    frequency       VARCHAR(100) NOT NULL,
    duration        VARCHAR(100) NOT NULL,
    notes           TEXT
);

CREATE TABLE laboratory_investigation (
    investigation_id    SERIAL PRIMARY KEY,
    appointment_id      INT NOT NULL REFERENCES appointment(appointment_id) ON DELETE RESTRICT,
    patient_id          INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    ordered_by          INT NOT NULL REFERENCES healthcare_professional(professional_id) ON DELETE RESTRICT,
    test_name           VARCHAR(255) NOT NULL,
    test_type           VARCHAR(255) NOT NULL,
    status              VARCHAR(20) CHECK (status IN ('Pending', 'Completed')) NOT NULL DEFAULT 'Pending',
    ordered_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lab_result (
    result_id           SERIAL PRIMARY KEY,
    investigation_id    INT NOT NULL UNIQUE REFERENCES laboratory_investigation(investigation_id) ON DELETE RESTRICT,
    result_value        VARCHAR(255) NOT NULL,
    unit                VARCHAR(50),
    reference_range     VARCHAR(100),
    result_status       VARCHAR(20) CHECK (result_status IN ('Normal', 'Abnormal')) NOT NULL,
    entered_by          INT NOT NULL REFERENCES healthcare_professional(professional_id) ON DELETE RESTRICT,
    entered_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinical_record (
    record_id       SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    summary_notes   TEXT
);

CREATE TABLE notification (
    notification_id     SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
    message             TEXT NOT NULL,
    notification_type   VARCHAR(100) NOT NULL,
    is_read             BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- INDEXES — all FK columns
-- =============================================================

CREATE INDEX idx_user_account_linked_patient       ON user_account(linked_patient_id);
CREATE INDEX idx_user_account_linked_professional  ON user_account(linked_professional_id);

CREATE INDEX idx_appointment_patient               ON appointment(patient_id);
CREATE INDEX idx_appointment_professional          ON appointment(professional_id);
CREATE INDEX idx_appointment_scheduled_at          ON appointment(scheduled_at);
CREATE INDEX idx_appointment_status               ON appointment(status);

CREATE INDEX idx_diagnosis_appointment             ON diagnosis(appointment_id);
CREATE INDEX idx_diagnosis_patient                 ON diagnosis(patient_id);

CREATE INDEX idx_prescription_diagnosis            ON prescription(diagnosis_id);
CREATE INDEX idx_prescription_patient              ON prescription(patient_id);

CREATE INDEX idx_lab_investigation_appointment     ON laboratory_investigation(appointment_id);
CREATE INDEX idx_lab_investigation_patient         ON laboratory_investigation(patient_id);
CREATE INDEX idx_lab_investigation_ordered_by      ON laboratory_investigation(ordered_by);
CREATE INDEX idx_lab_investigation_status          ON laboratory_investigation(status);

CREATE INDEX idx_lab_result_entered_by             ON lab_result(entered_by);

CREATE INDEX idx_clinical_record_patient           ON clinical_record(patient_id);

CREATE INDEX idx_notification_user                 ON notification(user_id);
CREATE INDEX idx_notification_is_read              ON notification(is_read);

-- =============================================================
-- TERM 2 MULTIMODAL TABLES (schema-ready stubs, not populated in Term 1)
-- =============================================================

CREATE TABLE medical_image (
    image_id        SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    appointment_id  INT REFERENCES appointment(appointment_id) ON DELETE SET NULL,
    image_data      BYTEA,                          -- stored inline; swap for file path in production
    metadata        JSONB,                          -- modality, body_part, captured_at, etc.
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ecg_audio_record (
    record_id       SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    appointment_id  INT REFERENCES appointment(appointment_id) ON DELETE SET NULL,
    record_data     BYTEA,                          -- raw ECG/audio bytes
    metadata        JSONB,                          -- sample_rate, duration_sec, lead_count, etc.
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lab_report_document (
    doc_id              SERIAL PRIMARY KEY,
    investigation_id    INT NOT NULL REFERENCES laboratory_investigation(investigation_id) ON DELETE RESTRICT,
    doc_data            BYTEA,                      -- PDF/image bytes
    metadata            JSONB,                      -- file_name, mime_type, file_size_bytes, etc.
    content_tsvector    TSVECTOR,                   -- populated via trigger or application after OCR
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_image_patient         ON medical_image(patient_id);
CREATE INDEX idx_medical_image_appointment     ON medical_image(appointment_id);

CREATE INDEX idx_ecg_patient                   ON ecg_audio_record(patient_id);
CREATE INDEX idx_ecg_appointment               ON ecg_audio_record(appointment_id);

CREATE INDEX idx_lab_doc_investigation         ON lab_report_document(investigation_id);
CREATE INDEX idx_lab_doc_tsvector              ON lab_report_document USING GIN(content_tsvector);
