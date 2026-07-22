# Orchestrator State — Banfe-2-cards

> **Purpose**: let any future session resume the orchestration. This is a
> backstop tracker; **always reconcile against git ground truth** before acting
> (PRs merged? branches? pane states?) — see `plan/PREAMBLE.md` and the
> herdr-orchestrator skill. Update this file at every batch boundary.

Last updated: 2026-07-21 21:48 (session 1 — T1 merged, T2/T3a running, infra ready)

## Infra ready (session 1, orchestrator-prepared)
- **`.env`** in main checkout with local Supabase URL + anon key (gitignored, verified).
- **`.gitleaks.toml`** + **`.githooks/pre-commit`** secret-scan hook (committed to
  develop). Blocks staged `.env` + runs `gitleaks --staged`. Activate per checkout:
  `git config core.hooksPath .githooks`. Allowlists the local demo anon key.
- **gitleaks** installed via Homebrew (v8.30.1).
- **Plan fix**: `learning_curve` block count for short sessions = `ceil(100/40)=3`
  (was incorrectly stated as 2). T1 worker flagged it; formula is authoritative.

## Infra pending (user-side, needs your accounts)
- **Supabase prod project**: create at supabase.com, note URL + anon key for Vercel.
  Do NOT apply migrations yet (T2 writes them; apply after T2 merges).
- **`supabase login`** + `supabase link --project-ref <ref>` in main checkout.
- **Vercel project**: `vercel link` or import on vercel.com (Vite preset). No deploy
  until T2+T3b/d/e merge.
- **GitHub** (optional): protect `main`, leave `develop` open for our direct merges.

## Workflow change (session 1): NO PRs — direct merge to develop
- `gh` token is for `juanfercodesletz` (only `pull` perms on
  `juanfercodes/Banfe-2-cards`); SSH key pushes as `juanfercodes`. PR creation
  fails with "must be a collaborator". User chose **direct merge to develop**
  (no PR) for solo-dev speed.
- **New worker contract**: workers do NOT push or open PRs. They implement,
  run gates, rebase onto `origin/develop`, and print DONE/BLOCKED with branch
  name + summary. The **orchestrator (this session) merges** the branch into
  `develop` locally (FF or merge) and pushes via SSH.
- Worker prompts updated accordingly (see "Prompt template" below).
- T0 was merged this way at 21:33 (FF, 3 commits).

## Vim-hang guard (session 1 lesson)
- `git rebase --continue` opens vim with no tty → hang. Fixed for all
  worktrees by setting `git config core.editor true` + `sequence.editor true`
  per worktree before launching the worker. Re-apply for every new worktree.

## Base branch
- `origin/develop` (PR target for all task branches). `main` is production.

## SESSION 2 PIVOT (2026-07-21 ~22:20) — OpenCode → Claude workers
OpenCode/GLM hit its shared 5h usage cap mid-Batch-2 (froze T2 with uncommitted
WIP for ~2.5h). **User decision: migrate all workers from OpenCode to Claude Code
sessions in the same worktrees, using Claude models + efforts.** The socket waker
is agent-agnostic (tracks `pane.agent_status_changed` by pane_id — the event even
carries `"agent":"claude"`), so monitoring needed NO code change, only re-target.

### Claude launch recipe (herdr panes do NOT inherit CLAUDE_CONFIG_DIR)
Reuse the worktree's own root pane (correct cwd + already on the branch). Kill the
frozen OpenCode first (`herdr pane send-keys <p> C-c` ×2 → shell), set worktree
guards (`git config core.editor true; sequence.editor true; core.hooksPath .githooks`),
then:
```
herdr pane run <worktree-root-pane> 'CLAUDE_CONFIG_DIR=/Users/juanfer/.claude-work claude --model <id> --effort <lvl> --dangerously-skip-permissions "<one-line prompt, no single-quotes/$/backtick>"'
```
`--dangerously-skip-permissions` auto-passes the trust gate here (config dir already
trusts the repo). Prepend `ultracode ` in the prompt for security/critical tasks.
Point the prompt at a takeover/task file by absolute path (dodges shell-quoting).
On resume after a cap exit: RE-PASS `--model` AND `--effort` (effort silently drifts
to the env default otherwise) — `claude --resume <id> --model <id> --effort <lvl> ...`.

