# T3c — Results Screen

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/kimi-k2.7-code` · **Effort**: `high`
**Depends on**: T0 (scaffold), T1 (scoring types), T3a (primitives)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Build the post-session results screen a clinician (and optionally the
patient) sees: per-stack net, the learning curve across blocks, the
advantage/disadvantage index, penalization count, and a short clinical
interpretation hint. Chart-driven via `recharts`. Spanish default + English.

You consume T1's `ScoreSummary` + `TurnEvent[]` types and T3a's primitives
(`Card`, `StatCard`, `Button`). You do NOT fetch from Postgres directly —
accept the data via route state / props; T4 wires the real `getSession` call.
For development, render from a `loadFakeSummary()` test fixture.

## Deliverables

### 1. `src/pages/ResultsPage.tsx`

- Route `/results/:sessionId`. Reads a `ScoreSummary` + `TurnEvent[]` from
  router state (T4 will load from Supabase by `sessionId` and pass via state
  / context). Falls back to a friendly "no data" state if missing (so the
  route is reachable in isolation).
- Sections, top to bottom:
  1. **Header**: session date (from `startedAt`/`endedAt` if provided),
     patient code if available, "Volver al panel" / "Back to dashboard" button.
  2. **Summary stat cards** (reuse T3a `StatCard`): `totalNet`,
     `advantageDisadvantageIndex` (with a positive/negative label:
     "Ventajoso" / "Disventajoso"), `penalizations`, total draws.
  3. **Per-stack breakdown** (`PerStackBreakdown.tsx`): a horizontal bar per
     stack showing net (color-coded: green for advantageous, red for
     disadvantageous, gray for neutral), with the stack's reward/penalty
     contingency shown alongside (so the clinician sees why).
  4. **Learning curve** (`LearningCurveChart.tsx`): a recharts `LineChart`
     of `learningCurve` (net per block) with block labels on the x-axis
     ("Bloque 1".."Bloque N"), a zero reference line, and a tooltip. Annotate
     the trend (improving / declining / stable) in a caption.
  5. **Draws per stack** (`DrawsPerStackChart.tsx`): a recharts `BarChart` of
     `drawsPerStack` across the 5 stacks — visually shows whether the patient
     favored low or high stacks.
  6. **Interpretation hint** (`InterpretationHint.tsx`): a plain-language
     block (not a diagnosis) describing what the index + learning curve
     suggest (e.g. "El paciente muestra preferencia por stacks
     desventajosos, sugiriendo dificultad en la modulación del riesgo."),
     with an explicit disclaimer that this is not a clinical diagnosis.
- "Exportar resultados" / "Export results" button — calls an `onExport`
  prop T4 wires to the SheetJS exporter (T3e owns the exporter; you just call
  the callback).

### 2. Components (under `src/components/results/` or `src/components/game/`)

- `PerStackBreakdown.tsx` — props `{ summary: ScoreSummary }`. Accessible:
  each bar has an `aria-label` with stack + net.
- `LearningCurveChart.tsx` — props `{ learningCurve: number[] }`. Responsive
  container. `prefers-reduced-motion` disables recharts animations.
- `DrawsPerStackChart.tsx` — props `{ drawsPerStack: Record<StackId, number> }`.
- `InterpretationHint.tsx` — props `{ summary: ScoreSummary }`. Logic: pure
  function `interpret(summary): { trend,倾向, textKey }` returning i18n keys,
  so the strings live in the locale files, not the component.

### 3. i18n keys (add to both `es.json` and `en.json` — union-merge)

`results.title`, `results.totalNet`, `results.advDisadvIndex`,
`results.advantageous`, `results.disadvantageous`, `results.neutral`,
`results.penalizations`, `results.totalDraws`, `results.perStack`,
`results.learningCurve`, `results.drawsPerStack`, `results.block`,
`results.trend.improving`, `results.trend.declining`, `results.trend.stable`,
`results.interpretation.*` (the hint text keys), `results.disclaimer`,
`results.export`, `results.backToDashboard`, `results.noData`.

## Tests (Vitest + Testing Library)

- `interpret.test.ts` (pure function) — given a `ScoreSummary` favoring low
  stacks, returns the "advantageous" tendency; favoring high →
  "disadvantageous"; a flat learning curve → "stable"; rising → "improving";
  falling → "declining".
- `ResultsPage.test.tsx` — renders all sections from a fixture; stat cards
  show the right numbers; "no data" fallback when state is empty; export
  button calls `onExport`.
- `PerStackBreakdown.test.tsx` — 5 bars rendered with correct nets and
  aria-labels; color classes match advantageous/disadvantageous.
- `LearningCurveChart.test.tsx` — renders a point per block; reduced-motion
  disables animations (assert recharts `isAnimationActive=false` when
  `matchMedia` reduce is set).
- `DrawsPerStackChart.test.tsx` — 5 bars with correct counts.
- `InterpretationHint.test.tsx` — renders the disclaimer; switches text by
  tendency; i18n: English key renders English text.

## Gates (must pass before pushing)

```
npm run typecheck
npm run lint
npm run test
npm run build
```

No integration/E2E tests for this task.

## Notes for the integrator (put in your DONE report)

- The `ResultsPage` expected input shape (route state vs. context) so T4 can
  wire `getSession` → pass data in.
- The `onExport` callback signature so T3e/T4 can wire the SheetJS exporter.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
