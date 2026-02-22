# Zealthy Mobile Engineering Exercise — Requirements Fulfillment

This document maps each requirement from the exercise to the current codebase and explains how it is fulfilled (or where gaps remain).

---

## High-Level Requirements

| Requirement | Status | Where / How |
|-------------|--------|-------------|
| React Native with web support (Expo or similar) | ✅ | Expo + Expo Router; `app.json` / Expo config; web build via `expo export:web` |
| Patient Portal + mini-EMR; two sections | ✅ | Section 1: `/admin` (mini-EMR). Section 2: `/` → login then patient portal |
| Database for add/modify (not static JSON only) | ✅ | Supabase (PostgreSQL); all entities stored in DB, typed in `src/lib/database.types.ts` |
| Seed from provided JSON | ⚠️ | DB schema and types align with exercise; seed scripts/migrations not in repo (assumed done in Supabase) |

---

## Section 1 — The “mini” EMR

### 1.1 URL and Access

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| EMR at path `/admin` | ✅ | `app/admin/` — `app/admin/index.tsx` is the main EMR page |
| No authentication required | ✅ | `app/admin/_layout.tsx` has no auth check; login screen has link “Staff & EMR Portal: Enter Here (Unauthenticated)” |

### 1.2 Main Page — Table of Users

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Main page = table of users | ✅ | `app/admin/index.tsx` — `FlatList` of patients (card per row) |
| At-a-glance data visible | ✅ | Each card shows: **Last name, First name** and **ID** (first 8 chars). Skeleton loader while loading; empty state “No patients found.” |
| Drill down into patient record | ✅ | Tapping a card navigates to `app/admin/patient/[id].tsx` |

**Code reference:**  
- Patient list: `adminService.getPatients()` (profiles where `is_admin = false`).  
- Navigation: `router.push(\`/admin/patient/${item.id}\`)`.

### 1.3 Patient Record — Appointments & Medications

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| View upcoming appointments | ✅ | `app/admin/patient/[id].tsx` — `getPatientMedicalHistory(id)`; appointments listed with date, provider, repeat schedule |
| View list of prescribed medications | ✅ | Same screen; prescriptions listed with medication name, dosage, frequency (from joined `medications(name)`) |

### 1.4 CRUD — Prescriptions

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Create** | ✅ | “+ New Med” opens modal: medication dropdown (from `medications` table), dosage dropdown (from medication’s `available_dosages`), frequency, start date, instructions. Submits via `adminService.addPrescription()`. |
| **Read** | ✅ | Prescriptions loaded in patient detail via `getPatientMedicalHistory` and displayed in list. |
| **Update** | ❌ | No edit prescription flow in UI; no `updatePrescription` in `adminService`. |
| **Delete** | ❌ | No delete prescription in UI or `adminService`. |

**Note:** `PrescriptionInput` uses `frequency` and `start_date`; DB types use `refill_date`, `refill_schedule`, `quantity`. If the live Supabase schema matches the types, the insert may need to map or add these fields (e.g. set `refill_date`/`refill_schedule` from start_date/frequency, and a default `quantity`).

### 1.5 CRUD — Appointments

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Create** | ✅ | “+ Schedule” modal: provider name (free text), first appointment date (YYYY-MM-DD), repeat schedule (none / weekly / monthly). `adminService.createAppointment()`. |
| **Read** | ✅ | Appointments in patient detail from `getPatientMedicalHistory`. |
| **Update** | ⚠️ | No generic “edit appointment” UI. **End recurring** is supported: `adminService.endRecurringAppointment(appointmentId)` sets `repeat_schedule: 'none'` and `end_date`. (Kill switch per FAQ.) |
| **Delete** | ❌ | No delete appointment in UI or service. |

**FAQ alignment:** Provider name = free-form text ✅; first appointment date + repeat schedule ✅; way to end recurring appointments ✅.

