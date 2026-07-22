# T1 — Protocol, Game Engine, Scoring, RNG

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/qwen3.7-max` · **Effort**: `high`
**Depends on**: T0 (foundation + scaffold + test infra)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Implement the **pure logic layer** of the BANFE-2 card task — no UI, no React.
This is reasoning-critical: the state machine and scoring must be correct,
deterministic, and fully tested, because T3b/T3c build the UX on top of these
exports.

Read `plan/README.md` §3 (the protocol) before coding. The contingency table
and scoring formulas there are authoritative.

## Deliverables (all under `src/lib/`)

### 1. `rng.ts` — seedable deterministic RNG

- Implement **mulberry32** (or an equivalent seedable PRNG). Determinism:
  same seed → same sequence, for reproducible sessions.
- Export: `createRng(seed: number): () => number` returning `[0,1)`.
- Export a helper: `seedFromTimestamp(ts = Date.now()): number`.
- Pure, no side effects, no `Math.random` anywhere in this module.

### 2. `protocol.ts` — the protocol as data

- Export `type StackId = 1 | 2 | 3 | 4 | 5`.
- Export `type Contingency = { stack: StackId; reward: number; penalty: number; penaltyProbability: number }`.
- Export `CONTINGENCIES: readonly Contingency[]` matching §3 exactly:
  - Stack 1: reward +1, penalty 0, prob 0
  - Stack 2: reward +2, penalty −1, prob 0.25
  - Stack 3: reward +3, penalty −3, prob 0.50
  - Stack 4: reward +4, penalty −6, prob 0.50
  - Stack 5: reward +5, penalty −10, prob 0.60
- Export `DECK_SIZE = 40` and `TOTAL_TURNS = 200` (full session).
- Export `SHORT_TOTAL_TURNS = 100` and `SHORT_BLOCKS = 2` (the "easy at the
  beginning" first session for a new patient).
- Export `BLOCK_SIZE = 40`.
- Export `ADVANTAGEOUS_STACKS: readonly StackId[] = [1, 2]` and
  `DISADVANTAGEOUS_STACKS: readonly StackId[] = [4, 5]`.
- Export `buildDeck(stack: StackId, size = DECK_SIZE, rng): StackCard[]` —
  builds a deck for a stack, precomputing which positions penalize (a
  Bernoulli draw per card using `rng()` vs `penaltyProbability`). Each
  `StackCard` carries `{ stack, reward, hasPenalty, penalty }`. The deck is
  shuffled (using the rng) so penalizations are spread, not clustered.

### 3. `gameEngine.ts` — the state machine

- Export `type TurnEvent = { turn: number; stack: StackId; reward: number;
  hadPenalty: boolean; penalty: number; net: number; runningTotal: number }`.
- Export `type GameState = {
    turn: number;
    totalTurns: number;
    runningTotal: number;
    decks: Record<StackId, StackCard[]>;   // remaining cards per stack
    events: TurnEvent[];
    status: 'idle' | 'playing' | 'finished';
    seed: number;
  }`.
- Export `createGame(opts: { totalTurns?: number; seed?: number; rng? }): GameState`
  — builds 5 decks, returns idle state. `totalTurns` defaults to
  `TOTAL_TURNS`; the "easy" mode caller passes `SHORT_TOTAL_TURNS`.
- Export `draw(state: GameState, stack: StackId): GameState` — **pure**:
  returns a NEW state (immutable). Pops the top card of the chosen stack's
  deck, computes the turn net (reward + penalty if any), appends a `TurnEvent`,
  bumps running total, advances turn, and flips `status` to `'finished'` when
  `turn === totalTurns` or all decks are empty. Throws (or returns a
  `GameError` discriminated union — your call, but be consistent) on invalid
  moves: drawing from an empty stack, drawing after `finished`, etc.
- Export `canDraw(state: GameState, stack: StackId): boolean`.
- Export `remaining(state: GameState, stack: StackId): number`.
- Determinism: a given `seed` + sequence of `draw` calls produces a byte-
  identical `events` array. This is a hard requirement (reproducible sessions
  + tests).

### 4. `scoring.ts` — the scoring formulas

- Export `type ScoreSummary = {
    totalNet: number;
    perStack: Record<StackId, number>;
    penalizations: number;
    learningCurve: number[];          // net per block of BLOCK_SIZE
    advantageDisadvantageIndex: number; // (draws in stacks 1,2) − (draws in stacks 4,5)
    drawsPerStack: Record<StackId, number>;
  }`.
- Export `summarize(events: TurnEvent[], totalTurns: number): ScoreSummary`.
- `learningCurve` length = `ceil(totalTurns / BLOCK_SIZE)`; each entry is the
  sum of `net` for turns in that block.
- `advantageDisadvantageIndex` = (# draws in stacks 1 & 2) − (# draws in
  stacks 4 & 5). Use the `ADVANTAGEOUS_STACKS` / `DISADVANTAGEOUS_STACKS`
  constants.
- All formulas match `plan/README.md` §3 exactly. If §3 and your intuition
  disagree, BLOCKED — do not silently change numbers.

## Tests (TDD — write these FIRST, watch them fail, then implement)

Create under `src/lib/__tests__/`:

- `rng.test.ts` — determinism (same seed → same sequence), range ∈ [0,1),
  different seeds diverge, distribution sanity (mean ≈ 0.5 over 10k draws
  within a tolerance).
- `protocol.test.ts` — `CONTINGENCIES` matches §3 row-for-row; `buildDeck`
  produces `DECK_SIZE` cards; penalty count ≈ `penaltyProbability * size`
  within a tolerance; no penalty when prob is 0 (stack 1); penalizations are
  spread (no run of > 5 consecutive penalties).
- `gameEngine.test.ts`:
  - `createGame` builds 5 non-empty decks, idle status, seed stored.
  - `draw` is immutable (previous state untouched).
  - A full 200-turn game ends in `finished` with exactly `TOTAL_TURNS` events.
  - Determinism: two games with the same seed and same draw sequence produce
    identical `events` (deep equal).
  - Drawing from an empty stack / after finished is rejected.
  - Running total equals sum of event nets at every step.
  - "Easy" mode: `createGame({ totalTurns: SHORT_TOTAL_TURNS })` finishes at
    100 turns with a 2-block learning curve.
- `scoring.test.ts`:
  - Hand-crafted `events` fixture → assert each field of `ScoreSummary`.
  - `advantageDisadvantageIndex` sign matches expectation for a fixture that
    favors low stacks (positive) vs high stacks (negative).
  - `learningCurve` length and per-block sums for 200 turns (5 blocks) and
    100 turns (2 blocks).

## Gates (must pass before pushing)

```
npm run typecheck
npm run lint
npm run test          # all logic tests green
npm run build
```

No integration/E2E tests for this task — it's pure logic.

## Exports downstream tasks rely on (do not rename without a BLOCKED)

T3b uses: `createGame`, `draw`, `canDraw`, `remaining`, `GameState`,
`TurnEvent`, `StackId`.
T3c uses: `summarize`, `ScoreSummary`, `ADVANTAGEOUS_STACKS`,
`DISADVANTAGEOUS_STACKS`, `BLOCK_SIZE`.
T2's `saveSession` consumes `ScoreSummary` + `TurnEvent[]` → store as jsonb.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
