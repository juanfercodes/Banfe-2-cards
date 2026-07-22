# AGENTS.md — Banfe-2-cards

> Single source for "how do I run things" in this repo. Read this first.

## What this is
A browser-based BANFE-2 card decision-making task for clinician use.
Vite + React 18 + TS (strict) + Tailwind + Framer Motion. Supabase Auth +
Postgres (RLS). Spanish default, English supported. Deployed on Vercel.
**No secrets in the repo.**

## Build plan & orchestration
- `plan/README.md` — full plan (decisions, protocol §3, data model §4, batches).
- `plan/PREAMBLE.md` — operating contract every worker follows (linting, TDD,
  migrations, Docker testing, unit/integration/E2E gates).
- `plan/tasks/T0..T5.md` — 10 self-explanatory task units.
- `plan/ORCHESTRATOR_STATE.md` — live orchestration state (panes, worktrees,
  progress). **Update at every batch boundary.** Always reconcile against git
  ground truth before acting.

## Prerequisites
- Node ≥ 18 (see `.nvmrc`).
- Docker Desktop (for integration tests against local Supabase).
- Supabase CLI: `npm i -g supabase` (or use the project's dev dep).

## Commands (canonical)
```
npm ci                    # install
npm run dev               # Vite dev server
npm run build             # tsc -b && vite build -> dist/
npm run preview           # serve dist on :4173 (used by Playwright)
npm run typecheck         # tsc -b --noEmit
npm run lint              # ESLint (max-warnings=0)
npm run lint:fix
npm run format            # Prettier write
npm run format:check
npm run test              # Vitest unit tests
npm run test:watch
npm run test:integration  # Vitest against local Supabase (Docker)
npm run test:e2e          # Playwright (builds + previews first)
npm run supabase:start    # start local Supabase stack (Docker)
npm run supabase:stop
npm run supabase:status
npm run supabase:db:reset # wipe + reapply all migrations
```

## Testing workflow
- **Unit**: `npm run test` — fast, no network.
- **Integration**: needs Docker. `npm run supabase:start` →
  `npm run supabase:db:reset` → `npm run test:integration`. Integration specs
  live in `*.integration.test.ts`. They create clinician users via the GoTrue
  admin API and assert RLS isolation. If Docker is unavailable, the suite is
  `describe.skip`'d with a note (never delete the tests).
- **E2E**: `npm run test:e2e` (Playwright, Chromium). Runs against
  `npm run preview`. Full journey: login → create patient → play short session
  → save → results → dashboard → export.

## Env vars (client-safe)
- `VITE_SUPABASE_URL` — Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — public anon key (safe for browser; RLS protects data).
- **`service_role` key is NEVER referenced in client code or stored in the repo.**
- Copy `.env.example` → `.env` and fill from `supabase status` (local) or the
  Supabase dashboard (prod, set in Vercel project env vars).

## Migrations
- All schema changes go in `supabase/migrations/NNNN_description.sql`.
- Never hand-edit the DB. Apply locally with `npm run supabase:db:reset`.

## Conventions
- TS strict, no `any` without justification. No comments unless asked.
- Every user-facing string via `t('key')` (react-i18next); add keys to BOTH
  `src/i18n/locales/es.json` and `en.json`. Default locale `es`.
- Path alias `@/*` → `src/*`.
- Shared-file conflicts (package.json, routes.tsx, App.tsx, ui/index.ts,
  locale jsons) resolve by **union merge** — keep all sides' additions.

## Orchestration (herdr)
- Workers are `opencode` sessions in herdr-managed worktrees/panes.
- Base branch: `origin/develop`. PRs target `develop` (never `main`).
- See `plan/ORCHESTRATOR_STATE.md` for live state and resume instructions.
