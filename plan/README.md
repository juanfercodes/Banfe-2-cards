# Banfe-2-cards — Build Plan

A browser-based implementation of the **BANFE-2** card decision-making task
(Batería Neuropsicológica de Funciones Ejecutivas y Lóbulos Frontales),
for clinician use: login, multi-patient history, statistics, Excel export.
Deployed on Vercel; Supabase Auth + Postgres backend. Spanish default, English
supported. No secrets in the repo.

This folder is the **source of truth** for the build. Each task is a
self-explanatory Markdown unit under `plan/tasks/`. Herdr worktree workers
read `plan/PREAMBLE.md` + their own task file and execute autonomously.

---

## 1. Locked decisions

| Area | Decision |
|---|---|
| Protocol | Reconstructed from standard BANFE-2 + user brief (see §3). **Raw + indexed scoring only** (no age/education norms — patient profile is just a code). |
| Stack | **Vite + React 18 + TypeScript (strict) + Tailwind CSS + Framer Motion**. `react-router-dom`, `react-i18next`, `@supabase/supabase-js`, `xlsx` (SheetJS), `recharts`. |
| Auth | **Supabase Auth** (email/password). Session via `@supabase/supabase-js`. |
| Persistence | **Supabase Postgres** with **RLS** (clinician-scoped isolation). Cross-device, multi-patient. |
| Patient profile | Minimal: a patient **code** (e.g. `P-001`) unique per clinician. No PII, no age/education. |
| Export | **Excel `.xlsx`** via SheetJS. |
| i18n | Spanish (`es`) default, English (`en`) opt-in. `react-i18next`. |
| Hosting | **Vercel** static build. Supabase keys in Vercel project env vars (never in repo). |
| Secrets | NONE in repo. `.env.example` carries var names only. Supabase `anon` key is public-safe (RLS-protected); `service_role` is never shipped to the browser. |

## 2. Folder structure (target)

```
index.html
package.json
vite.config.ts
tsconfig.json
tsconfig.node.json
tailwind.config.ts
postcss.config.js
vercel.json
.env.example
AGENTS.md
README.md
src/
  main.tsx
  App.tsx
  routes.tsx
  i18n/
    index.ts
    locales/{es,en}.json
  lib/
    supabaseClient.ts
    protocol.ts          # stacks, decks, contingency table
    gameEngine.ts        # state machine, draw, penalize, events
    scoring.ts           # net, per-stack, cumulative series, adv/disadv index
    rng.ts               # seedable deterministic RNG
    dataAccess.ts        # patients + sessions CRUD (typed)
    export.ts            # SheetJS .xlsx export
  hooks/
    useAuth.ts
    usePatients.ts
    useSessions.ts
    useGame.ts
  components/
    ui/                  # Button, Card, Input, StatCard, Table, Modal, Badge
    game/                # Stack, PlayingCard, GameBoard, ScoreBar, TurnCounter
    auth/                # LoginForm, ProtectedRoute
    dashboard/           # StatsCards, HistoryTable, ExportButton, PatientPicker
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    PatientNewPage.tsx
    GamePage.tsx
    ResultsPage.tsx
supabase/
  migrations/
    001_init.sql
    002_rls.sql
```

## 3. Protocol (the spec every worker must respect — corrected by T6)

> ⚠️ If any number is wrong, STOP and use the BLOCKED protocol (see PREAMBLE).
> Do not silently "fix" the protocol — flag it.

**Construct measured**: decision-making under risk, reward/punishment learning,
impulsivity vs. strategic behavior (orbitofrontal / dorsolateral prefrontal).

**Setup (standard version — the clinical default)**:
- 5 stacks labeled `1..5`, each a face-down deck of **18 cards** → **90 cards total**.
- A session is **50 turns**: the player makes 50 draws, then the game ends. Since
  50 < 90 the decks are never all exhausted; a single stack CAN run out at 18
  draws — it becomes unavailable and the player must pick another stack.
- Each turn: the player picks a stack, the top card is drawn face-up onto that
  stack's **discard pile**, a **reward** is added, then a **penalization** (if the
  card carries one) subtracts points. The discard piles accumulate for the whole
  session so the decision history per deck stays visible.
