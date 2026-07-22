# T2 — Supabase Backend: Migrations, RLS, Auth, Data Layer

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/glm-5.2` · **Effort**: `high`
**Depends on**: T0 (foundation + scaffold + supabase tooling)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Build the entire backend slice: Postgres schema via **migrations**, **RLS**
policies that isolate each clinician's patients/sessions, Supabase Auth
wiring, and a typed data-access layer. This is **security-critical**: a leaked
anon key must never let one clinician read another's data. Verify with
**integration tests against a local Supabase in Docker**.

Read `plan/README.md` §4 (the data model) before coding. The SQL there is
authoritative; you may add indexes but not change column types or drop the
RLS posture.

## Deliverables

### 1. Migrations (in `supabase/migrations/`)

`0001_init.sql`:
- `create table public.patients` with `id uuid pk default gen_random_uuid()`,
  `clinician_id uuid not null references auth.users(id) on delete cascade`,
  `code text not null`, `created_at timestamptz default now()`,
  `unique (clinician_id, code)`.
- `create table public.sessions` with `id uuid pk default gen_random_uuid()`,
  `patient_id uuid not null references public.patients(id) on delete cascade`,
  `clinician_id uuid not null references auth.users(id) on delete cascade`,
  `started_at timestamptz default now()`, `ended_at timestamptz`,
  `total_net int default 0`, `per_stack jsonb default '{}'::jsonb`,
  `penalizations int default 0`, `learning_curve jsonb default '[]'::jsonb`,
  `adv_disadv_index int default 0`, `raw_events jsonb default '[]'::jsonb`.
- Indexes: `sessions(patient_id, started_at desc)`,
  `sessions(clinician_id, started_at desc)`.

`0002_rls.sql`:
- `alter table ... enable row level security` on both.
- Policy `own patients` on `patients` `for all using (auth.uid() = clinician_id)
  with check (auth.uid() = clinician_id)`.
- Policy `own sessions` on `sessions` `for all using (auth.uid() = clinician_id)
  with check (auth.uid() = clinician_id)`.
- Add a trigger function `set_clinician_id()` that copies `auth.uid()` into
  `clinician_id` on insert if not set, and a `before insert` trigger on
  `sessions` using it (so the client cannot spoof another clinician's id).
- Re-grant `select, insert, update, delete` to the `authenticated` role only
  (not `anon` — patients/sessions require a signed-in clinician).

Migrations must be **idempotent-ish**: `supabase db reset` on a fresh stack
applies them cleanly with no errors. Verify this locally.

### 2. `src/lib/supabaseClient.ts`

- Export `supabase` — a singleton `createClient(import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY)`.
- Throw a clear error at module load if either env var is missing (dev-time
  guardrail).
- Export `getSupabase()` for test isolation if needed.

### 3. `src/hooks/useAuth.ts`

- Wraps `supabase.auth` for the client. Exports a `useAuth()` hook returning
  `{ user, session, loading, signIn, signUp, signOut }`.
- `signIn(email, password)`, `signUp(email, password)` (GoTrue), `signOut()`.
- Subscribe to `supabase.auth.onAuthStateChange` and expose `loading` correctly.
- **No service_role key** anywhere in this file or any client code.

### 4. `src/lib/dataAccess.ts` — typed CRUD

Typed against the schema. All functions assume an authenticated client (RLS
enforces scope). Export:

- `createPatient(code: string): Promise<Patient>` — inserts with
  `clinician_id` left to the trigger (or explicitly `auth.uid()` via RPC);
  handle the unique `(clinician_id, code)` violation with a typed
  `PatientConflictError`.
- `listPatients(): Promise<Patient[]>` — ordered by `created_at desc`.
- `getPatient(id: string): Promise<Patient | null>`.
- `saveSession(input: { patientId: string; summary: ScoreSummary; events:
  TurnEvent[]; startedAt: string; endedAt: string }): Promise<Session>` —
  maps the `ScoreSummary` (from T1) into the table columns (`total_net`,
  `per_stack` jsonb, `penalizations`, `learning_curve` jsonb,
  `adv_disadv_index`, `raw_events` jsonb). Import the types from `src/lib`
  (T1) — if T1 hasn't exported them yet, define a local structural type and
  note it for the integrator (union-merge later).
- `getSessionHistory(patientId: string): Promise<Session[]>` — ordered by
  `started_at desc`.
- `listAllSessions(): Promise<Session[]>` — for the dashboard history table
  (RLS auto-scopes to the clinician).
- Types: `Patient`, `Session` (with `perStack`, `learningCurve`, `rawEvents`
  typed as `Record<StackId, number>`, `number[]`, `TurnEvent[]` respectively —
  parse the jsonb back to typed values in the data-access layer).

### 5. Integration tests (TDD — `src/lib/__tests__/` or `src/lib/integration/`)

File naming: `*.integration.test.ts` so the integration vitest config picks
them up. These run against a local Supabase stack (`npm run supabase:start`
then `npm run supabase:db:reset`).

Harness (`src/test/integration.setup.ts` was created by T0; extend it here):
- Create two clinician users via the GoTrue admin API (use the local
  `service_role` key from `supabase status` — read from env in the test only,
  never commit it).
- Sign in as each, build an authed supabase client per clinician.

Tests:
- `migrations.integration.test.ts` — `db reset` ran cleanly (implicit: the
  harness wouldn't connect otherwise); assert both tables exist with the
  expected columns (query `information_schema.columns`).
- `rls.integration.test.ts`:
  - Clinician A creates patient `P-A` and a session; clinician B creates
    `P-B`. A cannot see B's patients or sessions (`select` returns empty);
    B cannot see A's. Inserting a session under A's patient as B is rejected
    (RLS `with check` fails). Direct insert with a spoofed `clinician_id` via
    the anon/authenticated client is rejected.
- `dataAccess.integration.test.ts`:
  - `createPatient` → `listPatients` round-trip; `PatientConflictError` on
    duplicate code; `saveSession` → `getSessionHistory` round-trip with
  jsonb fields correctly typed back; `listAllSessions` returns only the
    current clinician's rows.

If Docker is unavailable in the worktree, write all integration tests, mark
the suite `describe.skip` with a comment `// requires Docker + supabase start`,
and clearly note it in the DONE report. Do NOT delete the tests.

## Gates (must pass before pushing)

```
npm run supabase:start   # Docker Desktop must be running
npm run supabase:db:reset
npm run typecheck
npm run lint
npm run test
npm run test:integration   # RLS + CRUD green (or skipped with Docker note)
npm run build
```

## Notes for downstream tasks (put in your DONE report)

- The exact `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values the local
  stack prints (so T0's integration config can pin them) — or confirm they're
  read via `supabase status -o env`.
- The `Patient`/`Session` type shapes T3d/T3e will import from
  `src/lib/dataAccess`.
- Confirm the `useAuth` API T3d will consume.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
