Act as a Senior React Native Engineer. We are building a mobile-first EMR and Patient Portal using Expo Router, NativeWind (Tailwind), Supabase, and TanStack React Query.

Below is the project's README, which contains the architectural decisions and current tech stack. Read it carefully to understand our constraints and philosophy.

--- START OF README CONTEXT ---
# Zealthy Patient Portal & Mini-EMR

A full-stack React Native application (with web support via Expo) built for the Zealthy Mobile Engineering Exercise. This application features a Patient Portal for managing upcoming appointments and medication refills, and a Mini-EMR for administrative provider access.

## Tech Stack
* **Frontend:** React Native, Expo (SDK 50+), Expo Router
* **Backend:** Supabase (PostgreSQL, Authentication)
* **State & Data Fetching:** TanStack React Query
* **Styling:** NativeWind (Tailwind CSS)
* **Type Safety:** TypeScript (End-to-End via Supabase CLI)

## Architectural Decisions
1. **File-Based Routing:** Uses Expo Router with `(patient)` and `(auth)` groups for guarded routes, while keeping the `admin/` directory unguarded per requirements.
2. **Backend:** Supabase handles PostgreSQL and Auth. Triggers automatically sync `auth.users` to a `public.profiles` table. Row Level Security (RLS) is strictly enforced.
3. **Serverless API:** Uses Expo API routes (`app/api/create-user+api.ts`) with the Supabase `service_role` key to securely bypass client constraints and manually set patient passwords during admin creation.
4. **Data Fetching:** ALL data fetching must use custom TanStack React Query hooks to eliminate `useEffect` sprawl and handle caching gracefully. The QueryClient is already initialized in `app/_layout.tsx`.
5. **Type Safety:** The frontend models are strictly typed using `src/types/database.types.ts` generated directly from the Supabase SQL schema.
--- END OF README CONTEXT ---

### Current State:
1. The routing scaffolding is complete.
2. The database is live, seeded, and typed in `src/types/database.types.ts`.
3. `<QueryClientProvider>` is wrapping the root `<Stack />` in `app/_layout.tsx`.

### Phase 2 Execution Tasks:
Please generate the code for the following sequential steps. Output the complete code for each file requested.

**1. Auth Provider (`src/context/AuthProvider.tsx`):**
Create a React Context provider that listens to Supabase `onAuthStateChange`. It should expose the current session, user, and `is_admin` status. Update `app/_layout.tsx` to wrap the app in this provider inside the QueryClientProvider.

**2. Data Fetching Hooks (`src/services/api.ts`):**
Write the custom React Query hooks using the Supabase client. Create hooks for:
- `usePatients()`: Fetches all profiles where `is_admin = false`.
- Use the generated types from `src/types/database.types.ts` to strictly type the Supabase responses.

**3. The Admin Dashboard UI (`app/admin/index.tsx`):**
Build the unguarded mini-EMR dashboard using NativeWind. It should use the `usePatients()` hook to display a list/table of patients. Include a skeleton loader while `isLoading` is true, and a clean error state if `isError` is true.

**4. The Login Screen (`app/(auth)/login.tsx` & `app/(patient)/_layout.tsx`):**
Build the login UI using NativeWind with email/password inputs. Call Supabase `signInWithPassword`. Then, update the patient layout file to check the AuthProvider session; if the user is not logged in, immediately redirect them to `/login`.
