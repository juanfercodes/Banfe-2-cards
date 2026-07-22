# AGENTS.md — Banfe-2-cards

> Single source for "how do I run things" in this repo. Read this first.

## What this is

A browser-based BANFE-2 card decision-making task for clinician use. Vite + React
18 + TypeScript (strict) + Tailwind CSS + Framer Motion. Supabase Auth + Postgres
(RLS). Spanish default, English supported. Deployed on Vercel. **No secrets in the
repo.**

## Build plan & orchestration

- `plan/README.md` — full plan (decisions, protocol §3, data model §4, batches).
- `plan/PREAMBLE.md` — operating contract every worker follows (linting, TDD,
  migrations, Docker testing, unit/integration/E2E gates).
- `plan/tasks/T0..T5.md` — 10 self-explanatory task units.
- `plan/ORCHESTRATOR_STATE.md` — live orchestration state (panes, worktrees,
  progress). **Update at every batch boundary.** Always reconcile against git
  ground truth before acting.

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS + Framer Motion
- react-router-dom, react-i18next, @supabase/supabase-js, xlsx, recharts, clsx
- Vitest (unit + integration), Playwright (E2E)
- Supabase CLI for local Postgres/Auth

## Requirements

- Node.js >= 18 (use `.nvmrc`)
- Docker Desktop for local Supabase integration tests
- `npm ci` to install dependencies

## Canonical commands

| Command                     | Purpose                                  |
| --------------------------- | ---------------------------------------- |
| `npm run dev`               | Start Vite dev server                    |
| `npm run build`             | Typecheck + production build             |
| `npm run preview`           | Preview production build on port 4173    |
| `npm run typecheck`         | TypeScript check (`tsc -b --noEmit`)     |
| `npm run lint`              | ESLint + Prettier-aware rules            |
| `npm run lint:fix`          | Auto-fix ESLint issues                   |
| `npm run format`            | Format with Prettier                     |
| `npm run format:check`      | Check Prettier formatting                |
| `npm run test`              | Unit tests (Vitest, jsdom)               |
| `npm run test:watch`        | Vitest watch mode                        |
| `npm run test:integration`  | Integration tests against local Supabase |
| `npm run test:e2e`          | Playwright E2E tests                     |
| `npm run supabase:start`    | Start local Supabase stack               |
| `npm run supabase:stop`     | Stop local Supabase stack                |
| `npm run supabase:status`   | Show local Supabase status               |
| `npm run supabase:db:reset` | Reset local DB and reapply migrations    |

## Path aliases

`@/*` maps to `src/*` in Vite, TypeScript, and ESLint.

## Testing workflow

1. Unit tests: `npm run test` (fast, jsdom, no network).
2. Integration tests:
   - `npm run supabase:start`
   - `npm run supabase:db:reset`
   - `npm run test:integration`
   - `npm run supabase:stop` (optional)
3. E2E tests: `npm run test:e2e` (builds + previews automatically).

Run the gates your diff touches before pushing.

## Supabase local setup

Copy `.env.example` to `.env` and fill in values from `npm run supabase:status`.

- `VITE_SUPABASE_URL` — local API URL (default `http://127.0.0.1:54321`)
- `VITE_SUPABASE_ANON_KEY` — local anon key printed by `supabase status`

Never commit secrets. The `service_role` key is never shipped to the browser.

## Env vars (client-safe)

- `VITE_SUPABASE_URL` — Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — public anon key (safe for browser; RLS protects data).
- **`service_role` key is NEVER referenced in client code or stored in the repo.**
- Copy `.env.example` → `.env` and fill from `supabase status` (local) or the
  Supabase dashboard (prod, set in Vercel project env vars).

## Migrations

Every schema change is a Supabase migration in `supabase/migrations/` named
`NNNN_description.sql`. Run `npm run supabase:db:reset` to verify migrations on
a fresh local stack.

## Conventions

- TS strict, no `any` without justification. No comments unless asked.
- Every user-facing string via `t('key')` (react-i18next); add keys to BOTH
  `src/i18n/locales/es.json` and `en.json`. Default locale `es`.
- Path alias `@/*` → `src/*`.
- Shared-file conflicts (package.json, routes.tsx, App.tsx, ui/index.ts,
  locale jsons) resolve by **union merge** — keep all sides' additions.

## i18n

Spanish (`es`) is the default locale; English (`en`) is supported. Add keys to
both `src/i18n/locales/es.json` and `en.json` for any user-facing strings.

## Shared-file conflicts

When rebasing onto `develop` with sibling work, resolve conflicts in these files
by union merge (keep both additions): `package.json`, `src/routes.tsx`,
`src/components/ui/index.ts`, `src/i18n/locales/{es,en}.json`, `src/App.tsx`.

## Orchestration (herdr)

- Workers are `opencode` sessions in herdr-managed worktrees/panes.
- Base branch: `origin/develop`. PRs target `develop` (never `main`).
- See `plan/ORCHESTRATOR_STATE.md` for live state and resume instructions.

## Deployment

Vercel config lives in `vercel.json`. Set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` as Vercel environment variables.
