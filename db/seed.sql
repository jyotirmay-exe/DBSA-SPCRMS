-- =============================================================
-- SPCRMS — Seed Data
-- Applies after schema.sql
-- Password hash placeholder: bcrypt cost 12 — replace with real hashes in production
-- =============================================================

-- --------------------------------------------------------
-- PATIENTS (5)
-- --------------------------------------------------------
INSERT INTO patient (full_name, date_of_birth, gender, contact_number, email, address) VALUES
('Arjun Mehta',    '1985-03-12', 'Male',   '+91-9810000001', 'arjun.mehta@example.com',    '12 MG Road, Bengaluru, KA 560001'),
('Priya Sharma',   '1992-07-24', 'Female', '+91-9810000002', 'priya.sharma@example.com',   '34 Park Street, Kolkata, WB 700016'),
('Ravi Iyer',      '1975-11-05', 'Male',   '+91-9810000003', 'ravi.iyer@example.com',      '7 Anna Salai, Chennai, TN 600002'),
('Sunita Patel',   '2000-01-18', 'Female', '+91-9810000004', 'sunita.patel@example.com',   '88 CG Road, Ahmedabad, GJ 380009'),
('Deepak Singh',   '1968-09-30', 'Male',   '+91-9810000005', 'deepak.singh@example.com',   '5 Hazratganj, Lucknow, UP 226001');

-- --------------------------------------------------------
-- HEALTHCARE PROFESSIONALS (3 doctors + 1 lab tech)
-- --------------------------------------------------------
INSERT INTO healthcare_professional (full_name, role, specialization, contact_number, email) VALUES
('Dr. Ananya Rao',       'Doctor',         'General Medicine',   '+91-9820000001', 'ananya.rao@hospital.com'),
('Dr. Vikram Nair',      'Doctor',         'Cardiology',         '+91-9820000002', 'vikram.nair@hospital.com'),
('Dr. Meena Kulkarni',   'Doctor',         'Endocrinology',      '+91-9820000003', 'meena.kulkarni@hospital.com'),
('Suresh Babu',          'Lab Technician', 'Pathology',          '+91-9820000004', 'suresh.babu@hospital.com');

