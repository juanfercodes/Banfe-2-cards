# PREAMBLE — Operating Contract for All Workers

You are an autonomous senior developer working in a **herdr-managed git
worktree** on the Banfe-2-cards project. Read this file FIRST and follow it
exactly, then read your assigned task file in `plan/tasks/<TASK>.md` and treat
its entire contents as the TASK block.

## Ground truth

- **Repo**: `juanfercodes/Banfe-2-cards`. **Base branch**: `origin/develop`.
  You are on a feature branch off `origin/develop`. Open your PR **to `develop`**
  (never `main`).
- **Full plan**: `plan/README.md` (tech stack, protocol spec §3, data model §4,
  folder structure §2). Read it for any context your task file doesn't cover.
- **Protocol spec**: `plan/README.md` §3 — the contingency table, scoring
  formulas, and "easy at the beginning" rule are authoritative. Do not invent
  numbers. If something seems wrong, use the BLOCKED protocol.

## Workflow

1. `git rebase origin/develop` immediately before opening your PR (avoids
   lockfile-drift CI failures and adopts the latest scaffold).
2. **TDD is mandatory wherever there is logic** (engine, scoring, RNG, protocol,
   data layer, export, auth/RLS, hooks, reducers). Write the failing test first,
   watch it fail, implement, watch it pass. Pure presentational UI does not need
   unit tests but **must** have at least a render/smoke component test and must
   typecheck + build.
3. **Every task ends with the tests appropriate to what it built** (see
   "Test layers" below). No task is DONE with red or missing tests.
4. **Run the gates your diff touches** (see below) and ensure they are green
   locally before pushing.
5. Commit in small, logical units with clear messages. Do NOT amend or
   force-push after opening the PR.
6. Open the PR with `gh pr create --base develop` and a body that lists
   deliverables, the tests you added, and how you verified them.
7. Finish by printing the terminal **DONE** or **BLOCKED** report (below).

## Test layers (mandatory; pick what applies to your task)

Three layers are configured by T0. Use the ones your diff touches:

1. **Unit tests** — `npm run test` (Vitest + jsdom + @testing-library/react).
   Pure logic (engine, scoring, RNG, protocol, export, data mappers) and
   component render/interaction tests. Fast, no network.
2. **Integration tests** — `npm run test:integration` (Vitest against a **local
   Supabase in Docker**). Use for anything hitting Postgres: migrations apply
   cleanly, RLS policies isolate clinicians, data-access CRUD round-trips.
   Spin up the local stack with `npm run supabase:start` (runs `supabase start`,
   requires Docker Desktop running). Reset between tests with
   `npm run supabase:db:reset`. If Docker is not available in the worktree,
   write the integration tests anyway and mark them `describe.skip` with a
   comment + a note in the DONE report — do NOT delete them.
3. **End-to-end tests** — `npm run test:e2e` (Playwright, Chromium). Full
   user journeys through the built app (`npm run build && npm run preview` or
   `npm run dev`). Owned primarily by T4, but any task that ships a complete
   user-facing flow may add a spec.

**Linting is a gate**: `npm run lint` (ESLint + Prettier) must pass. Do not
disable rules globally; escalate to the BLOCKED protocol if a rule is wrong.

## Migrations (Supabase)

- **Every schema change is a Supabase migration** in `supabase/migrations/`,
  named `NNNN_description.sql` (zero-padded, ascending). Never hand-edit the
  DB; never run raw `create table` outside a migration.
- Migrations are applied locally by `npm run supabase:db:reset`
  (`supabase db reset` — wipes + reapplies all migrations). Verify yours apply
  cleanly on a fresh local stack before pushing.
- Integration tests depend on migrations being idempotent and ordered.

## Local Docker testing

- Local Supabase runs in Docker via `supabase start` (Postgres, GoTrue auth,
  PostgREST, Realtime, Storage). Requires Docker Desktop.
- Workflow: `npm run supabase:start` → `npm run supabase:db:reset` →
  `npm run test:integration` → `npm run supabase:stop` (optional).
- The integration test runner sets `VITE_SUPABASE_URL` /
  `SUPABASE_URL` to the local stack (`http://127.0.0.1:54321` + anon key from
  `supabase status`). Never point tests at a hosted/production project.

## Gates (run what your diff touches)

The repo root `AGENTS.md` lists the canonical commands. In summary:

- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Unit tests: `npm run test` (Vitest)
- Integration tests: `npm run test:integration` (Vitest + local Supabase/Docker)
- E2E tests: `npm run test:e2e` (Playwright)
- Build: `npm run build` (Vite)
- Migrations: `npm run supabase:db:reset` must apply cleanly
- SQL/RLS specifics: documented in `plan/tasks/T2_backend.md`

If a command is missing (task T0 hasn't landed yet on your base), do not
invent one — note it in your DONE report.

## Conventions

- **TypeScript strict**. No `any` without a comment justifying it.
- **No comments** unless asked; code must be self-explanatory.
- **i18n**: every user-facing string goes through `t('key')` from
  `react-i18next`. Add keys to BOTH `src/i18n/locales/es.json` and `en.json`.
  Default locale is `es`.
- **No secrets in the repo.** Use `import.meta.env.VITE_SUPABASE_URL` and
  `import.meta.env.VITE_SUPABASE_ANON_KEY` only. The `service_role` key is
  NEVER referenced in client code.
- **Styling**: Tailwind utility classes. Framer Motion for card animations.
- **Accessibility**: semantic HTML, keyboard-reachable interactive elements,
  ARIA where needed, visible focus rings.
- **Folder/file names**: match the structure in `plan/README.md` §2 exactly so
  downstream tasks find your exports.

## Shared-file conflicts (union merge)

Several files are touched by multiple parallel tasks (`package.json`,
`src/routes.tsx`, `src/components/ui/index.ts`, `src/i18n/locales/{es,en}.json`,
`src/App.tsx`). When rebasing onto a `develop` that has sibling work merged,
**resolve conflicts by UNION (keep both sides' additions)** — never pick a side
and delete a sibling's contribution. If a true logical conflict arises, use the
BLOCKED protocol.

## DONE report (print at the end)

```
DONE
Task: <ID> <title>
Branch: <branch>
PR: <url>
Deliverables:
  - <file>: <what it does>
  - ...
Gates passed:
  - npm run typecheck: OK
  - npm run lint: OK
  - npm run test: <N> passed
  - npm run build: OK
Notes / follow-ups for the integrator: <if any>
```

## BLOCKED report (print instead of DONE if you cannot finish)

```
BLOCKED
Task: <ID> <title>
Branch: <branch>
Reason: <concise — what is missing/ambiguous/broken>
Evidence: <file:line, error output, or question>
Attempted: <what you tried>
Needs: <exactly what a human or another task must provide to unblock you>
```

Do not guess past an ambiguity in the protocol, a missing dependency export, or
a failing gate. STOP and report BLOCKED instead.
