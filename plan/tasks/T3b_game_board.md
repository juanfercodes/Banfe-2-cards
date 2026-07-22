# T3b — Game Board (Graphic & Gaming Engine)

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/kimi-k3` · **Effort**: `max`
**Depends on**: T0 (scaffold), T1 (engine/scoring), T3a (UI primitives + Layout)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

This is the **centerpiece** — the "graphic and gaming engine" the user
emphasized. Build the interactive game board: 5 face-down stacks, card flip
and draw animations, penalization reveal, live score, turn counter, and
progress. Make it feel real, responsive, and satisfying. This is where the
scarce Kimi K3 budget is spent.

You consume the **pure logic** from T1 (`createGame`, `draw`, `canDraw`,
`remaining`, types) and the **primitives** from T3a (`Layout`, `Button`,
`Card`). You do NOT touch Postgres directly — on finish you call a
`saveSession`-shaped callback prop the integrator wires to T2 in T4.

## Deliverables (all under `src/components/game/` + `src/hooks/`)

### 1. `src/hooks/useGame.ts` — the game controller hook

- Wraps the T1 engine. State: `GameState` + `ScoreSummary` (recomputed on
  each draw via `summarize`).
- API: `useGame({ totalTurns, seed? })` returns `{ state, summary, draw,
  reset, canDraw, remaining, isFinished }`.
- `draw(stack)` calls the engine's `draw` and updates state immutably.
- `reset()` starts a new game (new seed by default, or a provided one).
- Exposes the current `seed` for reproducibility/save.
- Deterministic when a `seed` is supplied.

### 2. `src/components/game/PlayingCard.tsx`

- A single card with a 3D flip animation (Framer Motion `rotateY`).
- Faces: back (pattern/brand), reward face (shows the stack's reward), and a
  penalization overlay/reveal (shows the penalty when `hadPenalty`).
- Props: `{ stack: StackId; reward: number; hadPenalty: boolean; penalty:
  number; revealed: boolean; flipped: boolean }`.
- Color coding: advantageous stacks (1,2) subtle green tint; disadvantageous
  (4,5) subtle red tint; neutral (3) default. Tasteful, not garish.

### 3. `src/components/game/Stack.tsx`

- A face-down deck rendered as a stacked card pile (a few layered cards to
  suggest depth). Shows the stack number + reward on a label below.
- Click to draw the top card → triggers the `PlayingCard` flip + penalization
  reveal animation, then a brief settle, then the drawn card is removed from
  the pile and the pile shrinks.
- Disabled state when `canDraw` is false (empty or finished).
- Shows remaining count.
- Keyboard accessible: focusable, `Enter`/`Space` to draw, `aria-label`
  announces stack number, reward, and remaining.

### 4. `src/components/game/ScoreBar.tsx`

- Sticky bar showing: running total (`state.runningTotal`), turn counter
  (`turn / totalTurns`), penalizations count, and a progress bar.
- Updates live with a subtle tween on value change (Framer Motion or a CSS
  transition).

### 5. `src/components/game/GameBoard.tsx`

- Composes `Layout` (from T3a) + `ScoreBar` + 5 `Stack`s in a responsive grid.
- Receives `useGame` state via props or context (your call — but a `GameProvider`
  context is cleaner for the `ResultsPage` to read the final summary).
- On `isFinished`, shows a "Ver resultados" / "See results" button that calls
  an `onFinish(summary, events, seed)` prop (T4 wires this to `saveSession` +
  navigate to `/results/:sessionId`).
- "Easy at the beginning" UX: if `totalTurns === SHORT_TOTAL_TURNS` (T1
  constant), show an onboarding banner explaining the shortened first session.
  The decision of whether to use the short mode is made by the route/page
  (T3d/T4) and passed in — the board just renders the banner when it sees the
  short turn count.

### 6. `src/pages/GamePage.tsx`

- Reads `:patientId` from params. Creates a game via `useGame` (default full
  200 turns; the page can pass `SHORT_TOTAL_TURNS` when the patient has zero
  prior sessions — T3d/T4 supplies that flag; for now accept a `shortMode`
  prop or query param `?short=1`).
- Renders `<GameBoard/>`. On finish, calls `onFinish`.
- "Reiniciar" / "Restart" button to reset the current game.

### 7. Animations & feel (the K3 value-add)

- Card flip: smooth 3D `rotateY` with a spring; the back face shows during
  the first half, the reward face in the second half.
- Penalization reveal: when `hadPenalty`, a red penalty chip slides/fades in
  over the card with a subtle shake; the running total tweens down.
- Reward: a green "+N" floats up from the drawn card and fades.
- Stack draw: the pile visually loses its top card (translateY + fade), the
  remaining pile settles.
- Respect `prefers-reduced-motion`: disable non-essential animation when set
  (read `matchMedia('(prefers-reduced-motion: reduce)')`).

## Tests (Vitest + Testing Library)

- `useGame.test.ts`:
  - `draw` updates running total and events; immutable.
  - `isFinished` flips at `totalTurns`; further `draw` is a no-op (or rejected).
  - `reset` produces a fresh idle state with a new seed (or supplied one).
  - Determinism: same seed → identical events after the same draw sequence.
  - `summary` recomputed and matches T1's `summarize(events)`.
- `PlayingCard.test.tsx` — renders reward face when `revealed`, shows penalty
  chip when `hadPenalty`, hides both when not revealed.
- `Stack.test.tsx` — click draws a card (calls `onDraw`), disabled when
  `canDraw` is false, keyboard `Space`/`Enter` draws, `aria-label` includes
  stack + reward + remaining.
- `ScoreBar.test.tsx` — shows running total, turn counter, penalizations,
  progress fraction.
- `GameBoard.test.tsx` — renders 5 stacks, finish button appears at
  `isFinished`, restart resets, short-mode banner shows when `totalTurns`
  is the short value.
- Reduced-motion: assert no transform/animation classes applied when
  `prefers-reduced-motion: reduce` (mock `matchMedia`).

## Gates (must pass before pushing)

```
npm run typecheck
npm run lint
npm run test
npm run build
```

No integration tests (no DB). An E2E spec for "play a short game end to end"
is welcome but optional — T4 owns the full E2E.

## Notes for the integrator (put in your DONE report)

- The exact `onFinish(summary, events, seed)` callback shape T4 will wire to
  `saveSession` + navigation.
- The `GameProvider`/context API (if you used one) T3c and T4 will consume.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
