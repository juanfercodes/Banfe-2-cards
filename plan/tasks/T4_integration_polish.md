# T4 — Integration, A11y, E2E

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/kimi-k2.7-code` · **Effort**: `high`
**Depends on**: T1, T2, T3a, T3b, T3c, T3d, T3e (all prior)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Wire every layer together, close accessibility gaps, and ship a real
**Playwright end-to-end test** covering the full user journey: login → create
patient → play a short session → save → view results → dashboard shows the
session → export to Excel. This is the task that proves the app works as a
whole.

Reconcile union-merge conflicts in shared files (`routes.tsx`, `App.tsx`,
`ui/index.ts`, locale jsons, `package.json`) by keeping all siblings'
contributions. If a real logical conflict appears, BLOCKED.

## Deliverables

### 1. Wire the data flow

- `GamePage` (T3b) `onFinish(summary, events, seed)` → `saveSession` (T2)
  with `patientId` from params, `startedAt`/`endedAt` from the game, then
  navigate to `/results/:sessionId` passing the `ScoreSummary` + events in
  router state (so T3c `ResultsPage` renders immediately without a refetch).
- `ResultsPage` (T3c): if router state is missing (e.g. direct navigation /
  reload), load the session by `sessionId` via T2's data access and reconstruct
  the `ScoreSummary` from the stored jsonb. Handle not-found with a friendly
  state.
- `DashboardPage` (T3e): wire `listPatients` + `listAllSessions` (T2) to
  `StatsCards` + `HistoryTable`; wire the export button to `exportSessions`
  with the real filtered rows.
- `PatientNewPage` (T3d) post-create → `/play/:patientId?short=1` (first
  session) → `GamePage` reads the short flag (or `useOnboarding`) and starts
  with `SHORT_TOTAL_TURNS`.
- Auth: `ProtectedRoute` (T3d) wraps all protected routes in `routes.tsx`;
  `LoginPage` returns to the `from` location on success.
- Language: `LanguageProvider` initialized; `LanguageSwitcher` in the nav.

### 2. Accessibility pass

- Audit interactive elements for keyboard reachability and visible focus
  rings. Fix gaps in T3b's stacks (must be `Enter`/`Space` activatable from
  tab order), T3e's table (sortable headers operable from keyboard), and
  T3c's charts (provide a `aria-label`/`aria-describedby` summary since SVG
  charts are not keyboard-navigable — add a visually-hidden data table or a
  text summary adjacent to each chart).
- Ensure color is not the only signal (the adv/disadv badges already have
  text labels; verify the per-stack bars have aria-labels).
- Run `npm run lint` clean and a manual axe-style check (or `@axe-core/playwright`
  if you add it) on the E2E pages — assert no critical violations.
- `prefers-reduced-motion` respected everywhere (T3b already handles cards;
  verify charts and transitions).

### 3. Responsive pass

- Layout + board + table + results must be usable from ~360px up. Stacks
  wrap to a 2-then-3 grid on narrow widths; table scrolls horizontally or
  collapses non-essential columns; stat cards reflow.

### 4. E2E tests (Playwright — `playwright/`)

- `playwright/auth.spec.ts` — sign up a new clinician (use a random email
  against the local Supabase), sign out, sign back in; protected route
  redirects to `/login` when signed out.
- `playwright/full-journey.spec.ts` — the centerpiece:
  1. Sign in.
  2. Create a patient by code.
  3. Land on the short (100-turn) game; play through by clicking stacks
     (you can script a deterministic sequence) until `isFinished`.
  4. Results page renders: stat cards show the right numbers, learning curve
     has 2 blocks, per-stack breakdown present, export button present.
  5. Click "Back to dashboard"; the history table shows the new session.
  6. Stats cards updated (1 patient, 1 session, avg net matches).
  7. Click "Export to Excel"; assert a download event fires with a `.xlsx`
     filename and the right MIME (Playwright `page.on('download')`).
- `playwright/i18n.spec.ts` — toggle es→en; assert a known string flips
  language.
- `playwright/a11y.spec.ts` — run axe on `/`, `/login`, a results page, and
  a game page; assert no critical/serious violations.
- The E2E suite runs against `npm run preview` (build) per the Playwright
  config from T0, pointed at the **local Supabase stack** (Docker). Provide
  a `playwright/global.setup.ts` that seeds a clinician + patient via the
  integration harness and clears the DB between runs (`supabase db reset` in
  `globalSetup`, or a per-test reset — your call, document it).

### 5. CI workflow (`.github/workflows/ci.yml`)

- On push/PR to `develop` and `main`:
  - `npm ci`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run format:check`
  - `npm run test`
  - `npm run build`
  - `npm run test:integration` (with a `supabase start` service container or
    a Docker-based job; if your runner can't run Docker, mark this job
    `continue-on-error: true` and leave a TODO — do NOT silently skip).
  - `npm run test:e2e` (same Docker caveat).
- Cache `~/.npm` and `node_modules` per OS.

## Gates (must pass before pushing)

```
npm run supabase:start
npm run supabase:db:reset
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:integration
npm run build
npm run test:e2e
```

All green. This is the task that validates the whole stack, so do not skip
the integration + E2E gates (they're the point).

## Notes for the integrator (put in your DONE report)

- Any shared-file union-merges you performed and why.
- The E2E seed/reset strategy so ops can reproduce.
- Any `@axe-core/playwright` addition to `package.json` dev deps.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