- Higher-score stacks carry larger / more frequent penalizations.

**Game versions** (`lib/protocol.ts`, chosen by the clinician in a selector when
starting a session; not yet persisted in the DB):

| id | deckSizePerStack | totalTurns | note |
|---|---|---|---|
| `standard` | 18 | 50 | **default** — the 90-card / 50-draw clinical game |
| `extended` | 40 | 200 | legacy full-length reconstruction |
| `short` | 40 | 100 | legacy short reconstruction |

**Contingency table** (reward per draw, penalization amount, penalization
probability, net expected value per draw):

| Stack | Reward/draw | Penalization | Penalization prob. | Net expected/draw |
|---|---|---|---|---|
| 1 | +1 | 0   | 0%  | +1.0  |
| 2 | +2 | −1  | 25% | +1.75 |
| 3 | +3 | −3  | 50% | +1.5  |
| 4 | +4 | −6  | 50% | +1.0  |
| 5 | +5 | −10 | 60% | −1.0  |

**Advantageous stacks** = low-score (1, 2). **Disadvantageous** = high-score (4, 5).
Stack 3 is neutral.

**Scoring (computed by `lib/scoring.ts`)**:
- `net_total` = sum of all turn net results.
- `per_stack` = `{ [stack]: net }` for stacks 1..5.
- `penalizations` = count of penalization events.
- `adv_disadv_index` = `(sum of draws in stacks 1,2) − (sum of draws in stacks 4,5)`.
  Positive ⇒ advantageous/strategic; negative ⇒ disadvantageous/impulsive.
- There are **no learning-curve blocks**: the game runs straight through its 50
  turns. The Results screen shows a **cumulative net-score line** (running total
  after each turn, `cumulativeNet(events)`), computed from `raw_events`.

**Session record persisted** (`sessions` table):
`patient_id, started_at, ended_at, total_net, per_stack (jsonb),
penalizations, learning_curve (jsonb — deprecated, always stored as '[]'),
adv_disadv_index, raw_events (jsonb)`. The `learning_curve` column is retained
only to avoid a migration; nothing reads it.

## 4. Data model (Supabase Postgres)

```sql
-- 001_init.sql
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  unique (clinician_id, code)
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_net int not null default 0,
  per_stack jsonb not null default '{}'::jsonb,
  penalizations int not null default 0,
  learning_curve jsonb not null default '[]'::jsonb,
  adv_disadv_index int not null default 0,
  raw_events jsonb not null default '[]'::jsonb
);
create index on public.sessions (patient_id, started_at desc);
create index on public.sessions (clinician_id, started_at desc);
```

```sql
-- 002_rls.sql
alter table public.patients enable row level security;
alter table public.sessions enable row level security;
create policy "own patients" on public.patients
  for all using (auth.uid() = clinician_id) with check (auth.uid() = clinician_id);
create policy "own sessions" on public.sessions
  for all using (auth.uid() = clinician_id) with check (auth.uid() = clinician_id);
```

## 5. Model allocation

Per the opencode Go model matrix. Kimi K3 is scarce (490 req/mo) and reserved
for the most visual/interactive UI. The rest of the UI uses **Kimi K2.7 Code**
(same Kimi family, code-specialized, 9250 req/mo). Reasoning-critical engine
work uses **Qwen3.7 Max**; security-critical backend uses **GLM-5.2**.

