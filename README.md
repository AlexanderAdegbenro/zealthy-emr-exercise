# Zealthy | High-Definition Patient Care Portal

Zealthy is a high-performance EMR and Patient Portal designed to bridge the gap between complex medical data and a frictionless user experience. Built with a **Mobile-First** philosophy, it balances intuitive patient autonomy with a powerful, high-utility administrative suite. This project reflects an ongoing focus on React Native and iOS mobile development.

---

## 🚀 The Stack

- **Framework:** Expo (React Native) + Expo Router
- **Backend:** Supabase (Auth, Postgres, Real-time sync)
- **Styling:** NativeWind (Tailwind CSS) for rapid, responsive UI
- **Data Handling:** TanStack Query (React Query) for robust state & caching
- **Safety:** Zod (Schema validation)
- **UX:** Expo Haptics & Local Auth integration

---

## 📁 Project Structure

```
zealthy-app/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root: QueryClient, AuthProvider, Stack
│   ├── index.tsx                 # Entry: auth-based redirect (admin/patient/login)
│   ├── (auth)/
│   │   └── login.tsx             # Email/password login
│   ├── (patient)/                # Patient portal (auth required)
│   │   ├── _layout.tsx          # Session guard, redirect to login
│   │   ├── index.tsx            # Dashboard: 7-day summary
│   │   ├── appointments.tsx     # 90-day schedule
│   │   └── medications.tsx      # 90-day refills
│   ├── admin/                    # Staff EMR portal (no auth guard)
│   │   ├── _layout.tsx          # Stack with header config
│   │   ├── index.tsx            # Patient directory (last-name-first)
│   │   ├── new-patient.tsx      # Register patient form
│   │   └── patient/[id].tsx     # Patient detail + appointments + prescriptions
│   └── api/
│       └── create-user+api.ts    # Server API: create auth user + profile
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── FormInput.tsx     # Labeled input, password toggle
│   │   │   ├── MedicalCard.tsx   # HD card with deep-radius
│   │   │   ├── EmptyState.tsx   # Empty list placeholder
│   │   │   ├── StatusPill.tsx   # Status badge (info/warning/success)
│   │   │   ├── ViewFullLink.tsx  # "View full 90-day" link
│   │   │   ├── PatientBanner.tsx # Header banner
│   │   │   └── ActionButton.tsx # Primary/danger button
│   │   └── PrescriptionCard.tsx # Prescription display card
│   ├── context/
│   │   └── AuthProvider.tsx     # Session, user, isAdmin
│   ├── hooks/
│   │   ├── useAuthActions.ts    # Login action
│   │   ├── useAppointments.ts   # TanStack Query: appointments CRUD
│   │   └── (api.ts: usePatients)
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client, integrity check
│   │   ├── database.types.ts    # DB schema types
│   │   └── validations.ts       # Zod schemas
│   ├── services/
│   │   ├── adminService.ts      # Patients, appointments, prescriptions
│   │   └── api.ts               # usePatients hook
│   ├── config/
│   │   ├── env.ts               # EXPO_PUBLIC_* client env
│   │   └── serverEnv.ts         # SUPABASE_SERVICE_ROLE_KEY (server-only)
│   ├── theme/
│   │   └── colors.js             # Zealthy palette (turquoise_surf, cerulean, etc.)
│   └── utils/
│       ├── alerts.ts            # zealthyAlert (web/native)
│       └── dateHelpers.ts       # getUpcomingItems (7-day filter)
├── global.css                    # NativeWind/Tailwind
├── tailwind.config.js
├── app.json                      # Expo config
└── package.json
```

---

## 🗄️ Database Schema (Supabase)

| Table         | Key Columns                                                                 |
|---------------|-----------------------------------------------------------------------------|
| **profiles**  | `id`, `email`, `first_name`, `last_name`, `is_admin`, `created_at`          |
| **medications** | `id`, `name`, `available_dosages[]`                                     |
| **appointments** | `id`, `patient_id`, `provider_name`, `first_appointment_date`, `end_date`, `repeat_schedule`, `status` |
| **prescriptions** | `id`, `patient_id`, `medication_id`, `dosage`, `quantity`, `refill_date`, `refill_schedule` |

- **Patients** = `profiles` where `is_admin = false`
- **Admins** = `profiles` where `is_admin = true`

---

## 🛠️ Features by Role

### Patient Portal (auth required)

| Screen           | Path                 | Features                                                                 |
|------------------|----------------------|--------------------------------------------------------------------------|
| **Dashboard**    | `/(patient)`         | 7-day summary: upcoming appointments (2 max), refills due (14 days). Pull-to-refresh. Sign out. |
| **90-Day Schedule** | `/(patient)/appointments` | SectionList by month. Urgent badge if &lt;48h. Repeat schedule pill. EmptyState. |
| **90-Day Refills** | `/(patient)/medications`  | SectionList by month. Dosage, quantity, instructions. EmptyState. |

