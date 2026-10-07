# Phase 8: Hardening and release

**Branch:** `feature/hardening` (from `develop`), release merged to `main` afterwards
**Commit:** `Add load test, end-to-end suite and release checklist`
**Skills to load:** `realtime`, `verification`, `git-workflow`, `web-ui`

## Goal

Confidence that 50 phones on bad wifi do not break a game, plus a repeatable release.

## Scope

In:
- Load script `apps/server/scripts/load-test.ts`: spawns N simulated players (default 60) with `socket.io-client`, random answer delays, 20% random disconnect/reconnect per question, one host driving the game; prints per-question latency and asserts every player ends with a score and the server stays under 200 ms snapshot broadcast time.
- Playwright end-to-end in `apps/web/e2e`: login, create quiz, play a 3-question game with 3 player contexts including one reload mid-question, results page. Runs against `pnpm dev` or the Docker image.
- Soak findings fixed: anything the load test or e2e surfaces (memory growth, timer drift, duplicate broadcasts, unhandled rejections).
- Operational: `GET /api/health` reports DB reachability and active game count; structured error logging with request ids; graceful shutdown (close sockets, persist all games, close DB) on SIGTERM.
- Security pass: Helmet-style headers via `@fastify/helmet`, CSP allowing self and data: images, cookie flags verified in production, body size limits, dependency audit `pnpm audit` with no high findings or a documented exception.
- Docs: `README.md` (what it is, how to run, how to deploy, how to host an event), `docs/event-checklist.md` (one page for the host on the day: wifi, QR, projector, fallback without projector).
- Version `1.0.0` in root `package.json`, `CHANGELOG.md`.

Out: new features.

## Files

```
apps/server/scripts/load-test.ts
apps/web/e2e/*.spec.ts, apps/web/playwright.config.ts
apps/server/src/shutdown.ts
README.md, CHANGELOG.md, docs/event-checklist.md
```

## Steps

1. **Load script.** Build it, run with 60 players against the dev server, record the numbers in the plan under "Results". Fix whatever it finds before moving on. Check: script exits 0 with the assertions.
2. **Graceful shutdown and health.** Implement, test shutdown with a fake manager. Check: tests, manual `docker stop` shows a clean log.
3. **Security headers.** Add helmet with a CSP that still lets the app, sockets and `/api/images` work. Check: e2e passes, browser console shows no CSP errors.
4. **Playwright.** Install browsers, write the flow, run headless. Add `pnpm e2e` root script; CI runs it against the Docker image in a second job. Check: `pnpm e2e` passes locally.
5. **Audit.** `pnpm audit --prod`. Check: no high or critical, or exceptions listed in `docs/security-notes.md`.
6. **Docs and version.** Check: a colleague can follow `README.md` from clone to a running game.
7. **Final pass.** `pnpm verify && pnpm e2e`.

## Done when

- Load test with 60 players, 20% flapping, passes 3 runs in a row.
- End-to-end suite green locally and in CI.
- Shutdown persists games; restart restores them (verified by the load test with a restart in the middle).
- `README.md` and the event checklist exist.
- `pnpm verify && pnpm e2e` passes.

## Verification command

```
pnpm verify && pnpm e2e && pnpm --filter @ash-quiz/server exec tsx scripts/load-test.ts --players 60
```

## Manual test list (draft)

1. Run the load test with 60 players. Expect the summary with all players scored and max broadcast time under 200 ms.
2. During the load test, `docker restart` the app container. Expect the script reports reconnects and still finishes green.
3. Open the deployed URL on a phone over mobile data (not wifi). Expect join and play to work.
4. Open the app in a browser with the console visible. Expect no CSP or mixed-content errors on any page.
5. `curl /api/health`. Expect `{ ok: true, db: true, activeGames: <n> }`.
6. Follow `docs/event-checklist.md` as if on the day. Expect no step to be unclear.

## Release (user runs)

```
git checkout develop && git pull
git checkout main && git merge --no-ff develop -m "release: v1.0.0"
git tag v1.0.0 && git push origin main --tags
```

## Results

Load test, 60 players, 5 questions of 12 s, 20% of players dropping and reconnecting during each question (local machine, 2026-10-07):

| Run | Server | Answered (all questions) | Reconnects | Answer ack p95 | Fan-out max | Result |
|---|---|---|---|---|---|---|
| 1 | production build | 300/300 | 61 | 14 ms | 7 ms | pass |
| 2 | production build | 300/300 | 56 | 13 ms | 8 ms | pass |
| 3 | production build | 300/300 | 59 | 11 ms | 7 ms | pass |
| restart | production build, process killed and restarted mid-game | 300/300 | 111 | 12 ms | 9 ms | pass |
| restart | Docker image, `docker restart` mid-game | 0 missed | 110 | 64 ms | 25 ms | pass |
| final | Docker image | 0 missed | 62 | – | 14 ms | pass |

Fan-out is the time from a host command to the last connected player's snapshot. "Answered" counts answers the server recorded; a player who was disconnected while a question closed is allowed to miss it (none did).

## Deviations

- **Player cap raised from 50 to 60** (user decision), so the 60-player load test runs real players. `MAX_PLAYERS` moved to `packages/shared`; the host grading limit follows it.
- **Soak findings fixed:**
  - Shutdown cleared the games from memory before waiting for their saves, and closed the database while sockets could still send commands. Now: Socket.IO closes first, timers stop, queued saves finish, then the database closes.
  - Shutdown hung while players were connected: Fastify closes the HTTP server before its `onClose` hooks and waits for every open connection, and websockets never end on their own. Docker then killed the process after the grace period (exit 137). Socket.IO now closes in the `preClose` hook; with 60 players, shutdown takes about 0.7 s. A test with a connected client guards it.
- **Structured logging:** the game manager now logs through the app's logger (it used `console`); request logs already carry request ids.
- **End-to-end files** are `e2e/*.e2e.ts` (not `*.spec.ts`), so Vitest does not pick them up. Locally they use the installed Chrome; CI installs Playwright's Chromium (`E2E_CHANNEL=chromium`).
- **CI e2e job** builds and starts the Docker image with Compose (which now has a health check on `/api/health`), seeds a CI-only host account and runs `pnpm e2e`.
- **Root scripts:** `pnpm e2e` and `pnpm load-test`. The load test needs `LOAD_TEST_USERNAME` / `LOAD_TEST_PASSWORD`; the e2e test needs `E2E_USERNAME` / `E2E_PASSWORD`. Both create their own quiz and delete what they created.
- **Audit:** no production vulnerabilities; two development-only esbuild advisories (moderate, low) are documented exceptions in `docs/security-notes.md`.
