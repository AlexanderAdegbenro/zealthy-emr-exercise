🧪 Sunday Morning: The "Zero-Bug" Test Protocol
We will follow the data from creation to consumption. If it passes this, it's ready.

1. The Admin "EMR" Stress Test
The "Kyle Reese" Creation:

Create a brand new patient (Kyle Reese).

Verify: Does the Zod validation stop you if you use a "weak" password?

Verify: Does he appear in the directory immediately without a manual refresh?

Clinical CRUD:

Schedule: Add a recurring weekly appointment for Kyle.

Prescribe: Add "Amoxicillin" for Kyle.

Verify: Can you Edit or Delete these? (Recruiters love testing the "D" in CRUD).

The Kill Switch: Tap "End Series" on Kyle's appointment.

Verify: Does the database repeat_schedule change to none?

2. The Patient "Portal" Stress Test
The Role Guard: Log in as Kyle.

Verify: Does the app block you from manually typing /admin in the URL?

The 7-Day "At-a-Glance" Accuracy:

Create one appointment for 2 days from now (Should show on Dashboard).

Create one appointment for 10 days from now (Should NOT show on Dashboard).

The 3-Month Lookahead:

Navigate to the full schedule.

Verify: Are the appointments sorted by date (soonest at the top)?

🛠️ Sunday Afternoon: Final Polish & Deployment
Hook Refactor: Final sweep of useAppointments to ensure it uses the same "Senior" pattern as usePatients.

Web Build Check: Run npx expo export:web.

Verify: Does the "Splash Header" look right on a wide desktop screen?

Verify: Do the modals (Schedule/Prescription) center correctly on a browser?

Environment Lockdown:

Confirm .env is hidden.

Verify .env.example has all the keys (Supabase URL, Anon Key, Service Role).

📦 The "Hand-off" Checklist
[ ] Lint & Clean: Remove console.log and commented-out code.

[ ] Deploy: Final push to Vercel/Netlify.

[ ] Submission:

GitHub Repo URL.

Hosted Demo URL.

Test Credentials (Sarah Connor & the Kyle Reese you created).