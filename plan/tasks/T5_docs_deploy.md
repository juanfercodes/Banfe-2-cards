# T5 — Docs + Deploy Runbook

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/glm-5.2` · **Effort**: `medium`
**Depends on**: T4 (the app is fully integrated and tested)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Write user-facing and ops documentation, a no-secrets Vercel + Supabase
deploy runbook, and run a final production-readiness pass (Lighthouse,
build size, env-var audit). This is the task that makes the repo publishable
as a public project.

## Deliverables

### 1. `README.md` (replace/expand T0's stub)

- Project overview: what BANFE-2 is, what this app does, who it's for
  (clinicians), the construct measured (decision-making under risk).
- Features list: login, multi-patient history, statistics, Excel export,
  es/en, "easy at the beginning" onboarding.
- **Quickstart** (local dev): prerequisites (Node ≥ 18, Docker Desktop),
  `npm ci`, env setup (copy `.env.example` → `.env` + fill local Supabase
  values from `supabase status`), `npm run supabase:start`,
  `npm run supabase:db:reset`, `npm run dev`.
- **Testing** section: unit (`npm run test`), integration
  (`npm run test:integration` — needs Docker + local Supabase), E2E
  (`npm run test:e2e`). How to reset the local DB.
- **Scripts** table (every `package.json` script with a one-line description).
- **Project structure** (mirror `plan/README.md` §2, plus a note that
  `plan/` is the build plan retained for transparency).
- Link to the deploy runbook (below).
- Disclaimer: this is a clinical-administration tool, not a medical device;
  the interpretation hints are not diagnoses.

### 2. `docs/deploy.md` — no-secrets deploy runbook

Step-by-step, copy-pasteable:

- **Supabase project setup**
  - Create a project at supabase.com.
  - Run migrations: either `supabase db push` linked to the project, or paste
    `supabase/migrations/0001_init.sql` + `0002_rls.sql` into the SQL editor.
  - Enable email/password auth.
  - Copy the **Project URL** and **anon public key** (safe for the browser,
    protected by RLS). NEVER copy the `service_role` key anywhere in the repo
    or the Vercel client env.
- **Vercel deploy**
  - Import the repo.
  - Framework preset: Vite. Build `npm run build`, output `dist`, install
    `npm ci`.
  - Add **environment variables** in the Vercel project settings:
    `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from the Supabase
    project). Do NOT add `service_role` to the client env.
  - Deploy. Verify the SPA rewrite in `vercel.json` handles client-side
    routes.
- **Security checklist**
  - RLS enabled on `patients` + `sessions` (verify in Supabase dashboard).
  - No `service_role` key in any client bundle (grep the build output for
    the key prefix as a sanity check — it must not appear).
  - `.env*` gitignored; `.env.example` carries only var names.
  - No hardcoded credentials anywhere in the repo (run a secret-scanning
    pre-commit hook recommendation, e.g. `gitleaks`).
- **First user** — the first clinician signs up via the login page; no
  seeded admin needed (RLS scopes each clinician to their own data).

### 3. `docs/architecture.md` (short)

- One diagram (ASCII or mermaid) of the layers: Vite SPA → Supabase Auth +
  Postgres (RLS). Note that there is no custom server — it's a static build
  + Supabase as a service. Mention the test layers (unit/integration/E2E)
  and the local Supabase-in-Docker workflow.

### 4. `docs/protocol.md`

- The reconstructed protocol (copy `plan/README.md` §3) with an explicit
  ⚠️ "reconstructed — validate against the official BANFE-2 manual before
  clinical use" banner. Document the scoring formulas and the
  "easy at the beginning" rule.

### 5. Production-readiness pass

- `npm run build` and report the gzipped bundle size; flag if > 300 KB
  (advise code-splitting via the lazy routes already in place).
- Run Lighthouse (CLI or browser) on the built `npm run preview` for `/login`
  and `/`; report Performance / Accessibility / Best Practices / SEO scores.
  Fix anything < 90 in Accessibility (the rest: report, don't rabbit-hole).
- Grep `dist/` for the Supabase `service_role` key prefix (`eyJ...` patterns
  are normal for the anon key; the service_role key should NEVER appear) and
  for the literal string `service_role`. Report clean.
- Confirm `.env.example` has only the two `VITE_SUPABASE_*` var names and no
  values.

### 6. `AGENTS.md` (update T0's file if anything changed)

Reflect the final canonical commands and any new test/seed workflow T4
introduced. Keep it the single source agents read for "how do I run things".

## Tests (this task is docs + checks — no unit tests)

- The "tests" here are the production-readiness checks above. Include the
  Lighthouse scores, bundle size, and secret-scan result in your DONE report.
- Ensure `npm run lint` / `typecheck` / `build` still pass after any README
  config tweaks (e.g. if you add a `gitleaks` pre-commit hook, wire it
  without breaking existing scripts).

## Gates (must pass before pushing)

```
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test
```

(Full integration/E2E gates are T4's responsibility; re-run them if you
touched any code, otherwise just keep the repo green.)

## Notes for the integrator (put in your DONE report)

- The deploy runbook path.
- Lighthouse scores + bundle size.
- The secret-scan result (clean / findings).

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
