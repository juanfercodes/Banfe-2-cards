# T6 — Game rework: correct 90/50 protocol + visual presence + discard piles

> Read `plan/PREAMBLE.md` first. This is your TASK block. Work in your worktree on
> branch `feat/t6-game-rework` off `origin/develop`. NO PR — commit + rebase only;
> the orchestrator merges. Print DONE/BLOCKED at the end.

## Clinical context (why the details matter)
This is a reconstructed Iowa-Gambling-style task **used to evaluate risk management
and addictive behavior**. The numbers below are AUTHORITATIVE (they supersede the old
plan/README §3 reconstruction). Do NOT change them; if something seems impossible,
STOP and report BLOCKED. The UX must make risk/reward **palpable** and make the
patient's decision history per deck **visible** (that history is the clinical signal).

## 1. Correct the protocol (THE key fix)
The real game is **90 cards total, of which the player draws 50**. Concretely:
- **5 stacks**, each a face-down deck of **18 cards** → 5 × 18 = **90 cards total**.
- A session is **50 turns** (the player makes 50 draws, then the game ends). 50 < 90,
  so decks are not all exhausted; a single stack CAN run out at 18 draws → that stack
  becomes unavailable and the player must pick another (keep the existing empty-stack
  handling; ensure the UI shows an exhausted stack clearly).
- The **contingency table stays exactly as today** (rewards/penalties/probabilities per
  stack; advantageous = 1,2; disadvantageous = 4,5; stack 3 neutral). Do NOT change it.

### Version selector (default 90/50, keep legacy lengths)
Introduce an explicit notion of **game version/preset**, each defining
`{ id, label (i18n), deckSizePerStack, totalTurns }`:
- `standard` — **DEFAULT** — deckSizePerStack **18**, totalTurns **50** (the 90/50 game).
- `extended` — deckSizePerStack 40, totalTurns 200 (legacy full).
- `short` — deckSizePerStack 40, totalTurns 100 (legacy short).
Provide a **selector** the clinician uses when starting a session, **preselected to
`standard`**. Replace the old `?short=1` / `useOnboarding` "first session short then
full" logic with this selector (remove the onboarding short/full coupling; keep any
purely-informational onboarding hint text if trivial, otherwise drop it). The chosen
version drives `useGame`/`gameEngine` (`deckSizePerStack` → `buildDeck` size, `totalTurns`).
`gameEngine` must build each stack with the version's deckSize (today it hardcodes
`DECK_SIZE`). We do NOT persist the version id in the DB this round (no migration) —
note it as a follow-up in your DONE report.

## 2. Remove the learning-curve / blocks entirely
"Sin bloques, sin curva de aprendizaje, todo derecho." Remove the block-segmented
`learningCurve` from `scoring.ts` (drop `BLOCK_SIZE`/`SHORT_BLOCKS` usage; you may delete
those consts and update `plan/README §3`). Keep every other metric: `totalNet`,
`perStack`, `drawsPerStack`, `penalizations`, `advantageDisadvantageIndex`.
- The `sessions.learning_curve` jsonb column STAYS (no migration); just store `[]` and
  stop using it. Note the dead column as a follow-up.
- **Results screen** (`ResultsPage` + `src/components/results`): replace the
  `LearningCurveChart` (blocks) with a **cumulative net-score line over the 50 turns** —
  a continuous line of the running total after each turn, computed from `raw_events`
  (the events are already available in router state / loadable from the session). No
  block bins. Update `interpret.ts`/interpretation text if it referenced blocks/trend
  by block; base any trend on the cumulative series or drop the trend wording. Keep the
  clinical disclaimer.

## 3. Visual presence (the game board must feel like a real game)
Today's board is functional but flat. Give it real presence while keeping it clinical,
accessible, and calm (this is a patient-facing assessment, not an arcade):
- Richer, tactile **cards** (depth/shadow, face vs. back, satisfying draw animation via
  the already-installed framer-motion; honor `usePrefersReducedMotion`).
- Make **risk legible**: advantageous vs. disadvantageous stacks should be visually
  distinguishable in a way that conveys stakes WITHOUT telling the patient which is
  "good" (no green/red "correct answer" cues — that would bias the assessment). Convey
  stake via reward magnitude shown on the card, deck styling, subtle weight — not moral
  coloring.
- Clear **score/turn/progress** presence (turns are now out of 50). Strong typography,
  spacing, and layout hierarchy. Reflow responsively (board grid, piles) on mobile.
- Keep it theme-consistent with the existing UI primitives (`components/ui`), Tailwind.

## 4. Discard piles per stack ("monte", emulating the physical cards)
Beneath/beside each of the 5 stacks, show an **accumulating discard pile** of the cards
the player has already drawn **from that stack**, face-up, growing as they pick. This
lets the patient (and clinician) perceive decision history per deck at a glance — the
core clinical signal for risk-seeking/perseveration. Requirements:
- Each drawn card lands on its stack's pile (drawn animation from deck → pile).
- The pile visibly conveys **count** (fanned/stacked) and the **outcomes** (reward, and
  whether a penalty hit) without clutter — e.g. a neat stacked fan with a count badge and
  penalty markers. Accessible: a per-stack sr-only summary ("Mazo N: M cartas robadas,
  K con penalización").
- Piles reset on a new game; reflow on small screens.

## Gates (per PREAMBLE — TDD where there is logic)
- `npm run typecheck`, `npm run lint`, `npm run build` — green.
- `npm run test` — update/extend unit tests: scoring (no learningCurve; cumulative
  series if you add a helper), engine (deckSize per version; game ends at `totalTurns`;
  stack exhaustion at 18), version presets, plus render tests for the selector, the
  reworked board, and the discard piles.
- `npm run test:integration` — should still pass (a local Supabase/Docker stack is
  running); dataAccess maps `learning_curve` as `[]` fine.
- `npm run test:e2e` — UPDATE the Playwright full-journey spec to the 90/50 game (50
  turns, default version, discard piles visible, results shows the cumulative line).
  Keep auth/i18n/a11y specs green.
- Update `plan/README.md` §3 and `src/lib/protocol.ts` to reflect the corrected spec
  (90 total / 18 per stack / 50 draws / no blocks) so the docs stay authoritative.

## i18n & a11y
Every new string in BOTH `src/i18n/locales/{es,en}.json` (default es). Maintain a11y
(keyboard reachable stacks, focus rings, sr-only summaries for piles and the cumulative
chart). No green/red "right answer" cues (assessment neutrality).

Print the DONE or BLOCKED report per PREAMBLE, including: the version presets you defined,
confirmation the standard game is 90 cards/50 draws by default, what you did with the
learning_curve column, and any follow-ups (e.g. persisting version id, dropping the dead column).
