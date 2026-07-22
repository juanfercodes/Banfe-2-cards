-- 0002_rls.sql — Row-level security + clinician-scoped access
-- A clinician may only read/write their own patients and sessions.
-- Before-insert triggers stamp clinician_id from auth.uid() when the client
-- omits it, so the client never needs to (and cannot spoof another clinician's
-- id — RLS WITH CHECK rejects any client-supplied clinician_id != auth.uid()).
-- A session may only be written if its patient also belongs to the caller,
-- preventing cross-clinician orphan sessions.

alter table public.patients enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "own patients" on public.patients;
create policy "own patients" on public.patients
  for all
  using (auth.uid() = clinician_id)
  with check (auth.uid() = clinician_id);

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all
  using (auth.uid() = clinician_id)
  with check (
    auth.uid() = clinician_id
    and exists (
      select 1 from public.patients p
      where p.id = sessions.patient_id
        and p.clinician_id = auth.uid()
    )
  );

-- Trigger function: stamp clinician_id from the caller on insert if not set.
-- We intentionally do NOT overwrite a client-supplied value so that a spoofed
-- clinician_id is caught by the RLS WITH CHECK (auth.uid() = clinician_id).
create or replace function public.set_clinician_id()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.clinician_id is null then
    new.clinician_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_patient_clinician on public.patients;
create trigger trg_set_patient_clinician
  before insert on public.patients
  for each row execute function public.set_clinician_id();

drop trigger if exists trg_set_session_clinician on public.sessions;
create trigger trg_set_session_clinician
  before insert on public.sessions
  for each row execute function public.set_clinician_id();

-- Grants: only authenticated clinicians can touch patient/session rows.
-- anon gets nothing (no public access to clinical data).
revoke all on public.patients from anon, authenticated;
revoke all on public.sessions from anon, authenticated;
grant select, insert, update, delete on public.patients to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
