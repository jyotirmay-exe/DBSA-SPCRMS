# SPCRMS — Usage & Testing Guide

## 1. Start the App

```bash
./run.sh
```

- Frontend: http://localhost:5173
- Backend API + Swagger: http://localhost:8000/docs

---

## 2. Test Accounts

All passwords: `Test@1234`

| Role | Email |
|------|-------|
| Admin | admin@hospital.com |
| Doctor (General Medicine) | ananya.rao@hospital.com |
| Doctor (Cardiology) | vikram.nair@hospital.com |
| Doctor (Endocrinology) | meena.kulkarni@hospital.com |
| Lab Technician | suresh.babu@hospital.com |
| Patient | arjun.mehta@example.com |

---

## 3. Full Usage Flows

### Admin Flow

**Goal:** Oversight across all records — appointments, diagnoses, prescriptions, lab work.

1. Open http://localhost:5173 → Login with `admin@hospital.com` / `Test@1234`
2. Redirected to **Admin Dashboard** — stat cards show total appointments, diagnoses, prescriptions, lab investigations
3. **Sidebar → Appointments** — list of all appointments across all doctors and patients, showing patient name + professional name
4. Click any appointment row → **Appointment Detail** page showing:
   - Appointment metadata (patient, doctor, date, status)
   - Diagnoses linked to this appointment; click any diagnosis to drill down
5. **Appointment Detail → click a diagnosis** → **Diagnosis Detail** page showing:
   - Diagnosis metadata (condition, notes, date)
   - Prescriptions linked to this diagnosis; click any to see prescription detail
6. **Sidebar → Diagnoses** → flat list of all diagnoses; click any → Diagnosis Detail (same view as step 5)
7. **Sidebar → Prescriptions** → flat list of all prescriptions; click any → Prescription Detail showing medication, dosage, linked diagnosis + appointment
8. **Sidebar → Lab Investigations** → list of all investigations with status (Pending / Completed)
9. Click any lab investigation → **Lab Investigation Detail** showing:
   - Test name, type, ordered by, patient
   - Result section: result value and date entered (only if Completed)
10. **Sidebar → Patients** → list of all patients; **+ New Patient** → fill form → saves to DB
11. **Sidebar → Professionals** → list; **+ New Professional** → fill form → saves
12. **Sidebar → Users** → full user list; toggle active/inactive; create new user account with role assignment
13. **Sidebar → Notifications** → view system notifications

---

### Doctor Flow

**Goal:** Manage own appointments, add clinical records, order lab tests.

1. Login with `ananya.rao@hospital.com` / `Test@1234`
2. Redirected to **Doctor Dashboard** — today's appointments and recent activity
3. **Sidebar → Appointments** → list of own appointments only; each row shows patient name + scheduled time
4. Click any appointment → **Appointment Detail** showing:
   - Appointment info
   - Diagnoses section — all diagnoses recorded for this appointment
   - **+ Add Diagnosis** button (only visible for non-Cancelled appointments)
5. **Add Diagnosis** → `/doctor/diagnoses/new?appointment_id=X` — form pre-selects the appointment; fill condition name + notes → Submit
6. Back on Appointment Detail → new diagnosis appears; click it → **Diagnosis Detail** showing:
   - Diagnosis info
   - Prescriptions section — all prescriptions linked to this diagnosis
   - **+ Add Prescription** button
   - **+ Order Lab Test** button
7. **Add Prescription** → `/doctor/prescriptions/new?diagnosis_id=X` — fill medication name, dosage, frequency, start/end dates → Submit
8. **Order Lab Test** → `/doctor/lab-orders/new?patient_id=X` — select appointment, fill test name + type + notes → Submit
9. After ordering, lab technician enters result (see Lab Tech flow); doctor gets a notification
10. **Sidebar → Notifications** → see "lab result entered" notification; click to view
11. Navigate to any diagnosis → **Diagnosis Detail** → lab investigations section → click investigation → see result value + date

**Alternative entry point — patient record:**
- Doctor can also navigate via patient view: go to an appointment, click patient name → `/doctor/patients/:id` showing all of that patient's diagnoses, prescriptions, and lab orders in one consolidated view

---

### Lab Technician Flow

**Goal:** Enter results for pending lab investigations.

