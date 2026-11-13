-- =============================================================
-- SPCRMS — Full Reset Script
-- Order: DROP → CREATE TABLES → SEED → CREATE VIEWS
-- Run this in Supabase SQL editor for a clean demo state.
-- =============================================================


-- =============================================================
-- PART 1: DROP (views first, then tables in reverse FK order)
-- =============================================================

DROP VIEW IF EXISTS v_patient_health_record         CASCADE;
DROP VIEW IF EXISTS v_doctor_workload               CASCADE;
DROP VIEW IF EXISTS v_patient_clinical_summary      CASCADE;
DROP VIEW IF EXISTS v_active_appointments           CASCADE;
DROP VIEW IF EXISTS v_completed_lab_investigations  CASCADE;
DROP VIEW IF EXISTS v_pending_lab_investigations    CASCADE;
DROP VIEW IF EXISTS v_lab_result_full               CASCADE;
DROP VIEW IF EXISTS v_lab_investigation_full        CASCADE;
DROP VIEW IF EXISTS v_prescription_full             CASCADE;
DROP VIEW IF EXISTS v_diagnosis_full                CASCADE;
DROP VIEW IF EXISTS v_appointment_full              CASCADE;

DROP TABLE IF EXISTS lab_report_document       CASCADE;
DROP TABLE IF EXISTS ecg_audio_record          CASCADE;
DROP TABLE IF EXISTS medical_image             CASCADE;
DROP TABLE IF EXISTS notification              CASCADE;
DROP TABLE IF EXISTS clinical_record           CASCADE;
DROP TABLE IF EXISTS lab_result                CASCADE;
DROP TABLE IF EXISTS laboratory_investigation  CASCADE;
DROP TABLE IF EXISTS prescription              CASCADE;
DROP TABLE IF EXISTS diagnosis                 CASCADE;
DROP TABLE IF EXISTS appointment               CASCADE;
DROP TABLE IF EXISTS user_account              CASCADE;
DROP TABLE IF EXISTS healthcare_professional   CASCADE;
DROP TABLE IF EXISTS patient                   CASCADE;


-- =============================================================
-- PART 2: CREATE TABLES
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
    notes           TEXT
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