## Model allocation — CLAUDE (session 2, active)
| Task | Claude model | Effort | Notes |
|---|---|---|---|
| T2 Backend+RLS+Auth | `claude-opus-4-8` | high | +ultracode (security-critical RLS). Takeover of GLM WIP. |
| T3b Game board | `claude-fable-5` | high | User pick — centerpiece; Fable strong for UI/games (was slated for Kimi K3). |
| T3c Results screen | TBD (proposed `claude-sonnet-5` medium) | — | confirm at Batch 3 launch |
| T3d Auth+Patient+Onboarding | TBD (proposed `claude-sonnet-5` high) | — | confirm at Batch 3 launch |
| T3e Dashboard+History+Export | TBD (proposed `claude-sonnet-5` medium) | — | confirm at Batch 3 launch |
| T4 Integration+E2E | TBD (proposed `claude-opus-4-8` high) | — | confirm at Batch 4 launch |
| T5 Docs+Deploy | TBD (proposed `claude-fable-5` low) | — | leaf/docs |

## Model allocation — SESSION 1 (OpenCode, historical; T0/T1 built with these)
| Task | Model ID | Effort |
|---|---|---|
| T0 Foundation | `opencode-go/kimi-k2.7-code` | high |
| T1 Engine+Scoring+RNG | `opencode-go/qwen3.7-max` | high |
| T2 Backend+RLS+Auth | `opencode-go/glm-5.2` | high |
| T3a UI foundation | `opencode-go/kimi-k2.7-code` | high |
| T3b Game board (K3!) | `opencode-go/kimi-k3` | max |
| T3c Results screen | `opencode-go/kimi-k2.7-code` | high |
| T3d Auth+Patient+Onboarding | `opencode-go/kimi-k2.7-code` | high |
| T3e Dashboard+History+Export | `opencode-go/kimi-k2.7-code` | high |
| T4 Integration+E2E | `opencode-go/kimi-k2.7-code` | high |
| T5 Docs+Deploy | `localmstudio/qwen/qwen3.6-35b-a3b` | medium | ← moved to local |

### Local model (unlimited, fast, needs review)
- **`localmstudio/qwen/qwen3.6-35b-a3b`** — 35B MoE, ~70 tps, served via LM Studio
  (opencode `localmstudio` provider). Unlimited usage; great budget-stretcher.
- **Trade-off**: less accurate than the cloud models — **always review its output**
  (diff review + run the gates). Route here for:
  - Leaf / boilerplate / docs tasks (T5 docs+deploy assigned here).
  - Test fixtures, barrel files, mechanical refactors.
  - De-escalation when approaching a cloud cap (K3/GLM/Qwen/K2.7).
- **Do NOT route here**: reasoning-critical (T1 engine, T4 integration),
  security-critical (T2 RLS), or the visual centerpiece (T3b game board — K3).