1. Login with `suresh.babu@hospital.com` / `Test@1234`
2. Redirected to **Lab Dashboard** — list of Pending investigations
3. Click any pending investigation → **Investigation Detail** showing test name, patient, ordered by, ordered date
4. Click **Enter Result** → `/lab/results/new?investigation_id=X` — fill result value + enter date → Submit
5. Investigation status changes to Completed; notifications auto-created for patient and ordering doctor
6. Back on Lab Dashboard — completed investigations no longer shown in Pending list

---

### Patient Flow

**Goal:** View own health records.

1. Login with `arjun.mehta@example.com` / `Test@1234`
2. Redirected to **Patient Dashboard** — appointments list + recent lab results
3. Click any appointment → **Appointment Detail** showing appointment info + diagnoses list
4. Click any diagnosis → **Diagnosis Detail** showing condition, prescriptions list
5. Click any lab investigation → **Lab Investigation Detail** showing test name, result value, date
6. **Sidebar → Notifications** → view "lab results ready" and "appointment scheduled" notifications; click to mark as read

---

## 4. Testing via Swagger UI (http://localhost:8000/docs)

Swagger lets you call every API endpoint directly without the frontend.

### Step 1 — Login and get a token
1. Open http://localhost:8000/docs
2. Click **POST /auth/login** → **Try it out**
3. Enter `username: admin@hospital.com`, `password: Test@1234` → **Execute**
4. Copy the `access_token` from the response

### Step 2 — Authorize
1. Click the **Authorize** button (top right, lock icon)
2. Paste the token → **Authorize**

Now all subsequent requests use that token. Repeat with different emails to test different roles.

---

## 5. Role-by-Role API Test Flows

### Admin
Login: `admin@hospital.com`

- **GET /patients** — see all 5 patients
- **GET /professionals** — see all 4 professionals
- **GET /auth/users** — see all 10 user accounts
- **POST /auth/users** — create a new user account
- **PUT /auth/users/{id}** — deactivate a user (`is_active: false`)

### Doctor
Login: `ananya.rao@hospital.com`

- **GET /appointments** — see own appointments only
- **GET /patients** — see own patients
- **GET /patients/{id}** — view a patient profile
- **POST /diagnoses** — add diagnosis to an appointment
- **POST /prescriptions** — prescribe medication linked to a diagnosis
- **POST /lab-investigations** — order a lab test for a patient
- **GET /lab-results** — view results for own patients
- **GET /clinical-records** — view consolidated patient history

### Lab Technician
Login: `suresh.babu@hospital.com`

- **GET /lab-investigations** — see only **Pending** investigations
- **POST /lab-results** — enter result for a pending investigation
  - After posting: investigation status changes to Completed
  - Notifications auto-created for the patient and ordering doctor

### Patient
Login: `arjun.mehta@example.com`

- **GET /appointments** — own appointments only
- **GET /diagnoses** — own diagnoses only
- **GET /prescriptions** — own prescriptions
- **GET /lab-results** — own lab results
- **GET /notifications** — see notifications (lab results ready, appointment updates)
- **PUT /notifications/{id}** — mark notification as read

---

## 6. Key Constraints to Verify

| Constraint | How to test |
|-----------|-------------|
| Double-booking prevention | POST /appointments with same doctor + same `scheduled_at` twice → second should 409 |
| Patient sees own records only | Login as patient, GET /diagnoses — should not see other patients |
| Doctor sees own patients only | Login as doctor, GET /appointments — only their appointments |
| Lab tech can't create diagnoses | Login as suresh.babu, POST /diagnoses → 403 |
| Patient can't enter lab results | Login as patient, POST /lab-results → 403 |

---

## 7. Notification Flow (end-to-end)

1. Login as Doctor → POST /appointments (schedule new appointment for a patient)
2. Login as that Patient → GET /notifications → should see "appointment scheduled" notification
3. Login as Lab Tech → POST /lab-results for a pending investigation
4. Login as Patient again → new "lab results available" notification appears
5. Login as Doctor → new "lab results entered" notification appears

---

## 8. Quick Sanity Check (< 5 min)

```
1. Open /docs → login as admin → GET /patients → see 5 rows  ✓
2. Login as ananya.rao → GET /appointments → see her appointments  ✓
3. Login as suresh.babu → GET /lab-investigations → see Pending rows  ✓
4. POST /lab-results with a pending investigation_id → result created  ✓
5. Login as arjun.mehta (patient) → GET /notifications → see new notification  ✓
```
