# ER / EER Diagram — Smart Patient & Clinical Record Management System

![ER/EER Diagram](https://i.ibb.co/JWDvrtWr/ER-Diagram.png)

---

## Relationship Summary

| Relationship | Cardinality | Notes |
|-------------|-------------|-------|
| Patient — Appointment | 1 : N | One patient, many appointments |
| Healthcare Professional — Appointment | 1 : N | One doctor, many appointments |
| Appointment — Diagnosis | 1 : N | One appointment can yield multiple diagnoses |
| Diagnosis — Prescription | 1 : N | One diagnosis can have multiple prescriptions |
| Appointment — Lab Investigation | 1 : N | One appointment can order multiple tests |
| Lab Investigation — Lab Result | 1 : 1 | Each investigation has one result entry |
| Patient — Clinical Record | 1 : N | One patient, one or more records over time |
| User Account — Notification | 1 : N | One user, many notifications |
| User Account — Patient / Professional | 1 : 0..1 | Each user linked to either a patient or professional profile |

---

## EER Extensions (Generalization / Specialization)

HEALTHCARE_PROFESSIONAL is a generalization of two specializations:
- **Doctor** — can record diagnoses, prescriptions, order lab investigations
- **Lab Technician** — can only enter lab results

This is captured via the `role` attribute on HEALTHCARE_PROFESSIONAL (discriminator).
In EER notation: partial, disjoint specialization on role.
