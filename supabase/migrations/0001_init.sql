-- 0001_init.sql — Banfe-2-cards core schema
-- Patients (clinician-scoped) and sessions (per-patient game records).
-- See plan/README.md §4 for the authoritative data model.

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  unique (clinician_id, code)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_net int not null default 0,
  per_stack jsonb not null default '{}'::jsonb,
  penalizations int not null default 0,
  learning_curve jsonb not null default '[]'::jsonb,
  adv_disadv_index int not null default 0,
  raw_events jsonb not null default '[]'::jsonb
);

create index if not exists sessions_patient_started_idx
  on public.sessions (patient_id, started_at desc);

create index if not exists sessions_clinician_started_idx
  on public.sessions (clinician_id, started_at desc);
