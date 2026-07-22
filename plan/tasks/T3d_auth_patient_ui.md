# T3d — Auth UI, Patient UI, Onboarding Ramp

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/kimi-k2.7-code` · **Effort**: `high`
**Depends on**: T0 (scaffold), T2 (`useAuth`, `createPatient`, `listPatients`),
  T3a (primitives + `ProtectedRoute` file)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Build the auth flow (login + signup), the protected-route guard, the patient
picker/creation UI, and the "easy at the beginning" onboarding ramp that
decides whether a patient's first session is short (100 turns) or full (200).
Spanish default + English.

You consume T2's `useAuth`, `createPatient`, `listPatients`, and T3a's
primitives. You own the `ProtectedRoute` component file (T3a left a
placeholder).

## Deliverables

### 1. `src/components/auth/ProtectedRoute.tsx` (you own this file)

- Reads `useAuth()`. While `loading`, render a centered `Spinner`. If no
  `user`, redirect to `/login` (preserve the intended location in router
  state so login can return there). If `user`, render `<Outlet/>`.
- Used by `src/routes.tsx` (T3a) to wrap protected routes.

### 2. `src/pages/LoginPage.tsx` + `src/components/auth/LoginForm.tsx`

- `/login`. Tabs or toggle between "Iniciar sesión" / "Crear cuenta"
  (sign in / sign up).
- `LoginForm` fields: email, password (+ password confirmation for signup).
  Client-side validation (email format, password ≥ 8 chars, confirmation
  match). Accessible errors via T3a `Input`.
- On submit: call `signIn` / `signUp`. On success, navigate to the
  `from` location or `/`.
- Show Supabase error messages translated via i18n keys
  (`auth.error.invalidCredentials`, `auth.error.emailInUse`, etc. — map
  common Supabase error strings to keys).
- "¿Olvidaste tu contraseña?" / "Forgot password?" link placeholder (can
  call `supabase.auth.resetPasswordForEmail` — optional; if you implement it,
  add the i18n key + a success toast).
- Layout: centered card on the dark theme, app logo/title, language switcher
  in the corner.

### 3. `src/components/auth/AuthGuard.tsx` (optional helper)

- A small wrapper that triggers `signOut` and redirects on a 401 from the
  data layer (best-effort; keep simple). Optional — only if it falls out
  naturally.

### 4. `src/pages/PatientNewPage.tsx` + `src/components/dashboard/PatientPicker.tsx`

- `/patients/new` — a form to create a patient by **code** only (per the
  locked decision: minimal profile). Single `Input` for the code with
  validation (non-empty, no spaces, reasonable max length). On submit call
  `createPatient(code)`; on `PatientConflictError` show an inline error and
  offer to "ir a jugar" / "go play" with the existing patient.
- On success: navigate to `/play/:patientId` with the onboarding ramp applied
  (see below).
- `PatientPicker` — a combobox/autocomplete over `listPatients()` used by the
  dashboard to start a session for an existing patient (T3e will place it in
  the dashboard; you build the component). Shows code + created date; filter
  by typing; selecting navigates to `/play/:id`.

### 5. "Easy at the beginning" onboarding ramp

- `src/lib/onboarding.ts` (pure, tested):
  - `shouldUseShortMode(priorSessionCount: number): boolean` → `true` iff
    `priorSessionCount === 0`.
  - `firstSessionHint(): { totalTurns: number; blocks: number }` →
    `{ totalTurns: SHORT_TOTAL_TURNS, blocks: SHORT_BLOCKS }` using T1's
    constants.
- `src/hooks/useOnboarding.ts` — given a `patientId`, calls
  `getSessionHistory(patientId)` (T2) and exposes
  `{ shortMode, totalTurns }`. Used by `GamePage` (T3b) to decide the turn
  count. (If T3b already has its own wiring, expose this hook and coordinate
  via union merge — don't duplicate.)
- On the `PatientNewPage` post-create navigation, pass `?short=1` (or router
  state) so `GamePage` knows to use the short mode without re-querying.
- First-session onboarding banner text: explain the shortened session is a
  gentle introduction (the banner itself renders in T3b's `GameBoard`).

### 6. i18n keys (add to both locales — union-merge)

`auth.signIn`, `auth.signUp`, `auth.signOut`, `auth.email`, `auth.password`,
`auth.confirmPassword`, `auth.forgotPassword`, `auth.authError.*`,
`auth.welcome`, `auth.loginRequired`, `patient.create`, `patient.code`,
`patient.codePlaceholder`, `patient.createSuccess`, `patient.conflict`,
`patient.conflictCta`, `patient.pickExisting`, `patient.search`,
`onboarding.firstSessionTitle`, `onboarding.firstSessionBody`,
`onboarding.shortModeBadge`.

## Tests (Vitest + Testing Library)

- `ProtectedRoute.test.tsx` — loading → spinner; no user → redirect to
  `/login` with `from` state; user → renders outlet.
- `LoginForm.test.tsx` — validation errors show (empty, bad email, short
  password, mismatched confirmation); submit calls `signIn`/`signUp`;
  Supabase error → translated message; success → navigates.
- `PatientNewPage.test.tsx` — empty code → validation error;
  `createPatient` success → navigates to `/play/:id` with short flag;
  `PatientConflictError` → conflict UI + CTA navigates to existing patient.
- `PatientPicker.test.tsx` — lists patients, filter narrows, select
  navigates.
- `onboarding.test.ts` (pure) — `shouldUseShortMode(0)` true, `(1)` false;
  `firstSessionHint()` returns the short constants.
- `useOnboarding.test.tsx` — with 0 prior sessions → `shortMode true`; ≥1 →
  false. (Mock the data layer.)

## Gates (must pass before pushing)

```
npm run typecheck
npm run lint
npm run test
npm run build
```

Integration tests (hitting real Supabase Auth) are owned by T2; you mock the
data layer in unit tests. If you add an auth integration test, put it in
`*.integration.test.ts` and follow T2's harness.

## Notes for the integrator (put in your DONE report)

- The `ProtectedRoute` API and the `LoginForm`/signup contract.
- The `useOnboarding` hook + `?short=1` convention so T3b/T4 can rely on it.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