| Task | Model ID | Effort | Rationale |
|---|---|---|---|
| T0 Foundation + scaffold | `opencode-go/kimi-k2.7-code` | high | Lots of boilerplate code; workhorse. |
| T1 Protocol + engine + scoring + RNG | `opencode-go/qwen3.7-max` | high | Deep reasoning: state machine + scoring + tests. |
| T2 Supabase backend (SQL + RLS + auth + data layer) | `opencode-go/glm-5.2` | high | Security-critical; GLM-5.2 is the critical backup. |
| T3a UI foundation (shell, routing, primitives) | `opencode-go/kimi-k2.7-code` | high | UI scaffolding; workhorse. |
| T3b Game board (card flips, board, live score) | `opencode-go/kimi-k3` | max | **Centerpiece "graphic & gaming engine"** — spends the scarce K3 budget here. |
| T3c Results screen (per-stack, learning curve, index) | `opencode-go/kimi-k2.7-code` | high | Visual but chart-driven (recharts); K2.7 Code is enough. |
| T3d Auth + patient UI + onboarding ramp | `opencode-go/kimi-k2.7-code` | high | Forms + flow; workhorse. |
| T3e Dashboard + history table + stats + export | `opencode-go/kimi-k2.7-code` | high | Table + stats + SheetJS; workhorse. |
| T4 Integration + a11y + E2E | `opencode-go/kimi-k2.7-code` | high | Wiring + tests. |
| T5 Docs + deploy runbook | `opencode-go/glm-5.2` | medium | Prose + runbook. |

> **K3 note**: K3 is allocated to **T3b only** (the game board — exactly the
> "graphic and gaming engine" the user emphasized). Other UI tasks use
> Kimi K2.7 Code (same family, code-specialized) to stay within the 490 req/mo
> K3 cap. Say the word to re-route if you want K3 everywhere (cap risk).

## 6. Batches & parallelization

```
Batch 1 (sequential — foundation):
  T0  Foundation + scaffold        [K2.7 Code]
        │ (merge to develop, then cascade)
        ▼
Batch 2 (3 concurrent — core layers):
  T1  Protocol + engine + scoring  [Qwen3.7 Max]   ┐
  T2  Supabase backend + auth      [GLM-5.2]       ├── parallel
  T3a UI foundation                [K2.7 Code]     ┘
        │ (merge all, then cascade)
        ▼
Batch 3 (4 concurrent — UI features):
  T3b Game board         [Kimi K3]      (needs T1 + T3a)  ┐
  T3c Results screen     [K2.7 Code]    (needs T1 + T3a)  ├── parallel
  T3d Auth + patient UI  [K2.7 Code]    (needs T2 + T3a)  │
  T3e Dashboard + export [K2.7 Code]    (needs T2 + T3a)  ┘
        │ (merge all, then cascade)
        ▼
Batch 4:
  T4  Integration + a11y + E2E     [K2.7 Code]   (needs all)
        │
        ▼
Batch 5:
  T5  Docs + deploy runbook        [GLM-5.2]     (needs all)
```

**Shared-file conflict points** (union-merge on PR rebase — never pick-a-side):
`package.json` (T0 pre-installs ALL deps so downstream rarely edits it),
`src/routes.tsx`, `src/components/ui/index.ts`, `src/i18n/locales/{es,en}.json`,
`src/App.tsx`. T0 scaffolds these maximally so downstream tasks mostly ADD files.

## 7. Task index

| ID | File | Depends on |
|---|---|---|
| T0  | [tasks/T0_foundation.md](tasks/T0_foundation.md) | — |
| T1  | [tasks/T1_engine.md](tasks/T1_engine.md) | T0 |
| T2  | [tasks/T2_backend.md](tasks/T2_backend.md) | T0 |
| T3a | [tasks/T3a_ui_foundation.md](tasks/T3a_ui_foundation.md) | T0 |
| T3b | [tasks/T3b_game_board.md](tasks/T3b_game_board.md) | T1, T3a |
| T3c | [tasks/T3c_results.md](tasks/T3c_results.md) | T1, T3a |
| T3d | [tasks/T3d_auth_patient_ui.md](tasks/T3d_auth_patient_ui.md) | T2, T3a |
| T3e | [tasks/T3e_dashboard_history_export.md](tasks/T3e_dashboard_history_export.md) | T2, T3a |
| T4  | [tasks/T4_integration_polish.md](tasks/T4_integration_polish.md) | T3b, T3c, T3d, T3e |
| T5  | [tasks/T5_docs_deploy.md](tasks/T5_docs_deploy.md) | T4 |

Every worker also reads [PREAMBLE.md](PREAMBLE.md) (operating contract).
