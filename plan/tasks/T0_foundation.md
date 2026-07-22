# T0 — Foundation + Scaffold

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/kimi-k2.7-code` · **Effort**: `high`
**Depends on**: nothing (you are the foundation)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Stand up the entire project scaffold so every downstream task can start from a
working, linted, typechecked, testable base. **You install ALL dependencies
once** so sibling tasks rarely edit `package.json` (a shared-file conflict
hotspot). You also configure the three test layers (unit, integration, E2E),
Supabase local tooling, i18n, Tailwind, ESLint/Prettier, and Vercel.

## Deliverables

### 1. `package.json` — scripts and ALL dependencies

Scripts (exact names — downstream tasks rely on them):

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:status": "supabase status",
    "supabase:db:reset": "supabase db reset"
  }
}
```

Runtime deps (single source of truth — install ALL of these now):
`react`, `react-dom`, `react-router-dom`, `react-i18next`, `i18next`,
`i18next-browser-languagedetector`, `@supabase/supabase-js`, `xlsx`,
`recharts`, `framer-motion`, `clsx`.

Dev deps:
`typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`,
`autoprefixer`, `eslint`, `@typescript-eslint/parser`,
`@typescript-eslint/eslint-plugin`, `eslint-plugin-react`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
`prettier`, `eslint-config-prettier`, `vitest`, `@vitest/ui`, `jsdom`,
`@testing-library/react`, `@testing-library/jest-dom`,
`@testing-library/user-event`, `@playwright/test`, `supabase` (CLI as a dev
dep is optional — document the `npm i -g supabase` fallback in README), and
`@types/react`, `@types/react-dom`, `@types/node`.

Pin Node ≥ 18 in `engines` and in a `.nvmrc`.

### 2. Config files

- `vite.config.ts` — React plugin, alias `@` → `src/`, test config (jsdom env,
  globals true, setup file `src/test/setup.ts`).
- `vitest.integration.config.ts` — extends the base, overrides `include` to
  `src/**/*.integration.test.ts`, sets env vars for the local Supabase stack
  (`VITE_SUPABASE_URL=http://127.0.0.1:54321`, `VITE_SUPABASE_ANON_KEY` read
  from a local key — T2 documents the exact anon key Supabase prints).
- `tsconfig.json` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `jsx react-jsx`, paths `@/*` → `src/*`), `tsconfig.node.json` for the Vite config.
- `tailwind.config.ts` (content globs, dark theme tokens matching the existing
  starter palette: `--bg #0f1424`, `--fg #e7ecf5`, `--accent #4f8cff`,
  `--card #1b2238`), `postcss.config.js`.
- `playwright.config.ts` — baseURL `http://localhost:4173`, `webServer`
  command `npm run preview`, `use.traceDir`, projects: Chromium (keep it lean).
- `.eslintrc.cjs` (or `eslint.config.js` flat) — TS + React + React-Hooks +
  Prettier (no conflicting formatting rules). `react-refresh/only-export-components`
  as a warning.
- `.prettierrc` — 2 spaces, single quotes, trailing comma `all`, width 100.
- `.env.example` — ONLY variable names, NO values:
  `VITE_SUPABASE_URL=`, `VITE_SUPABASE_ANON_KEY=`.
- `vercel.json` — SPA rewrite: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`,
  build command `npm run build`, output `dist`, install command `npm ci`.
- `index.html` — root `#root`, `<html lang="es">`, title `Banfe-2-cards`.
- `src/main.tsx` — render `<App/>` into `#root`, init i18n.

### 3. Folder scaffold + index barrels

Create the full structure from `plan/README.md` §2 with empty/barrel files so
imports in sibling tasks resolve. Specifically create these barrel/index files
with re-exports of placeholders where appropriate:

- `src/components/ui/index.ts` (empty barrel, siblings add to it via union merge)
- `src/components/game/index.ts`
- `src/components/auth/index.ts`
- `src/components/dashboard/index.ts`
- `src/hooks/index.ts`
- `src/lib/index.ts`

Do NOT stub the actual logic files (engine, scoring, supabase, dataAccess,
protocol, rng, export) — leave those for T1/T2. Only create barrels + the
minimal `App.tsx` + `routes.tsx` skeleton below.

### 4. Minimal app + routing skeleton

- `src/App.tsx` — `<RouterProvider router={router}/>` (or the
  `createBrowserRouter` form). Include a top-level `LanguageProvider` and an
  `AuthProvider` shell (T2/T3a fill the internals).