- Launch form identical to cloud: `--model localmstudio/qwen/qwen3.6-35b-a3b`
  (no `--variant` — local models don't expose the effort ladder; effort = model).

## Launch mode (decided session 1)
- **Workers are `opencode` sessions in herdr panes** (not `claude`). opencode auth
  is global (`~/.local/share/opencode/auth.json`) — no `CLAUDE_CONFIG_DIR` gotcha.
- **Launch style**: user preference = **interactive TUI mode** so the orchestrator
  can read blocks and respond, NOT fire-and-forget `opencode run`. For T0 we
  started with `opencode run` (non-interactive) before this was decided — let it
  finish, then switch subsequent tasks to interactive. (T0 is large and already
  ~working; killing it would waste progress.)
- Launch command (non-interactive, used for T0):
  `herdr pane run <pane> 'opencode run --model opencode-go/<id> --variant <effort> --auto --dir <worktree> "<prompt>" --title "<TASK>"'`
- Interactive mode for T1+ (preferred): open the opencode TUI in the pane
  (`herdr pane run <pane> 'opencode'`), wait `idle`, then feed the task via
  `herdr pane run <pane> "<prompt>"`. Monitor with `herdr wait agent-status` /
  `pane read --source visible` and respond on `blocked`.

## Monitoring (session 1: migrated to socket push)
- **`scratchpad/waker-socket.py`** — persistent python3 daemon subscribing to
  `pane.agent_status_changed` via `$HERDR_SOCKET_PATH`. Push-based (~1s reaction),
  watches MANY panes in ONE socket connection, does NOT exit on `blocked` (the
  session-1 gap that let T2 sit blocked for ~10 min). Poll fallback every 60s.
- Launch: `nohup python3 scratchpad/waker-socket.py "w1D:p1=T2-backend" "w1E:p1=T3a-ui" > /tmp/banfe-waker-socket.out 2>&1 &`
  (format: `PANE=LABEL`, first hyphen-token of LABEL = filename stem).
- State files (orchestrator polls these between turns, O(1)):
  - `/tmp/banfe-<stem>-state.log` — append-only status log.
  - `/tmp/banfe-<stem>-notify.flag` — `blocked`/`done`/`idle` sets it (with ts);
    `working` clears it. **Check this first** when resuming a session.
  - `/tmp/banfe-waker-socket.pid` — daemon PID. Stop: `touch /tmp/banfe-waker.stop`.
- **`scratchpad/waker.sh`** — polling fallback (bash, no python3/socket).
- Current daemon (session 2): **PID 97693, watching only `w1D:p1=T2-backend`** (T3a
  merged, dropped). Agent-agnostic — works unchanged for the Claude worker.
- **Batch 2 COMPLETE** (session 2): T1 ✅, T2 ✅, T3a ✅ all merged. Waker stopped
  (nothing to watch until Batch 3 launches). Relaunch it per-pane when Batch 3 starts.
- Note: T2 left the local Supabase/Docker stack UP (`npm run supabase:stop` to free it).

## NEXT: Batch 5 (T5 docs+deploy) — awaiting user go (session 2)
Batches 1–4 all merged; develop tip `bc8622b`, full app integrated with green
unit/integration/E2E + CI workflow. T5 = docs + DEPLOY (proposed `claude-fable-5` low
for docs). ⚠️ **Deploy has hard USER-SIDE prerequisites (see "Infra pending" above):**
Supabase PROD project (URL+anon key, apply T2 migrations there), `supabase link`,
Vercel project + env vars. The docs half can proceed now; the deploy half is BLOCKED
on the user's accounts and is outward-facing → confirm scope with the user before
launching (docs-only now, or wait until prod infra exists). Known flagged item for T5:
reconcile SHORT_BLOCKS (const=2) vs scoring's ceil(100/40)=3 (a protocol decision).
Monitoring: harness-tracked herdr-polling waiter (post-mortem above), never the daemon.

## Batch progress

### Batch 1 — Foundation (sequential; blocks all)
| Task | Status | Worktree | Branch | Pane | PR | Notes |
|---|---|---|---|---|---|---|
| T0 | ✅ merged to develop | — | `feat/t0-foundation` (deleted after merge) | — | n/a (direct merge) | Merged 21:33 FF. 3 commits, gates green, 94.7KB gzip. |

### Batch 2 — Core layers (parallel; launched 21:37)
| Task | Status | Worktree | Branch | Pane | PR |
|---|---|---|---|---|---|
| T1 | ✅ merged to develop (21:47, 1 commit, 53 tests green) | — | `feat/t1-engine` | `w1C:p1` (ws `w1C`) | n/a |
| T2 | ✅ merged to develop (session 2, 22:41 — `869908a`, FF, 4 commits). CLAUDE takeover (Opus 4.8 high +ultracode) of GLM's WIP. Gates: typecheck+lint+build OK, 97 unit + 21 integration (RLS vs local Supabase/Docker) green; RLS empirically + adversarially verified (0 issues). Reconciled T1 canonical types; fixed vitest.integration exclude-leak bug. | — | `feat/t2-backend` | `w1D:p1` (ws `w1D`, done) | n/a |
| T3a | ✅ merged to develop (session 2, 22:24 — `203d716`, FF, 1 commit; 84 tests + typecheck + lint + build green) | — | `feat/t3a-ui-foundation` | `w1E:p1` (ws `w1E`, done) | n/a |

Wakers: T2 PID 44906 (`/tmp/banfe-t2-state.log`), T3a PID 44907 (`/tmp/banfe-t3a-state.log`). Stop all: `touch /tmp/banfe-waker.stop`.

**Batch 2 merge order**: T1 ✅ done. When T2 and T3a finish, rebase each onto latest `origin/develop` (they branched before the gitleaks + plan-fix commits) then FF-merge. T2 and T3a touch disjoint files (supabase/* + src/lib/dataAccess.ts vs src/components/ui/*), so no conflicts expected between them.

### Batch 3 — UI features (parallel; launched session 2 ~23:21 as CLAUDE workers)
| Task | Status | Worktree | Branch | Pane | Model/Effort |
|---|---|---|---|---|---|
| T3b | ✅ merged (`db57274`) | — | `feat/t3b-game-board` | `w1G:p1` (done) | `claude-fable-5` high |
| T3c | ✅ merged (`ae76ce7`) | — | `feat/t3c-results` | `w1H:p1` (done) | `claude-sonnet-5` medium |
| T3d | ✅ merged (`5859ade`) | — | `feat/t3d-auth-patient` | `w1J:p1` (done) | `claude-sonnet-5` high |
| T3e | ✅ merged (`e70a0b5`) | — | `feat/t3e-dashboard-export` | `w1K:p1` (done) | `claude-sonnet-5` medium |

**Batch 3 COMPLETE** (session 2, merged 23:5x–00:0x): all four FF-merged to develop
in order T3b → T3c → T3d → T3e. Final integrated develop tip `e70a0b5`, verified on a
clean `npm ci`: typecheck OK, **192 tests** (40 files), lint clean, build OK.
Orchestrator did every rebase itself (git-only, token-free) — workers were already
done, no need to re-launch them to rebase. Conflicts resolved:
- **i18n `{en,es}.json`** (every merge): deep-union via `scratchpad/i18n-union-merge.py`
  (reads git stages :2/:3, recursively unions, keeps populated side over empty
  placeholder, flags real leaf collisions). Reusable.
- **TS barrels** (`hooks/index.ts`, `lib/index.ts`, `dashboard/index.ts`): union both
  export lists.
- **`App.test.tsx`** (T3d vs T3e): a REAL logical conflict — T3d's ProtectedRoute
  redirects `/`→`/login` for unauthenticated users, so T3e's "renders dashboard at /"
  assertion could no longer hold. Kept T3d's redirect test, dropped T3e's contradictory
  block (dashboard still covered by its own `DashboardPage.test.tsx`).

## ⚠️ MONITORING POST-MORTEM (session 2) — detached daemon died between turns
**Symptom**: the socket waker (`waker-socket.py`, PID 49739) was launched for Batch 3,
logged `subscribed, listening for events`, then **died silently** during the idle period
between orchestrator turns — so no flags were written and the human got NO notification
even though all 4 tasks finished. (The Batch-2 T2 waker survived only because its idle
gap was short before its waiter re-woke the orchestrator.)
**Investigation** (three nohup probes this session): (a) plain bash sleeper and (b) a
probe faithfully replicating the waker (connect `$HERDR_SOCKET_PATH` + `events.subscribe`
+ recv loop) both survived fine **within an active turn** (5–8 min, stable subscription,
clean 30s recv timeouts) → the socket subscription is NOT the bug. (c) a cross-turn
heartbeat probe **survived 52 min including T4's ~48-min between-turns idle** (211 hbs).
**So the initial "reaped during idle" theory is FALSE** — detached nohup CAN survive a
long idle. **Root cause of the 49739 death is UNDETERMINED**: not the socket pattern,
not simple idle-reaping, and not a logged code error (the loop catches+logs all
exceptions, so it was an unlogged signal/one-off — plausibly a herdr-server blip during
the heavy 4-session launch window, but unconfirmed).
**FIX (adopt for every future batch)**: do NOT rely on a detached `nohup` daemon as the
wake signal. Use a **harness-tracked `run_in_background` Bash waiter that polls `herdr`
DIRECTLY** (`herdr pane get`/`wait agent-status`), NOT the daemon's flag files. That
mechanism (this session's `bqkni04fp`/`bpm47wlyy`) survived every turn boundary and
re-invoked the orchestrator reliably. Keep the socket daemon only as OPTIONAL best-effort
OS-notification gravy — never as the single point of failure. The earlier waiter's real
bug was polling daemon flag files (a dead-daemon dependency) instead of polling herdr.

### Batch 4 — Integration (after Batch 3)
| Task | Status | Worktree | Branch | Pane | PR |
|---|---|---|---|---|---|
| T4 | ✅ merged to develop (session 2, 00:53 — `bc8622b`, FF, 3 commits). CLAUDE Opus 4.8 high +ultracode. Gates: typecheck+lint+format+build OK, 196 unit + 22 integration + **6 Playwright E2E** green; adversarial multi-agent diff review (2 findings fixed). Added CI workflow + a11y specs. Robust harness-tracked waiter worked cleanly. | — | `feat/t4-integration` | `w1M:p1` (done) | — |

### Batch 5 — Ship (after Batch 4)
| Task | Status | Worktree | Branch | Pane | PR |
|---|---|---|---|---|---|
| T5 | ⬜ queued | — | `feat/t5-docs-deploy` | — | — |

## Shared-file conflict hotspots (union-merge on rebase)
`package.json` (T0 installs ALL deps), `src/routes.tsx`, `src/App.tsx`,
`src/components/ui/index.ts`, `src/i18n/locales/{es,en}.json`.

## Resume checklist (for a new session)
1. `cd /Users/juanfer/Codes/Personal/Banfe-2-cards && git fetch origin`
2. `git log --oneline origin/develop -10` — what's merged?
3. `gh pr list --base develop --json number,headRefName,mergeable,mergeStateStatus,statusCheckRollup` — open PRs.
4. `herdr workspace list` + `herdr pane list` — live panes; match to tasks above.
5. `cat /tmp/banfe-*-state.log` — waker output (if still running / files exist).
6. For any pane still `working`: `herdr pane read <pane> --source recent-unwrapped --lines 50` to see where it is.
7. Reconcile this file against ground truth, then continue the next batch.

## Session 2 — post-integration GAME REWORK (T6/T7) + cost-driven model routing
After Batch 1–4 merged, user QA surfaced that the reconstructed protocol was WRONG.
Corrected via two follow-up tasks (both merged to develop):
- **T6 game rework** (`claude-fable-5` high, `ee44a8d`): real protocol = **90 cards
  total (18/stack × 5), draw 50** (was 200/100). Added `GAME_VERSIONS` presets
  (standard 90/50 = DEFAULT; legacy extended 200 & short 100 kept) + a clinician
  version selector; **removed learning-curve blocks** (no `BLOCK_SIZE`); Results now
  shows a **cumulative net-score line** from `raw_events`; added per-stack **discard
  piles ("monte")**; removed advantage color-cues for assessment neutrality (the game
  measures risk-management / addictive behavior). `sessions.learning_curve` kept but
  written `[]` (follow-ups: persist version id; drop dead column). 212 unit + 22 int +
  6 E2E green; README §3 rewritten.
- **T7 UI/UX polish** (`opencode-go/kimi-k3` high — **OpenCode, NOT Claude**, `a1b5f1c`):
  design pass elevating board presence, cards, discard-pile readability, selector,
  results. Zero `src/lib/` changes (protocol intact); neutrality + a11y + i18n + testids
  preserved. 212 + 22 + 6 green.

**Cost-driven routing lesson**: when Claude windows tighten, route non-clinical-logic
work (esp. UI/UX polish) to the **OpenCode pool** (Kimi K3 for game UI — the reserved
centerpiece model) — a SEPARATE quota from Claude. Same herdr worktree + robust
harness-polling waiter; OpenCode auth is global (no CLAUDE_CONFIG_DIR). `opencode run
--model opencode-go/kimi-k3 --variant high --auto --dir <wt> "<prompt>"` runs autonomous
and exits to shell on finish (waiter catches agent→none). Give it exact clinical
constraints so the cheaper/other-pool model only does design, never invents numbers.

develop tip after T7: `a1b5f1c`. Remaining plan work: **T5 (docs+deploy)** still queued
(deploy blocked on user prod infra). The 90/50 game is live for QA at localhost:5173.
