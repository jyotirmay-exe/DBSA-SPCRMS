-- =============================================================
-- SPCRMS — Database Views
-- Encapsulate join logic and business-logic filters in the DB layer.
-- Run once against the live DB (or append to schema.sql on fresh setup).
-- =============================================================

-- Drop all views before recreating (safe re-run)
DROP VIEW IF EXISTS v_lab_result_full              CASCADE;
DROP VIEW IF EXISTS v_lab_investigation_full        CASCADE;
DROP VIEW IF EXISTS v_prescription_full             CASCADE;
DROP VIEW IF EXISTS v_diagnosis_full                CASCADE;
DROP VIEW IF EXISTS v_appointment_full              CASCADE;
DROP VIEW IF EXISTS v_pending_lab_investigations    CASCADE;
DROP VIEW IF EXISTS v_completed_lab_investigations  CASCADE;
DROP VIEW IF EXISTS v_active_appointments           CASCADE;
DROP VIEW IF EXISTS v_patient_clinical_summary      CASCADE;
DROP VIEW IF EXISTS v_doctor_workload               CASCADE;
DROP VIEW IF EXISTS v_patient_health_record         CASCADE;

-- =============================================================
-- JOIN VIEWS — replace inline _JOIN constants in routers
-- =============================================================

-- Appointments enriched with patient + professional names
CREATE VIEW v_appointment_full AS
SELECT
    a.*,
    p.full_name  AS patient_name,
    hp.full_name AS professional_name
FROM appointment a
JOIN patient                  p  ON p.patient_id       = a.patient_id
JOIN healthcare_professional  hp ON hp.professional_id = a.professional_id;


-- Diagnoses enriched with patient name + appointment context
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


-- Prescriptions enriched with diagnosis, appointment date, patient name
CREATE VIEW v_prescription_full AS
SELECT
    p.*,
    d.condition_name,
    a.scheduled_at::date::text AS appointment_date,
    a.professional_id          AS doctor_id,
    hp.full_name               AS doctor_name,
    pat.full_name              AS patient_name
FROM prescription             p
JOIN diagnosis                d   ON d.diagnosis_id    = p.diagnosis_id
JOIN appointment              a   ON a.appointment_id  = d.appointment_id
JOIN patient                  pat ON pat.patient_id    = p.patient_id
JOIN healthcare_professional  hp  ON hp.professional_id = a.professional_id;


-- Lab investigations enriched with patient + ordering doctor names
CREATE VIEW v_lab_investigation_full AS
SELECT
    li.*,
    p.full_name  AS patient_name,
    hp.full_name AS ordered_by_name
FROM laboratory_investigation li
JOIN patient                  p  ON p.patient_id       = li.patient_id
JOIN healthcare_professional  hp ON hp.professional_id = li.ordered_by;


-- Lab results enriched with investigation context, patient, and entering technician
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


-- =============================================================
-- FILTER / BUSINESS-LOGIC VIEWS
-- =============================================================

-- Only Pending lab investigations (lab technician worklist)
CREATE VIEW v_pending_lab_investigations AS
SELECT vli.*
FROM v_lab_investigation_full vli
WHERE vli.status = 'Pending';


-- Completed investigations joined with their result (read-model for result review)
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


-- Active (non-cancelled) appointments — used by forms to populate dropdowns
CREATE VIEW v_active_appointments AS
SELECT *
FROM v_appointment_full
WHERE status != 'Cancelled';


-- =============================================================
-- AGGREGATE / SUMMARY VIEWS
-- =============================================================

-- Per-patient count summary: appointments, diagnoses, prescriptions, lab orders
CREATE VIEW v_patient_clinical_summary AS
SELECT
    p.patient_id,
    p.full_name,
    p.date_of_birth,
    p.gender,
    p.email,
    p.contact_number,
    p.is_active,
    COUNT(DISTINCT a.appointment_id)        AS total_appointments,
    COUNT(DISTINCT d.diagnosis_id)          AS total_diagnoses,
    COUNT(DISTINCT pr.prescription_id)      AS total_prescriptions,
    COUNT(DISTINCT li.investigation_id)     AS total_lab_orders,
    MAX(a.scheduled_at)                     AS last_appointment_at
FROM patient p
LEFT JOIN appointment              a  ON a.patient_id    = p.patient_id
LEFT JOIN diagnosis                d  ON d.patient_id    = p.patient_id
LEFT JOIN prescription             pr ON pr.patient_id   = p.patient_id
LEFT JOIN laboratory_investigation li ON li.patient_id   = p.patient_id
GROUP BY p.patient_id, p.full_name, p.date_of_birth, p.gender,
         p.email, p.contact_number, p.is_active;


-- Per-doctor workload: appointment counts, distinct patients, pending labs ordered
CREATE VIEW v_doctor_workload AS
SELECT
    hp.professional_id,
    hp.full_name,
    hp.specialization,
    COUNT(DISTINCT a.appointment_id)                                        AS total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Scheduled' THEN a.appointment_id END) AS upcoming_appointments,
    COUNT(DISTINCT a.patient_id)                                            AS distinct_patients,
    COUNT(DISTINCT d.diagnosis_id)                                          AS total_diagnoses,
    COUNT(DISTINCT li.investigation_id)                                     AS total_lab_orders,
    COUNT(DISTINCT CASE WHEN li.status = 'Pending' THEN li.investigation_id END) AS pending_lab_orders
FROM healthcare_professional  hp
LEFT JOIN appointment              a  ON a.professional_id = hp.professional_id
LEFT JOIN diagnosis                d  ON d.appointment_id  = a.appointment_id
LEFT JOIN laboratory_investigation li ON li.ordered_by     = hp.professional_id
WHERE hp.role = 'Doctor'
GROUP BY hp.professional_id, hp.full_name, hp.specialization;


-- Full patient health record: one row per appointment, with diagnosis + prescription counts
-- Wide denormalized read-model; useful for patient-facing dashboard and clinical summary export
CREATE VIEW v_patient_health_record AS
SELECT
    p.patient_id,
    p.full_name                                     AS patient_name,
    a.appointment_id,
    a.scheduled_at,
    a.status                                        AS appointment_status,
    hp.full_name                                    AS doctor_name,
    hp.specialization                               AS doctor_specialization,
    COUNT(DISTINCT d.diagnosis_id)                  AS diagnoses_count,
    COUNT(DISTINCT pr.prescription_id)              AS prescriptions_count,
    COUNT(DISTINCT li.investigation_id)             AS lab_orders_count,
    COUNT(DISTINCT CASE WHEN li.status = 'Completed' THEN li.investigation_id END) AS completed_lab_orders
FROM patient                  p
JOIN appointment              a   ON a.patient_id       = p.patient_id
JOIN healthcare_professional  hp  ON hp.professional_id = a.professional_id
LEFT JOIN diagnosis            d   ON d.appointment_id  = a.appointment_id
LEFT JOIN prescription         pr  ON pr.diagnosis_id   = d.diagnosis_id
LEFT JOIN laboratory_investigation li ON li.appointment_id = a.appointment_id
GROUP BY p.patient_id, p.full_name, a.appointment_id, a.scheduled_at,
         a.status, hp.full_name, hp.specialization;
