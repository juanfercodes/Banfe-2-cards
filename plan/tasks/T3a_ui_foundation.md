# T3a — UI Foundation: Shell, Routing, Primitives

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/kimi-k2.7-code` · **Effort**: `high`
**Depends on**: T0 (foundation + scaffold + i18n + router skeleton)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Build the UI shell and reusable primitives every other UI task (T3b–T3e)
composes. Theme matches the existing dark starter (`--bg #0f1424`, `--fg
#e7ecf5`, `--accent #4f8cff`, `--card #1b2238`). All user-facing strings go
through `react-i18next` with Spanish default + English.

You **do not** implement game logic, auth, or data fetching — you provide the
scaffolding and primitives siblings consume. Keep `src/routes.tsx`,
`src/components/ui/index.ts`, `src/i18n/locales/{es,en}.json`, and `src/App.tsx`
in a merge-friendly shape (siblings add via union merge).

## Deliverables

### 1. App shell + layout

- `src/App.tsx` — wraps the router with `LanguageProvider` and `AuthProvider`
  (import from T2/T0; if not yet present, use a local no-op provider shell
  that siblings swap in via union merge — do not duplicate the real one).
- `src/components/ui/Layout.tsx` — top nav bar (app name, language switcher,
  user menu placeholder with `signOut`), main content area, responsive
  container. Used by the protected routes.
- `src/components/ui/LanguageSwitcher.tsx` — es/en toggle, persists to
  `localStorage` via `useLanguage()` from T0's `LanguageProvider`. (If T0
  already created it, refine + keep the API stable.)

### 2. Routing

- `src/routes.tsx` — finalize the lazy routes T0 scaffolded. Protected routes
  wrap pages in `<ProtectedRoute>` (T3d fills the guard; T3a imports the
  placeholder and renders `<Outlet/>` for now). Keep the lazy + Suspense
  structure. **Add a catch-all `*` → redirect to `/login` or `/`.**
- `src/components/auth/ProtectedRoute.tsx` — if T0 left a placeholder, keep
  its export name stable; T3d will implement the actual auth check.

### 3. UI primitives (Tailwind, a11y, dark theme)

All under `src/components/ui/`, exported from `src/components/ui/index.ts`
(add your exports; union-merge with siblings). Each primitive is a small,
typed, forwardRef component with sensible defaults and `className` passthrough
via `clsx`.

- `Button` — variants: `primary | secondary | ghost | danger`; sizes `sm |
  md | lg`; supports `isLoading` (shows a spinner, disables), `disabled`,
  native button props.
- `Card` — surface container (`--card` bg, rounded, border, padding prop).
- `Input` — text input with label, error message, helper text; accessible
  (`aria-describedby`, `aria-invalid`).
- `StatCard` — labelled metric with a value, optional delta/sublabel, icon
  slot. Used by T3e's dashboard stats.
- `Table` — generic `<Table<T>>` with columns config (`{ key, header, render?
  }`), sortable header (optional), empty state, row click handler. T3e builds
  the history table on top of this.
- `Modal` — accessible dialog (focus trap, ESC to close, backdrop click,
  `aria-modal`, restore focus on close). Built with `<dialog>` or a portal;
  your call, but it must be keyboard-usable.
- `Badge` — small status pill (variants by color).
- `Spinner` — loading indicator.

### 4. i18n additions

Add the keys your primitives and shell use to BOTH `es.json` and `en.json`
(union-merge with siblings): at minimum `common.loading`, `common.cancel`,
`common.close`, `common.save`, `common.delete`, `common.confirm`,
`common.search`, `common.sortAsc`, `common.sortDesc`, `common.noData`,
`common.actions`, `nav.dashboard`, `nav.newPatient`, `nav.signOut`,
`language.es`, `language.en`.

### 5. Theme tokens via Tailwind

Ensure `tailwind.config.ts` exposes the dark palette as semantic tokens
(`bg-base`, `bg-surface`, `text-default`, `text-muted`, `border-subtle`,
`accent`) so siblings use `bg-surface` not raw hex. Body defaults to dark.

## Tests (component tests via Vitest + Testing Library)

- `Layout.test.tsx` — renders nav, language switcher, children; switcher
  toggles locale and the heading re-renders in the new language.
- `Button.test.tsx` — variants render correct classes; `isLoading` disables
  and shows spinner; click handler fires when not disabled/loading.
- `Input.test.tsx` — label association (`htmlFor`/`id`), error message
  surfaced via `aria-describedby`, typing updates value.
- `Table.test.tsx` — renders rows from data, empty state shows when no rows,
  sort header toggles direction, row click fires.
- `Modal.test.tsx` — opens on trigger, closes on ESC and backdrop, focus is
  trapped inside while open, focus restored to trigger on close.
- `StatCard.test.tsx` / `Badge.test.tsx` / `Spinner.test.tsx` — render smoke.

## Gates (must pass before pushing)

```
npm run typecheck
npm run lint
npm run test
npm run build
```

No integration/E2E tests for this task — component tests only.

## Exports downstream tasks rely on (keep names stable)

T3b uses: `Layout`, `Button`, `Card`.
T3c uses: `Card`, `StatCard`, `Table` (maybe), `Button`.
T3d uses: `Layout`, `Button`, `Input`, `Modal`, `ProtectedRoute` (you own the
  file, T3d fills the guard).
T3e uses: `StatCard`, `Table`, `Button`, `Modal`, `Card`.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
