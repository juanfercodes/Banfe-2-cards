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

## Model allocation (locked)
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

## Monitoring
- A **background waker** (`scratchpad/waker.sh`) polls each pane every 30s and
  writes to `/tmp/banfe-<task>-state.log`, firing a herdr notification on
  terminal status. Stop with `touch /tmp/banfe-waker.stop`. Waker PID is in
  `/tmp/banfe-<task>-waker.out`.
- Main thread does short `sleep` + `cat /tmp/...-state.log` + `herdr pane read`
  to stay responsive without blocking.

## Batch progress

### Batch 1 — Foundation (sequential; blocks all)
| Task | Status | Worktree | Branch | Pane | PR | Notes |
|---|---|---|---|---|---|---|
| T0 | ✅ merged to develop | — | `feat/t0-foundation` (deleted after merge) | — | n/a (direct merge) | Merged 21:33 FF. 3 commits, gates green, 94.7KB gzip. |

### Batch 2 — Core layers (parallel; launched 21:37)
| Task | Status | Worktree | Branch | Pane | PR |
|---|---|---|---|---|---|
| T1 | ✅ merged to develop (21:47, 1 commit, 53 tests green) | — | `feat/t1-engine` | `w1C:p1` (ws `w1C`) | n/a |
| T2 | 🟡 running | `~/.herdr/worktrees/Banfe-2-cards/feat-t2-backend` | `feat/t2-backend` | `w1D:p1` (ws `w1D`) | n/a |
| T3a | 🟡 running | `~/.herdr/worktrees/Banfe-2-cards/feat-t3a-ui-foundation` | `feat/t3a-ui-foundation` | `w1E:p1` (ws `w1E`) | n/a |

Wakers: T2 PID 44906 (`/tmp/banfe-t2-state.log`), T3a PID 44907 (`/tmp/banfe-t3a-state.log`). Stop all: `touch /tmp/banfe-waker.stop`.

**Batch 2 merge order**: T1 ✅ done. When T2 and T3a finish, rebase each onto latest `origin/develop` (they branched before the gitleaks + plan-fix commits) then FF-merge. T2 and T3a touch disjoint files (supabase/* + src/lib/dataAccess.ts vs src/components/ui/*), so no conflicts expected between them.

### Batch 3 — UI features (parallel after Batch 2 merges)
| Task | Status | Worktree | Branch | Pane | PR |
|---|---|---|---|---|---|
| T3b (K3) | ⬜ queued | — | `feat/t3b-game-board` | — | — |
| T3c | ⬜ queued | — | `feat/t3c-results` | — | — |
| T3d | ⬜ queued | — | `feat/t3d-auth-patient` | — | — |
| T3e | ⬜ queued | — | `feat/t3e-dashboard-export` | — | — |

### Batch 4 — Integration (after Batch 3)
| Task | Status | Worktree | Branch | Pane | PR |
|---|---|---|---|---|---|
| T4 | ⬜ queued | — | `feat/t4-integration` | — | — |

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