CREATE TABLE medical_image (
    image_id        SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    appointment_id  INT REFERENCES appointment(appointment_id) ON DELETE SET NULL,
    image_data      BYTEA,
    metadata        JSONB,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ecg_audio_record (
    record_id       SERIAL PRIMARY KEY,
    patient_id      INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    appointment_id  INT REFERENCES appointment(appointment_id) ON DELETE SET NULL,
    record_data     BYTEA,
    metadata        JSONB,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lab_report_document (
    doc_id              SERIAL PRIMARY KEY,
    investigation_id    INT NOT NULL REFERENCES laboratory_investigation(investigation_id) ON DELETE RESTRICT,
    doc_data            BYTEA,
    metadata            JSONB,
    content_tsvector    TSVECTOR,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_account_linked_patient       ON user_account(linked_patient_id);
CREATE INDEX idx_user_account_linked_professional  ON user_account(linked_professional_id);
CREATE INDEX idx_appointment_patient               ON appointment(patient_id);
CREATE INDEX idx_appointment_professional          ON appointment(professional_id);
CREATE INDEX idx_appointment_scheduled_at          ON appointment(scheduled_at);
CREATE INDEX idx_appointment_status                ON appointment(status);
CREATE UNIQUE INDEX uq_appointment_slot ON appointment (professional_id, scheduled_at) WHERE status != 'Cancelled';
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
CREATE INDEX idx_medical_image_patient             ON medical_image(patient_id);
CREATE INDEX idx_medical_image_appointment         ON medical_image(appointment_id);
CREATE INDEX idx_ecg_patient                       ON ecg_audio_record(patient_id);
CREATE INDEX idx_ecg_appointment                   ON ecg_audio_record(appointment_id);
CREATE INDEX idx_lab_doc_investigation             ON lab_report_document(investigation_id);
CREATE INDEX idx_lab_doc_tsvector                  ON lab_report_document USING GIN(content_tsvector);


-- =============================================================
-- PART 3: SEED DATA
-- =============================================================

INSERT INTO patient (full_name, date_of_birth, gender, contact_number, email, address) VALUES
('Arjun Mehta',   '1985-03-12', 'Male',   '+91-9810000001', 'arjun.mehta@example.com',   '12 MG Road, Bengaluru, KA 560001'),
('Priya Sharma',  '1992-07-24', 'Female', '+91-9810000002', 'priya.sharma@example.com',  '34 Park Street, Kolkata, WB 700016'),
('Ravi Iyer',     '1975-11-05', 'Male',   '+91-9810000003', 'ravi.iyer@example.com',     '7 Anna Salai, Chennai, TN 600002'),
('Sunita Patel',  '2000-01-18', 'Female', '+91-9810000004', 'sunita.patel@example.com',  '88 CG Road, Ahmedabad, GJ 380009'),
('Deepak Singh',  '1968-09-30', 'Male',   '+91-9810000005', 'deepak.singh@example.com',  '5 Hazratganj, Lucknow, UP 226001');

INSERT INTO healthcare_professional (full_name, role, specialization, contact_number, email) VALUES
('Dr. Ananya Rao',      'Doctor',         'General Medicine', '+91-9820000001', 'ananya.rao@hospital.com'),
('Dr. Vikram Nair',     'Doctor',         'Cardiology',       '+91-9820000002', 'vikram.nair@hospital.com'),
('Dr. Meena Kulkarni',  'Doctor',         'Endocrinology',    '+91-9820000003', 'meena.kulkarni@hospital.com'),
('Suresh Babu',         'Lab Technician', 'Pathology',        '+91-9820000004', 'suresh.babu@hospital.com');

-- All passwords: Test@1234
INSERT INTO user_account (email, password_hash, role, linked_patient_id, linked_professional_id) VALUES
('admin@hospital.com',          '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Admin',          NULL, NULL),
('ananya.rao@hospital.com',     '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Doctor',         NULL, 1),
('vikram.nair@hospital.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Doctor',         NULL, 2),
('meena.kulkarni@hospital.com', '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Doctor',         NULL, 3),
('suresh.babu@hospital.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Lab Technician', NULL, 4),
('arjun.mehta@example.com',     '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 1, NULL),
('priya.sharma@example.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 2, NULL),
('ravi.iyer@example.com',       '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 3, NULL),
('sunita.patel@example.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 4, NULL),
('deepak.singh@example.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 5, NULL);

INSERT INTO appointment (patient_id, professional_id, scheduled_at, status, notes) VALUES
(1, 1, '2026-10-01 09:00:00+05:30', 'Completed', 'Follow-up for hypertension'),
(2, 1, '2026-10-01 10:00:00+05:30', 'Completed', 'Annual health check'),
(3, 2, '2026-10-02 11:00:00+05:30', 'Completed', 'Chest pain evaluation'),
(4, 3, '2026-10-03 09:30:00+05:30', 'Completed', 'Thyroid follow-up'),
(5, 2, '2026-10-03 14:00:00+05:30', 'Completed', 'ECG review'),
(1, 2, '2026-10-05 10:00:00+05:30', 'Scheduled', 'Echocardiogram review'),
(2, 3, '2026-10-06 11:30:00+05:30', 'Scheduled', 'Diabetes management'),
(3, 1, '2026-10-07 09:00:00+05:30', 'Cancelled', 'Patient requested reschedule'),
(4, 1, '2026-10-08 10:00:00+05:30', 'Scheduled', 'Blood pressure monitoring'),
(5, 3, '2026-10-09 15:00:00+05:30', 'Scheduled', 'HbA1c result review');

INSERT INTO diagnosis (appointment_id, patient_id, condition_name, description, severity) VALUES
(1, 1, 'Hypertension Stage 1',      'BP consistently above 140/90 mmHg; lifestyle modifications advised.', 'Mild'),
(2, 2, 'Iron Deficiency Anaemia',   'Haemoglobin 9.2 g/dL; dietary advice and supplementation started.',  'Moderate'),
(3, 3, 'Stable Angina',             'Exertional chest pain relieved by rest; ECG shows ST changes.',       'Moderate'),
(4, 4, 'Hypothyroidism',            'TSH elevated at 8.2 mIU/L; levothyroxine initiated.',                 'Mild'),
(5, 5, 'Type 2 Diabetes Mellitus',  'FBS 180 mg/dL, HbA1c 8.1%; metformin prescribed.',                   'Moderate');

INSERT INTO prescription (diagnosis_id, patient_id, medication_name, dosage, frequency, duration, notes) VALUES
(1, 1, 'Amlodipine',                '5 mg',    'Once daily',      '90 days',  'Monitor BP weekly'),
(1, 1, 'Losartan',                  '50 mg',   'Once daily',      '90 days',  'Take with water'),
(2, 2, 'Ferrous Sulfate',           '200 mg',  'Twice daily',     '60 days',  'Take on empty stomach'),
(3, 3, 'Aspirin',                   '75 mg',   'Once daily',      '180 days', 'With food'),
(3, 3, 'Isosorbide Mononitrate',    '20 mg',   'Twice daily',     '30 days',  'Avoid sudden posture change'),
(4, 4, 'Levothyroxine',             '50 mcg',  'Once daily (AM)', '90 days',  'Take 30 min before breakfast'),
(5, 5, 'Metformin',                 '500 mg',  'Twice daily',     '90 days',  'With meals');

INSERT INTO laboratory_investigation (appointment_id, patient_id, ordered_by, test_name, test_type, status) VALUES
(1, 1, 1, 'Lipid Profile',                   'Biochemistry',  'Completed'),
(2, 2, 1, 'Complete Blood Count',            'Haematology',   'Completed'),
(3, 3, 2, 'ECG',                             'Cardiology',    'Completed'),
(4, 4, 3, 'Thyroid Panel (TSH, T3, T4)',     'Endocrinology', 'Completed'),
(5, 5, 2, 'Fasting Blood Sugar',             'Biochemistry',  'Completed'),
(5, 5, 2, 'HbA1c',                           'Biochemistry',  'Completed'),
(6, 1, 2, 'Echocardiogram',                  'Cardiology',    'Pending'),
(7, 2, 3, 'HbA1c',                           'Biochemistry',  'Pending');

INSERT INTO lab_result (investigation_id, result_value, unit, reference_range, result_status, entered_by) VALUES
(1, '220',                              'mg/dL',                      '< 200 mg/dL',                              'Abnormal', 4),
(2, '9.2',                              'g/dL',                       '12–16 g/dL (female)',                      'Abnormal', 4),
(3, 'ST depression 1mm in V4-V6',       '',                           'Normal sinus rhythm',                      'Abnormal', 4),
(4, 'TSH: 8.2 | T3: 0.9 | T4: 6.1',   'mIU/L | pg/mL | µg/dL',     'TSH 0.4–4.0 | T3 2.3–4.2 | T4 5.1–14.1', 'Abnormal', 4),
(5, '180',                              'mg/dL',                      '70–100 mg/dL',                             'Abnormal', 4),
(6, '8.1',                              '%',                          '< 5.7%',                                   'Abnormal', 4);

INSERT INTO clinical_record (patient_id, summary_notes) VALUES
(1, 'Stage 1 hypertension diagnosed Oct 2026. Lipid panel abnormal. On Amlodipine + Losartan. Cardiology follow-up scheduled.'),
(2, 'Iron deficiency anaemia. CBC confirmed low Hb. Ferrous sulfate started. Diabetes screening recommended.'),
(3, 'Stable angina with ECG changes. Cardiology management initiated.'),
(4, 'Hypothyroidism confirmed by thyroid panel. Levothyroxine 50 mcg initiated. 3-month TSH recheck planned.'),
(5, 'Type 2 DM with HbA1c 8.1%. Metformin started. Cardiology review for baseline ECG done.');

-- user_id mapping: 1=admin, 2=dr.ananya, 3=dr.vikram, 4=dr.meena, 5=suresh, 6=arjun, 7=priya, 8=ravi, 9=sunita, 10=deepak
INSERT INTO notification (user_id, message, notification_type, is_read) VALUES
(6,  'Your appointment with Dr. Ananya Rao on 01 Oct 2026 at 09:00 has been scheduled.',  'appointment_scheduled', true),
(2,  'New appointment scheduled: Arjun Mehta on 01 Oct 2026 at 09:00.',                   'appointment_scheduled', true),
(7,  'Your appointment with Dr. Ananya Rao on 01 Oct 2026 at 10:00 has been scheduled.',  'appointment_scheduled', true),
(2,  'New appointment scheduled: Priya Sharma on 01 Oct 2026 at 10:00.',                  'appointment_scheduled', true),
(8,  'Your appointment with Dr. Ananya Rao on 07 Oct 2026 at 09:00 has been cancelled.',  'appointment_cancelled', false),
(6,  'Your Lipid Profile results are now available.',                                      'lab_result_available',  false),
(2,  'Lab results for Arjun Mehta (Lipid Profile) have been entered.',                    'lab_result_available',  false),
(7,  'Your Complete Blood Count results are now available.',                               'lab_result_available',  false),
(2,  'Lab results for Priya Sharma (CBC) have been entered.',                              'lab_result_available',  false),
(10, 'Your Fasting Blood Sugar and HbA1c results are now available.',                     'lab_result_available',  false),
(3,  'Lab results for Deepak Singh (FBS + HbA1c) have been entered.',                     'lab_result_available',  false);


-- =============================================================
-- PART 4: VIEWS
-- =============================================================

CREATE VIEW v_appointment_full AS
SELECT
    a.*,
    p.full_name  AS patient_name,
    hp.full_name AS professional_name
FROM appointment a
JOIN patient                  p  ON p.patient_id       = a.patient_id
JOIN healthcare_professional  hp ON hp.professional_id = a.professional_id;


CREATE VIEW v_diagnosis_full AS
SELECT
    d.*,
    p.full_name              AS patient_name,
    a.scheduled_at           AS appointment_scheduled_at,
    hp.full_name             AS doctor_name,
    a.professional_id        AS doctor_id
FROM diagnosis d
JOIN patient                  p  ON p.patient_id       = d.patient_id
JOIN appointment              a  ON a.appointment_id   = d.appointment_id
JOIN healthcare_professional  hp ON hp.professional_id = a.professional_id;


CREATE VIEW v_prescription_full AS
SELECT
    p.*,
    d.condition_name,
    a.scheduled_at::date::text AS appointment_date,
    a.professional_id          AS doctor_id,
    hp.full_name               AS doctor_name,
    pat.full_name              AS patient_name
FROM prescription             p
JOIN diagnosis                d   ON d.diagnosis_id     = p.diagnosis_id
JOIN appointment              a   ON a.appointment_id   = d.appointment_id
JOIN patient                  pat ON pat.patient_id     = p.patient_id
JOIN healthcare_professional  hp  ON hp.professional_id = a.professional_id;


CREATE VIEW v_lab_investigation_full AS
SELECT
    li.*,
    p.full_name  AS patient_name,
    hp.full_name AS ordered_by_name
FROM laboratory_investigation li
JOIN patient                  p  ON p.patient_id       = li.patient_id
JOIN healthcare_professional  hp ON hp.professional_id = li.ordered_by;


CREATE VIEW v_lab_result_full AS
SELECT
    lr.*,
    li.test_name,
    li.test_type,
    li.patient_id,
    li.ordered_by,
    li.appointment_id,
    pat.full_name AS patient_name,
    hp.full_name  AS entered_by_name
FROM lab_result               lr
JOIN laboratory_investigation li  ON li.investigation_id = lr.investigation_id
JOIN patient                  pat ON pat.patient_id      = li.patient_id
JOIN healthcare_professional  hp  ON hp.professional_id  = lr.entered_by;


CREATE VIEW v_pending_lab_investigations AS
SELECT * FROM v_lab_investigation_full WHERE status = 'Pending';


CREATE VIEW v_completed_lab_investigations AS
SELECT
    vli.*,
    lr.result_id,
    lr.result_value,
    lr.unit,
    lr.reference_range,
    lr.result_status,
    lr.entered_by,
    lr.entered_at,
    lr.entered_by_name
FROM v_lab_investigation_full vli
JOIN v_lab_result_full        lr  ON lr.investigation_id = vli.investigation_id;


CREATE VIEW v_active_appointments AS
SELECT * FROM v_appointment_full WHERE status != 'Cancelled';


CREATE VIEW v_patient_clinical_summary AS
SELECT
    p.patient_id,
    p.full_name,
    p.date_of_birth,
    p.gender,
    p.email,
    p.contact_number,
    p.is_active,
    COUNT(DISTINCT a.appointment_id)    AS total_appointments,
    COUNT(DISTINCT d.diagnosis_id)      AS total_diagnoses,
    COUNT(DISTINCT pr.prescription_id)  AS total_prescriptions,
    COUNT(DISTINCT li.investigation_id) AS total_lab_orders,
    MAX(a.scheduled_at)                 AS last_appointment_at
FROM patient p
LEFT JOIN appointment              a  ON a.patient_id  = p.patient_id
LEFT JOIN diagnosis                d  ON d.patient_id  = p.patient_id
LEFT JOIN prescription             pr ON pr.patient_id = p.patient_id
LEFT JOIN laboratory_investigation li ON li.patient_id = p.patient_id
GROUP BY p.patient_id, p.full_name, p.date_of_birth, p.gender,
         p.email, p.contact_number, p.is_active;


CREATE VIEW v_doctor_workload AS
SELECT
    hp.professional_id,
    hp.full_name,
    hp.specialization,
    COUNT(DISTINCT a.appointment_id)                                             AS total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Scheduled' THEN a.appointment_id END)  AS upcoming_appointments,
    COUNT(DISTINCT a.patient_id)                                                 AS distinct_patients,
    COUNT(DISTINCT d.diagnosis_id)                                               AS total_diagnoses,
    COUNT(DISTINCT li.investigation_id)                                          AS total_lab_orders,
    COUNT(DISTINCT CASE WHEN li.status = 'Pending' THEN li.investigation_id END) AS pending_lab_orders
FROM healthcare_professional  hp
LEFT JOIN appointment              a  ON a.professional_id = hp.professional_id
LEFT JOIN diagnosis                d  ON d.appointment_id  = a.appointment_id
LEFT JOIN laboratory_investigation li ON li.ordered_by     = hp.professional_id
WHERE hp.role = 'Doctor'
GROUP BY hp.professional_id, hp.full_name, hp.specialization;


CREATE VIEW v_patient_health_record AS
SELECT
    p.patient_id,
    p.full_name                                      AS patient_name,
    a.appointment_id,
    a.scheduled_at,
    a.status                                         AS appointment_status,
    hp.full_name                                     AS doctor_name,
    hp.specialization                                AS doctor_specialization,
    COUNT(DISTINCT d.diagnosis_id)                   AS diagnoses_count,
    COUNT(DISTINCT pr.prescription_id)               AS prescriptions_count,
    COUNT(DISTINCT li.investigation_id)              AS lab_orders_count,
    COUNT(DISTINCT CASE WHEN li.status = 'Completed' THEN li.investigation_id END) AS completed_lab_orders
FROM patient                  p
JOIN appointment              a   ON a.patient_id       = p.patient_id
JOIN healthcare_professional  hp  ON hp.professional_id = a.professional_id
LEFT JOIN diagnosis            d   ON d.appointment_id  = a.appointment_id
LEFT JOIN prescription         pr  ON pr.diagnosis_id   = d.diagnosis_id
LEFT JOIN laboratory_investigation li ON li.appointment_id = a.appointment_id
GROUP BY p.patient_id, p.full_name, a.appointment_id, a.scheduled_at,
         a.status, hp.full_name, hp.specialization;