- `src/routes.tsx` — define routes with lazy imports + `<Suspense>` placeholders
  for: `/login`, `/` (dashboard, protected), `/patients/new` (protected),
  `/play/:patientId` (protected), `/results/:sessionId` (protected). Each page
  is a placeholder `<div>{t('route.placeholder')}</div>` for now — siblings
  replace them. Export a `ProtectedRoute` placeholder component in
  `src/components/auth/ProtectedRoute.tsx` (T3d fills it; for now it just
  renders `<Outlet/>`).
- `src/pages/` — five placeholder pages as above.

### 5. i18n skeleton (Spanish default, English supported)

- `src/i18n/index.ts` — init `i18next` with `LanguageDetector`, resources from
  `locales/es.json` + `locales/en.json`, fallback `es`, default `es`.
- `src/i18n/locales/es.json` and `en.json` — seed with the namespaces/keys the
  app will use: `common.*`, `auth.*`, `dashboard.*`, `game.*`, `results.*`,
  `patient.*`. Include at least `common.appName`, `common.language`,
  `route.placeholder`. Siblings add keys via union merge.
- `src/i18n/LanguageProvider.tsx` — context + a `useLanguage()` hook exposing
  `locale`, `setLocale`, `t` bound. A `LanguageSwitcher` component in
  `src/components/ui/LanguageSwitcher.tsx` toggles es/en and persists choice
  to `localStorage`.

### 6. Supabase local tooling

- `supabase/config.toml` — `project_id = "banfe-2-cards"`, enable db, auth,
  storage; standard local ports (5432 Postgres, 54321 API, 9999 GoTrue).
- `supabase/.gitignore` — ignore `supabase/.branches`, `supabase/.temp`.
- `supabase/migrations/` — empty for T0 (T2 creates `0001_init.sql`,
  `0002_rls.sql`). Do NOT create migration files here.

### 7. Testing infrastructure

- `src/test/setup.ts` — imports `@testing-library/jest-dom`, mocks
  `matchMedia`, `IntersectionObserver`, `ResizeObserver`, resets DOM between
  tests.
- `src/test/integration.setup.ts` — helpers to talk to the local Supabase
  stack: create a clinician user via the GoTrue admin API, sign in, get an
  anon+authed client. (T2 fills in the RLS-specific assertions; you provide
  the harness.)
- `playwright/` — `playwright.config.ts` is at root; put an example
  `playwright/smoke.spec.ts` that loads `/login` and asserts the title
  renders (so the E2E command works end-to-end from day one).

### 8. `AGENTS.md` (repo root)

List the canonical commands (every script above) and the testing workflow so
other agents read it without guessing. Also note: Node ≥ 18, Docker required
for integration tests, `npm run supabase:start` before integration tests,
`npm run supabase:db:reset` to apply migrations.

### 9. `.gitignore` (extend the existing)

Add: `node_modules/` (already), `dist/` (already), `.env` (already),
`playwright-report/`, `test-results/`, `coverage/`, `.vitest/`,
`supabase/.branches/`, `supabase/.temp/`, `*.local`.

### 10. README (replace the starter)

Project overview, scripts table, local-dev quickstart (`npm i`, `npm run dev`),
testing quickstart (unit / integration / e2e), Supabase local setup, env var
contract, Vercel deploy pointer (T5 expands the runbook).

## Tests you must write (TDD where applicable)

- `src/test/setup.ts` and `src/test/integration.setup.ts` exist and load.
- One smoke unit test: `src/App.test.tsx` renders `<App/>` and asserts the
  placeholder dashboard route shows a known string (validates the test
  pipeline + i18n + router all wire up).
- One Playwright smoke spec (`playwright/smoke.spec.ts`) as above.
- Run: `npm run test` green, `npm run test:e2e -- --reporter=list` green
  (it will hit the placeholder login page — that's fine).

## Gates (must pass before pushing)

```
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run test:e2e   # smoke only at this stage
```

Integration tests (`npm run test:integration`) are not expected to pass yet
(no migrations) — create the config and harness, leave a passing empty
`describe('integration harness', () => { it('loads', () => {}) })` so the
command exits 0.

## Notes for downstream tasks (put in your DONE report)

- Exact alias and path config (`@/*`).
- The default anon key the local Supabase prints (so T2 can hardcode it in the
  integration config) — OR confirm T2 should read it from `supabase status -o
  env`.
- Any dep version constraints you pinned.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