-- --------------------------------------------------------
-- USER ACCOUNTS
-- Roles: Admin (1), Doctor (3), Lab Technician (1), Patient (5)
-- password_hash = bcrypt('Test@1234', 12) — replace with real hashes
-- --------------------------------------------------------
-- All accounts use password: Test@1234
INSERT INTO user_account (email, password_hash, role, linked_patient_id, linked_professional_id) VALUES
-- Admin (no patient/professional link)
('admin@hospital.com',          '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Admin',          NULL, NULL),
-- Doctors linked to healthcare_professional rows 1-3
('ananya.rao@hospital.com',     '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Doctor',         NULL, 1),
('vikram.nair@hospital.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Doctor',         NULL, 2),
('meena.kulkarni@hospital.com', '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Doctor',         NULL, 3),
-- Lab Technician linked to professional row 4
('suresh.babu@hospital.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Lab Technician', NULL, 4),
-- Patients linked to patient rows 1-5
('arjun.mehta@example.com',     '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 1, NULL),
('priya.sharma@example.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 2, NULL),
('ravi.iyer@example.com',       '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 3, NULL),
('sunita.patel@example.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 4, NULL),
('deepak.singh@example.com',    '$2b$12$oZ9pD85nN7Pcx6yZ5PPtJeRxSMDsGuBplxgXmVD4ux/OBT6b9s5DW', 'Patient', 5, NULL);

-- --------------------------------------------------------
-- APPOINTMENTS (10)
-- --------------------------------------------------------
INSERT INTO appointment (patient_id, professional_id, scheduled_at, status, notes) VALUES
(1, 1, '2026-10-01 09:00:00+05:30', 'Completed',  'Follow-up for hypertension'),
(2, 1, '2026-10-01 10:00:00+05:30', 'Completed',  'Annual health check'),
(3, 2, '2026-10-02 11:00:00+05:30', 'Completed',  'Chest pain evaluation'),
(4, 3, '2026-10-03 09:30:00+05:30', 'Completed',  'Thyroid follow-up'),
(5, 2, '2026-10-03 14:00:00+05:30', 'Completed',  'ECG review'),
(1, 2, '2026-10-05 10:00:00+05:30', 'Scheduled',  'Echocardiogram review'),
(2, 3, '2026-10-06 11:30:00+05:30', 'Scheduled',  'Diabetes management'),
(3, 1, '2026-10-07 09:00:00+05:30', 'Cancelled',  'Patient requested reschedule'),
(4, 1, '2026-10-08 10:00:00+05:30', 'Scheduled',  'Blood pressure monitoring'),
(5, 3, '2026-10-09 15:00:00+05:30', 'Scheduled',  'HbA1c result review');

-- --------------------------------------------------------
-- DIAGNOSES
-- --------------------------------------------------------
INSERT INTO diagnosis (appointment_id, patient_id, condition_name, description, severity) VALUES
(1, 1, 'Hypertension Stage 1', 'BP consistently above 140/90 mmHg; lifestyle modifications advised.', 'Mild'),
(2, 2, 'Iron Deficiency Anaemia', 'Haemoglobin 9.2 g/dL; dietary advice and supplementation started.', 'Moderate'),
(3, 3, 'Stable Angina', 'Exertional chest pain relieved by rest; ECG shows ST changes.', 'Moderate'),
(4, 4, 'Hypothyroidism', 'TSH elevated at 8.2 mIU/L; levothyroxine initiated.', 'Mild'),
(5, 5, 'Type 2 Diabetes Mellitus', 'FBS 180 mg/dL, HbA1c 8.1%; metformin prescribed.', 'Moderate');

-- --------------------------------------------------------
-- PRESCRIPTIONS
-- --------------------------------------------------------
INSERT INTO prescription (diagnosis_id, patient_id, medication_name, dosage, frequency, duration, notes) VALUES
(1, 1, 'Amlodipine',    '5 mg',    'Once daily',      '90 days',  'Monitor BP weekly'),
(1, 1, 'Losartan',      '50 mg',   'Once daily',      '90 days',  'Take with water'),
(2, 2, 'Ferrous Sulfate','200 mg', 'Twice daily',     '60 days',  'Take on empty stomach'),
(3, 3, 'Aspirin',       '75 mg',   'Once daily',      '180 days', 'With food'),
(3, 3, 'Isosorbide Mononitrate', '20 mg', 'Twice daily', '30 days', 'Avoid sudden posture change'),
(4, 4, 'Levothyroxine', '50 mcg',  'Once daily (AM)', '90 days',  'Take 30 min before breakfast'),
(5, 5, 'Metformin',     '500 mg',  'Twice daily',     '90 days',  'With meals');

-- --------------------------------------------------------
-- LABORATORY INVESTIGATIONS
-- --------------------------------------------------------
INSERT INTO laboratory_investigation (appointment_id, patient_id, ordered_by, test_name, test_type, status) VALUES
(1, 1, 1, 'Lipid Profile',      'Biochemistry', 'Completed'),
(2, 2, 1, 'Complete Blood Count','Haematology', 'Completed'),
(3, 3, 2, 'ECG',                'Cardiology',   'Completed'),
(4, 4, 3, 'Thyroid Panel (TSH, T3, T4)', 'Endocrinology', 'Completed'),
(5, 5, 2, 'Fasting Blood Sugar', 'Biochemistry', 'Completed'),
(5, 5, 2, 'HbA1c',              'Biochemistry', 'Completed'),
(6, 1, 2, 'Echocardiogram',     'Cardiology',   'Pending'),
(7, 2, 3, 'HbA1c',              'Biochemistry', 'Pending');

-- --------------------------------------------------------
-- LAB RESULTS (for completed investigations 1-6)
-- --------------------------------------------------------
INSERT INTO lab_result (investigation_id, result_value, unit, reference_range, result_status, entered_by) VALUES
(1, '220',  'mg/dL', '< 200 mg/dL',        'Abnormal', 4),
(2, '9.2',  'g/dL',  '12–16 g/dL (female)','Abnormal', 4),
(3, 'ST depression 1mm in V4-V6', '', 'Normal sinus rhythm', 'Abnormal', 4),
(4, 'TSH: 8.2 | T3: 0.9 | T4: 6.1', 'mIU/L | pg/mL | µg/dL', 'TSH 0.4–4.0 | T3 2.3–4.2 | T4 5.1–14.1', 'Abnormal', 4),
(5, '180',  'mg/dL', '70–100 mg/dL',        'Abnormal', 4),
(6, '8.1',  '%',     '< 5.7%',              'Abnormal', 4);

-- --------------------------------------------------------
-- CLINICAL RECORDS (one per patient)
-- --------------------------------------------------------
INSERT INTO clinical_record (patient_id, summary_notes) VALUES
(1, 'Stage 1 hypertension diagnosed Oct 2026. Lipid panel abnormal. On Amlodipine + Losartan. Cardiology follow-up scheduled.'),
(2, 'Iron deficiency anaemia. CBC confirmed low Hb. Ferrous sulfate started. Diabetes screening recommended.'),
(3, 'Stable angina with ECG changes. Cardiology management initiated. Lipid profile pending.'),
(4, 'Hypothyroidism confirmed by thyroid panel. Levothyroxine 50 mcg initiated. 3-month TSH recheck planned.'),
(5, 'Type 2 DM with HbA1c 8.1%. Metformin started. Cardiology review for baseline ECG done.');

-- --------------------------------------------------------
-- NOTIFICATIONS
-- --------------------------------------------------------
-- user_id mapping: 1=admin, 2=dr.ananya, 3=dr.vikram, 4=dr.meena, 5=suresh(lab), 6=arjun, 7=priya, 8=ravi, 9=sunita, 10=deepak
INSERT INTO notification (user_id, message, notification_type, is_read) VALUES
-- Appointment scheduled → notify patient + doctor
(6,  'Your appointment with Dr. Ananya Rao on 01 Oct 2026 at 09:00 has been scheduled.', 'APPOINTMENT_SCHEDULED', true),
(2,  'New appointment scheduled: Arjun Mehta on 01 Oct 2026 at 09:00.',                  'APPOINTMENT_SCHEDULED', true),
(7,  'Your appointment with Dr. Ananya Rao on 01 Oct 2026 at 10:00 has been scheduled.', 'APPOINTMENT_SCHEDULED', true),
(2,  'New appointment scheduled: Priya Sharma on 01 Oct 2026 at 10:00.',                 'APPOINTMENT_SCHEDULED', true),
-- Appointment cancelled → notify patient
(8,  'Your appointment with Dr. Ananya Rao on 07 Oct 2026 at 09:00 has been cancelled.', 'APPOINTMENT_CANCELLED', false),
-- Lab results available → notify patient + ordering doctor
(6,  'Your Lipid Profile results are now available.',                                     'LAB_RESULT_AVAILABLE',  false),
(2,  'Lab results for Arjun Mehta (Lipid Profile) have been entered.',                   'LAB_RESULT_AVAILABLE',  false),
(7,  'Your Complete Blood Count results are now available.',                              'LAB_RESULT_AVAILABLE',  false),
(2,  'Lab results for Priya Sharma (CBC) have been entered.',                             'LAB_RESULT_AVAILABLE',  false),
(10, 'Your Fasting Blood Sugar and HbA1c results are now available.',                     'LAB_RESULT_AVAILABLE',  false),
(3,  'Lab results for Deepak Singh (FBS + HbA1c) have been entered.',                    'LAB_RESULT_AVAILABLE',  false);
