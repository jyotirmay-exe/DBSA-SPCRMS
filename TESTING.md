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

## 3. Testing via Swagger UI (http://localhost:8000/docs)

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

## 4. Role-by-Role Test Flows

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
- **POST /diagnoses** — add diagnosis to a completed appointment
- **POST /prescriptions** — prescribe medication linked to a diagnosis
- **POST /lab-investigations** — order a lab test for a patient
- **GET /lab-results** — view results for own patients
- **GET /clinical-records** — view consolidated patient history

### Lab Technician
Login: `suresh.babu@hospital.com`

- **GET /lab-investigations** — see only **Pending** investigations
- **POST /lab-results** — enter result for investigation_id 7 or 8 (those are Pending in seed data)
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

## 5. Key Constraints to Verify

| Constraint | How to test |
|-----------|-------------|
| Double-booking prevention | POST /appointments with same doctor + same `scheduled_at` twice → second should 409 |
| Patient sees own records only | Login as patient, GET /diagnoses — should not see other patients |
| Doctor sees own patients only | Login as doctor, GET /appointments — only their appointments |
| Lab tech can't create diagnoses | Login as suresh.babu, POST /diagnoses → 403 |
| Patient can't enter lab results | Login as patient, POST /lab-results → 403 |

---

## 6. Testing via Frontend (http://localhost:5173)

1. Go to http://localhost:5173 → Login page
2. Enter email + password → redirected to role-specific dashboard
3. Navigate using the top navbar

**Admin dashboard:** user management, patient list, professional list

**Doctor dashboard:** appointment list → click appointment → add diagnosis → add prescription → order lab test

**Lab Tech dashboard:** pending investigations list → click → enter result

**Patient dashboard:** view appointments, diagnoses, prescriptions, lab results, notifications

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
3. Login as suresh.babu → GET /lab-investigations → see 2 Pending rows  ✓
4. POST /lab-results with investigation_id=7 → result created  ✓
5. Login as arjun.mehta (patient) → GET /notifications → see new notification  ✓
```