### 1.6 CRUD — Patient Data (CRU)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Create** | ✅ | “+ New” on admin index → `app/admin/new-patient.tsx`. Form: first name, last name, email, **password**. Zod `NewPatientSchema` validation. Submits to `adminService.createPatient()` → `POST /api/create-user`. |
| **Read** | ✅ | Patient list (admin index) and full record (patient `[id]` with appointments and prescriptions). |
| **Update** | ❌ | No “Edit patient” screen or `updatePatient` in admin; profile fields (e.g. name, email) are not editable in UI. |

**FAQ:** “Allow setting of the patient password” — ✅ New patient form includes password; create-user API sets it via Supabase Admin `createUser({ email, password, ... })`.

### 1.7 New Patient Form & Create-User API

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| New patient form allows creation | ✅ | `app/admin/new-patient.tsx` with validation and submit. |
| Set patient password | ✅ | Password field in form; sent to `app/api/create-user+api.ts`. API uses `SUPABASE_SERVICE_ROLE_KEY` and `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name, last_name } })`, then upserts `profiles` (id, email, first_name, last_name, is_admin: false). |

**Code reference:**  
- Form: `adminService.createPatient(validData)` → `fetch(\`${base}/api/create-user\`, { method: 'POST', body: JSON.stringify({ email, password, first_name, last_name }) })`.  
- API: `app/api/create-user+api.ts` — validates body, creates auth user, upserts profile, returns `{ success: true, id }`.

### 1.8 Medications / Dosages from JSON (Seed Data)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Use data.json to seed medications and dosages | ⚠️ | Schema supports it: `medications` table with `name`, `available_dosages` (array); `src/lib/database.types.ts` matches. Prescription form loads options via `adminService.getAvailableMedications()`. No seed file in repo — seeding assumed done in Supabase (or manual). |
| Prescription form: medication name, dosage, quantity, refill date, refill schedule | ⚠️ | Form has: medication (dropdown), dosage (dropdown from `available_dosages`), frequency (text), start date, instructions. **Quantity** and explicit **refill date / refill schedule** are not in the add form; DB types have `quantity`, `refill_date`, `refill_schedule`. Aligning form + types/API would fully match the FAQ. |

---

## Section 2 — The Patient Portal

### 2.1 URL and Login

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Patient Portal at root “/” | ✅ | `app/index.tsx` is the root: if no session → redirect to `/login`; if session and not admin → redirect to `/(patient)` (patient portal). So “/” leads to login or portal by auth state. |
| Login form at root with email and password | ✅ | Unauthenticated users are sent to `app/(auth)/login.tsx` (path `/login`). Form has email and password; submits via `useAuthActions().login(email, password)` → Supabase `signInWithPassword`. |
| Login with sample or EMR-created credentials | ✅ | Any user in `auth.users` with matching profile can sign in; EMR-created users use the password set in the New Patient form. |

### 2.2 Post-Login Routing

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| After login, taken to patient portal | ✅ | `useAuthActions` calls `router.replace('/')`; `app/index.tsx` then redirects non-admin users to `/(patient)` (patient stack). |
| Patient area protected | ✅ | `app/(patient)/_layout.tsx` checks `useAuth().session`; if no session, renders `<Redirect href="/login" />`. |

### 2.3 Main Page — Summary

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Summary of most important data | ✅ | `app/(patient)/index.tsx`: “Next 7 days at a glance” — fetches appointments and prescriptions for current user, filters to **next 7 days**. |
| Appointments within next 7 days | ✅ | `inNext7Days(first_appointment_date)`; only those shown in “Appointments” block. |
| Medications with refills in next 7 days | ✅ | Same filter on `refill_date` for “Refills Due”. |
| Basic patient info | ⚠️ | Dashboard shows “Welcome Back” and 7-day appointments/refills only. No explicit “basic patient info” block (e.g. name, DOB). Patient identity is implied by being logged in; name could be added from `profiles` if desired. |

Empty states: “No appointments in the next 7 days” and “No refills due in the next 7 days” with dashed-border styling ✅.