### Admin Portal (no auth guard)

| Screen           | Path                 | Features                                                                 |
|------------------|----------------------|--------------------------------------------------------------------------|
| **Directory**    | `/admin`             | Patient list (last-name-first). FAB: New Patient. Pull-to-refresh.       |
| **New Patient** | `/admin/new-patient` | Form: first_name, last_name, email, password. Zod validation. Calls `/api/create-user`. |
| **Patient Detail** | `/admin/patient/[id]` | Header, appointments list (delete), prescriptions list (delete). FABs: Schedule, Medication. Modals for add. |

### Auth & Entry

| Screen   | Path    | Features                                                              |
|----------|---------|-----------------------------------------------------------------------|
| **Login** | `/login` | Email/password. Error display. Link to admin portal.                  |
| **Index** | `/`     | Redirects: admin → `/admin`, patient → `/(patient)`, else → `/login` |

---

## 🎨 Design System

### Color Palette (`src/theme/colors.js`)

| Token           | Use                          |
|-----------------|------------------------------|
| `turquoise_surf`| Primary accent, links        |
| `cerulean`      | Secondary, headers           |
| `bright_amber`  | Highlights, CTAs             |
| `papaya_whip`   | Backgrounds, cards          |
| `primary_scarlet` | Errors, destructive actions |

### UI Components

- **MedicalCard** – White card, 32px radius, cerulean shadow
- **FormInput** – Label, focus border, password visibility toggle
- **StatusPill** – Variants: info, warning, success, default
- **EmptyState** – Icon + message for empty lists
- **ViewFullLink** – "View full 90-day schedule/refills" link

---

## 🔌 API & Services

### Client → Supabase (RLS)

- `supabase.auth.signInWithPassword`
- `profiles`, `appointments`, `prescriptions`, `medications` tables

### Client → App API (server-side)

- **POST `/api/create-user`** – Creates auth user + profile. Requires `SUPABASE_SERVICE_ROLE_KEY`. Body: `{ email, password, first_name, last_name }`.

### adminService Methods

| Method                      | Purpose                                      |
|-----------------------------|----------------------------------------------|
| `createPatient`             | POST to `/api/create-user`                   |
| `getPatients`               | Fetch profiles where `is_admin = false`      |
| `getAvailableMedications`   | Fetch medications for prescription modal     |
| `createAppointment`         | Insert appointment                           |
| `deleteAppointment`         | Delete by id                                 |
| `addPrescription`           | Insert prescription                          |
| `deletePrescription`        | Delete by id                                 |
| `getPatientMedicalHistory`  | Profile + appointments + prescriptions       |

---

## ⚙️ Environment Variables

| Variable                      | Required | Use                                      |
|------------------------------|----------|------------------------------------------|
| `EXPO_PUBLIC_SUPABASE_URL`   | Yes      | Supabase project URL                     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes   | Supabase anon key (client)               |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (API) | Server-side create-user only            |
| `EXPO_PUBLIC_APP_URL`        | Optional | Base URL for API calls (default: localhost:8081) |

---

## 📜 Scripts

| Command        | Action                    |
|----------------|---------------------------|
| `npm start`    | `expo start`              |
| `npm run ios`  | `expo start --ios`        |
| `npm run android` | `expo start --android` |
| `npm run web`  | `expo start --web`       |
| `npm run lint` | `expo lint`               |
| `npm test`     | `vitest run`              |

---

## 💎 The "HD" Standard (UI/UX Highlights)

### Zero-Strain Interface

Optimized using a deep Slate and Cerulean palette. Critical medical data stays legible in any lighting while reducing eye fatigue for staff.

### Timezone-Resilient Scheduling

Custom date handling avoids UTC-shift issues. Patient appointments stay accurate to local time (e.g. `formatDateLocal` in patient detail).

### Unified Design Language

"Deep-Radius" headers (48px) create a consistent feel. Patient view is approachable; admin portal is command-focused.

### Tactile Feedback

Expo Haptics is available for destructive actions (planned; package installed).

---

## 🧪 Test Accounts

| Account | Email | Password |
|---------|-------|----------|
| **Primary (Kyle)** | `kyle@resistance.com` | `Password123!` |
| **Backup (Sarah)** | `sarah@skynet.com` | `Zealthy2026!` |

---

## ⚙️ Quick Start

1. **Environment:** Add `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and (for create-user) `SUPABASE_SERVICE_ROLE_KEY` to `.env`.
2. **Install:** `npm install`
3. **Launch:** `npx expo start`
