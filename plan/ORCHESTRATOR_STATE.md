# Orchestrator State — Banfe-2-cards

> **Purpose**: let any future session resume the orchestration. This is a
> backstop tracker; **always reconcile against git ground truth** before acting
> (PRs merged? branches? pane states?) — see `plan/PREAMBLE.md` and the
> herdr-orchestrator skill. Update this file at every batch boundary.

Last updated: 2026-07-21 21:18 (session 1)

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
| T5 Docs+Deploy | `opencode-go/glm-5.2` | medium |

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
| T0 | 🟡 running | `~/.herdr/worktrees/Banfe-2-cards/feat-t0-foundation` | `feat/t0-foundation` | `w19:p1` (ws `w19`) | — | opencode K2.7 Code, non-interactive. Waker PID 15074, log `/tmp/banfe-t0-state.log`. |

### Batch 2 — Core layers (parallel after T0 merges)
| Task | Status | Worktree | Branch | Pane | PR |
|---|---|---|---|---|---|
| T1 | ⬜ queued | — | `feat/t1-engine` | — | — |
| T2 | ⬜ queued | — | `feat/t2-backend` | — | — |
| T3a | ⬜ queued | — | `feat/t3a-ui-foundation` | — | — |

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
