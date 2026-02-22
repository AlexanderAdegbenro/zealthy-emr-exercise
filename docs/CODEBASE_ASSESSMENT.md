# Zealthy App — Codebase Assessment Report

Generated: 2026-02-20T00:47:44.704Z

---

## 1. Overview

**Zealthy** is a mobile-first **Patient Portal** and **Mini-EMR** built with:

- **Expo (SDK 50+)** and **Expo Router** (file-based routing)
- **Supabase** (PostgreSQL + Auth)
- **TanStack React Query** for server state
- **NativeWind (Tailwind)** for styling
- **TypeScript** with generated DB types

The repo structure and README align with the intended architecture (patient portal, admin EMR, auth, React Query, typed Supabase).

---

## 2. Tech Stack Summary

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | React Native 0.73, React 18.2       |
| Routing      | Expo Router 3.4 (file-based)        |
| Backend      | Supabase (PostgreSQL, Auth)         |
| Data fetching| TanStack React Query 5.x            |
| Styling      | NativeWind 4 (Tailwind)             |
| Language     | TypeScript 5.9                      |

---

## 3. Architecture

### 3.1 Routing

- **`app/_layout.tsx`** — Root: SafeAreaProvider → QueryClientProvider → AuthProvider → Stack (no header).
- **`app/index.tsx`** — Entry: redirects by auth state (admin → `/admin`, patient → `/(patient)`, else → `/login`).
- **`(auth)`** — Login only; no guard.
- **`(patient)`** — Guarded by session in `_layout.tsx`; redirect to `/login` if unauthenticated.
- **`admin/`** — Intentionally unguarded per requirements; no auth check in layout.

### 3.2 Auth

- **AuthProvider** (`src/context/AuthProvider.tsx`) listens to `onAuthStateChange`, exposes `session`, `user`, `isAdmin` (from `profiles.is_admin`), and `loading`.
- Login uses `useAuthActions` → `signInWithPassword` then `router.replace('/')`; root index then sends user to admin or patient area.
- Patient layout blocks unauthenticated access and shows a loading state while resolving session.

### 3.3 Data

- **Supabase client** in `src/lib/supabase.ts` (typed with `Database` from `src/lib/database.types.ts`).
- **React Query** initialized in root layout; data fetching intended to go through custom hooks only.
- **Hooks:** `usePatients()` in `src/services/api.ts`; no patient-scoped or mutation hooks yet.

### 3.4 Database Types (`src/lib/database.types.ts`)

- **profiles** — id, email, first_name, last_name, is_admin, created_at
- **medications** — id, name, available_dosages
- **appointments** — id, patient_id, provider_name, first_appointment_date, repeat_schedule, status
- **prescriptions** — id, patient_id, medication_id, dosage, quantity, refill_date, refill_schedule

---

## 4. File Inventory

| Path | Purpose |
|------|--------|
| `app/_layout.tsx` | Root layout: SafeArea → QueryClient → Auth → Stack |
| `app/index.tsx` | Role-based redirect (admin / patient / login) |
| `app/(auth)/login.tsx` | Login UI; uses `useAuthActions` |
| `app/(patient)/_layout.tsx` | Auth guard; redirect to login if no session |
| `app/(patient)/index.tsx` | Patient dashboard (placeholder content) |
| `app/(patient)/appointments.tsx` | Placeholder "Coming Soon" |
| `app/(patient)/medications.tsx` | Placeholder "Phase 3" |
| `app/admin/index.tsx` | Patient list via `usePatients()`; loading/empty states |
| `app/admin/_layout.tsx` | Stack; no auth guard (by design) |
| `app/admin/patient/[id].tsx` | Patient detail placeholder; no data fetch or form |
| `app/api/create-user+api.ts` | Stub; returns success without creating user |
| `src/context/AuthProvider.tsx` | Session, user, isAdmin; profile fetched on auth change |
| `src/hooks/useAuthActions.ts` | Login + validation; `router.replace('/')` on success |
| `src/services/api.ts` | `usePatients()` only |
| `src/lib/supabase.ts` | Typed Supabase client; AsyncStorage for auth |
| `src/lib/database.types.ts` | Generated DB types for tables above |

---

## 5. Strengths

- **Stack and routing** match README: Expo Router, Supabase, React Query, NativeWind.
- **Auth flow** is coherent: provider with `onAuthStateChange`, `is_admin` from profiles, root index redirect by role.
- **Patient area** is protected; unauthenticated users are sent to login.
- **Data fetching** uses React Query in the one implemented screen (admin patient list) with loading and empty states.
- **Typing:** Supabase client and DB types are in place; `Database` is used in client.
- **Styling** is consistent (NativeWind) on login and admin dashboard.

---

## 6. Gaps and Issues

### 6.1 Security and environment

- **`.env` is not in `.gitignore`** (only `.env*.local` is). Risk of committing Supabase URL/keys. **Recommendation:** Add `.env` to `.gitignore` and use `.env.example` for documentation.
- **`src/lib/supabase.ts`** logs URL/key existence in all builds. **Recommendation:** Remove or guard with `__DEV__` to avoid leaking env info in production.

### 6.2 AuthProvider

- Uses `(profile as any)` for `is_admin`. **Recommendation:** Type with `Database['public']['Tables']['profiles']['Row']` (or a small helper type) and remove `any`.
- Comment says "until database.types.ts is found" but types exist; update or remove the comment.

### 6.3 Admin dashboard

- **`isError` is never used.** README asked for a clear error state when `isError` is true. **Recommendation:** Add error UI and optional retry (e.g. `refetch()`).

### 6.4 Create-user API

- **`app/api/create-user+api.ts`** is a stub: always returns `{ success: true }`. **Recommendation:** Parse body, call Supabase Admin API (service role) to create user and optionally profile, return proper success/error and status codes.

### 6.5 Patient experience

- **Patient dashboard** uses `supabase` directly and shows static "No appointments scheduled." **Recommendation:** Use `useAuth()` for current user and load patient-specific data via React Query hooks when implemented.
- **Appointments and Medications** screens are placeholders; no hooks or Supabase queries yet.

### 6.6 Admin patient detail

- **`admin/patient/[id].tsx`** only displays "Editing Patient ID: {id}". **Recommendation:** Fetch patient (and related data) by `id`, use `database.types`, and add edit/create flow as needed.

### 6.7 Login redirect

- `useAuthActions` uses `router.replace('/')`; root index then redirects by role. Logic is correct; ensure no flash of wrong route on slow networks (current layout order is fine).

### 6.8 Path alias

- `useAuthActions.ts` imports `@/src/lib/supabase`. With `"@/*": ["./*"]`, this resolves. Keep imports consistent (all `@/...` or all relative).

### 6.9 Patient layout

- Loading and redirect logic are correct. Styling is inline; consider NativeWind for consistency.

---

## 7. Recommendations (Priority)

| Priority | Action |
|----------|--------|
| **High** | Add `.env` to `.gitignore`; implement create-user API with service role and error handling; add error state (and retry) to admin dashboard. |
| **Medium** | Type AuthProvider profile with DB types; add `useAppointments(userId)` / `useMedications(userId)` (or equivalent) and wire patient dashboard and placeholders. |
| **Lower** | Implement admin patient detail (fetch + form); remove or dev-guard Supabase env logging; standardize NativeWind in patient layout. |

---

## 8. Conclusion

The foundation is in good shape: routing, auth, React Query, Supabase client, and types are set up correctly. The main follow-ups are implementing the create-user API, adding error handling on the admin list, and filling in patient and admin detail screens with real data and hooks.
