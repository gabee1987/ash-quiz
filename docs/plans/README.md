# ASH Quiz implementation plans

One file per phase. Each phase is one `feature/*` branch off `develop`, implemented with the `implement-phase` skill (`/implement-phase <N>`), verified with `pnpm verify` plus the phase's own command, and handed over with a delivery report (see the `git-workflow` skill). The user runs all git commands.

| Phase | Plan | Branch | Status |
|---|---|---|---|
| 1 | Scaffold: workspace, shared schemas, server and web skeletons | `feature/scaffold` | done |
| 2 | [Game engine](phase-2-game-engine.md) | `feature/game-engine` | done |
| 3 | [Database, auth, deployment](phase-3-db-auth-deploy.md) | `feature/db-auth-deploy` | done |
| 4 | [Realtime play: sockets, player screens, minimal host control](phase-4-realtime-play.md) | `feature/realtime-play` | done |
| 5 | [Host control, projector screen, team mode, grading](phase-5-host-and-screen.md) | `feature/host-and-screen` | done |
| 6 | [Quiz editor, images, user management](phase-6-editor.md) | `feature/editor` | todo |
| 7 | [Results, history, export, retention](phase-7-results.md) | `feature/results` | todo |
| 8 | [Hardening: load test, end-to-end, release](phase-8-hardening.md) | `feature/hardening` | todo |

Order matters: each phase builds on the previous one. Phase 1 and this planning material are the first two commits on `main` and `develop`.

## Conventions every plan follows

- **Scope** is the contract. Anything not listed is out, even if adjacent.
- **Steps** are ordered; each has a check the implementer runs before moving on.
- **Done when** is the acceptance list, checked item by item.
- **Verification command** is what the user runs after pulling the branch. It always includes `pnpm verify`.
- **Manual test list** is a draft; the implementer refines it in the delivery report.
- **Deviations** heading is appended by the implementer if reality differed from the plan.

## Git setup the user does once

Local branches `main`, `develop` and `feature/game-engine` already exist. Remaining steps:

```
gh repo create ash-quiz --private --source . --push
git push -u origin main develop feature/game-engine
```

Then on GitHub: set `develop` as the default branch, protect `main` (require PR and the CI check), and open the project board with one card per phase.