### 2.4 Drill-Down — Appointments

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Drill down to full upcoming appointment schedule | ✅ | “View 3-Month →” on dashboard links to `app/(patient)/appointments.tsx`. |
| Full schedule going out up to 3 months | ✅ | Fetches all appointments for user, then filters to `first_appointment_date` between now and 90 days; lists with date, provider, status, repeat schedule. Empty state: “No appointments scheduled for the next 90 days.” |

### 2.5 Drill-Down — Prescriptions

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Drill down to see all prescriptions | ✅ | “View 3-Month →” under refills links to `app/(patient)/medications.tsx`. |
| Info about all prescriptions, up to 3 months | ✅ | Fetches prescriptions with `medications(name)`, orders by `refill_date`, filters to refill dates in next 90 days. Shows medication name, dosage, refill date, refill schedule, quantity. Empty state: “No refills scheduled for the next 90 days.” |

---

## Technical Stack (per FAQ)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| React Native with web support (Expo or similar) | ✅ | Expo; Expo Router; NativeWind; web build path documented (e.g. `expo export:web` for Vercel/Netlify). |
| Backend any language/framework | ✅ | Supabase (PostgreSQL + Auth); optional serverless route `app/api/create-user+api.ts` (Node/Expo API route) for admin user creation. |

---

## Summary Table

| Area | Create | Read | Update | Delete | Notes |
|------|--------|------|--------|--------|-------|
| **Prescriptions (EMR)** | ✅ | ✅ | ❌ | ❌ | Add form present; no edit/delete. |
| **Appointments (EMR)** | ✅ | ✅ | ⚠️ End recurring only | ❌ | End recurring implemented. |
| **Patient data (EMR)** | ✅ | ✅ | ❌ | — | New patient + password; no edit patient. |
| **Patient portal summary** | — | ✅ | — | — | 7-day appointments + refills. |
| **Patient portal appointments** | — | ✅ | — | — | 3-month schedule. |
| **Patient portal medications** | — | ✅ | — | — | 3-month refills. |

---

## File-Level Quick Reference

| Requirement | Primary files |
|-------------|----------------|
| EMR at `/admin`, no auth | `app/admin/_layout.tsx`, `app/admin/index.tsx` |
| Patient table + drill-down | `app/admin/index.tsx`, `app/admin/patient/[id].tsx` |
| Appointments CRUD (create + end recurring) | `app/admin/patient/[id].tsx`, `src/services/adminService.ts` |
| Prescriptions CRUD (create + read) | Same + “+ New Med” modal |
| New patient + password | `app/admin/new-patient.tsx`, `app/api/create-user+api.ts`, `adminService.createPatient` |
| Login at “/” | `app/index.tsx`, `app/(auth)/login.tsx`, `app/(patient)/_layout.tsx` |
| Patient summary (7-day) | `app/(patient)/index.tsx` |
| Patient 3-month appointments | `app/(patient)/appointments.tsx` |
| Patient 3-month medications | `app/(patient)/medications.tsx` |
| Auth & role redirect | `src/context/AuthProvider.tsx`, `src/hooks/useAuthActions.ts`, `app/index.tsx` |
| DB types & schema | `src/lib/database.types.ts` |
| Validation (new patient) | `src/lib/validations.ts` (Zod) |

---

## Gaps to Consider for “Complete” CRUD

1. **Prescriptions:** Add Update and Delete in admin (edit/delete in patient detail or modal). Ensure insert sends `quantity`, `refill_date`, `refill_schedule` if the DB requires them.
2. **Appointments:** Add full Update (edit date/provider/repeat) and Delete if required.
3. **Patient data:** Add Update (edit patient profile) in admin for full CRU.
4. **Dashboard:** Optionally show basic patient info (e.g. name from `profiles`) on the patient main page.
5. **Seed:** Document or add a seed script (e.g. from the provided JSON) for `medications` (and optionally sample patients/appointments/prescriptions) so the app can be run from scratch.

This document reflects the codebase as of the scan. Fulfillment status (✅ / ⚠️ / ❌) is based on the exercise and FAQ text above.
