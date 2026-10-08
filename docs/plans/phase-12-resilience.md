# Phase 12: Connection resilience, status toasts and host messages

**Branch:** `feature/resilience` (from `develop`, after phase 9; independent of 10 and 11)
**Commit:** `Harden reconnection, add connection toasts and host messages`
**Skills to load:** `realtime`, `game-engine`, `web-ui`, `i18n`, `verification`, `git-workflow`

## Goal

A player on bad venue wifi always knows what is going on and never loses an answer they tapped; the host sees who is connected and can push a message to every phone and the projector; stale snapshots can never overwrite fresh ones. The networking stays as fast as phase 8 measured it.

## Scope

In:
- **Snapshot ordering.** Every snapshot carries `seq`, a per-game counter stamped by the GameManager at broadcast time and seeded from the boot timestamp so it stays monotonic across restarts. The client store drops any snapshot whose `seq` is lower than the one it holds (a direct emit on rejoin can race a room broadcast).
- **Connection state machine** in `lib/socket.ts`: `connecting | connected | reconnecting | offline | closed`, with `since` and `attempts`; `offline` comes from `navigator.onLine` and the `offline`/`online` events; `visibilitychange` and `online` trigger an immediate reconnect attempt. Backoff stays Socket.IO's (max 3 s). Unit tests with a fake socket.
- **Connection toasts and banner.** The thin bar stays for the not-connected states, now with the elapsed time ("Reconnecting… 12 s"). Toasts: "Reconnected" (success, short), "Answer not sent, tap again" (when an answer ack times out while the question is still open), "You were removed by the host", "The game has ended", "Session closed on another device" when applicable. Host and projector get the same connection toasts.
- **Answer delivery.** `player:answer` is retried once automatically after an ack timeout if the question is still open; `errors.alreadyAnswered` on the retry counts as success (the first attempt got through). The option stays visually "pending" until an ok or a definitive error. Server side the handler is already idempotent through the engine.
- **Host visibility.** Player panel chips show a connection dot and "offline for 12 s" on hover or tap; the header shows "connected / total"; the primary action shows a hint when more than 20% of players are disconnected before the next question ("8 players are reconnecting"), never blocking.
- **Host messages.** New engine command `announce({ text })` (1 to 200 characters) setting `announcement: { id, text, at } | null` in `GameState`; `clearAnnouncement()`; `next()` and `startGame()` also clear it. Both snapshots include `announcement`. Players see it as a banner at the top of every phase screen until it is cleared, the projector shows it as a banner, the host control has a message box with three translated presets ("Get ready", "Short break", "Last question") and free text, plus a "Clear" button. Because it lives in the state, a reconnecting player sees it too and a restart keeps it.
- **Keepalive tuning.** Explicit Socket.IO `pingInterval: 10000` and `pingTimeout: 20000` on the server (phones that sleep the radio for a few seconds are not dropped; dead sockets are detected within 30 s). Documented in the realtime skill.
- **Round-trip indicator on the host control.** Every 10 s the host socket emits `host:ping` and shows the ack time as a small badge (green under 150 ms, amber under 500 ms, red above). No server state.
- **Realtime skill corrections** found in phase 8's survey: per-player rooms, the `closed` field, background persist, the new states and `seq`.

Out: pausing a game mid-question (backlog, needs engine time shifting), host-to-single-player messages, player-to-host chat, push notifications, offline play.

## Files

```
packages/shared/src/game.ts                        seq, announcement
packages/shared/src/events.ts                      announce, clearAnnouncement, host:ping
apps/server/src/game/engine.ts + engine.test.ts    announce, clearAnnouncement, clearing on next/start
apps/server/src/game/snapshots.ts                  announcement in snapshots
apps/server/src/realtime/game-manager.ts           seq counter
apps/server/src/realtime/handlers.ts               seq on emits, host:ping
apps/server/src/app.ts                             ping options
apps/server/test/socket.test.ts                    seq ordering, announce round trip, host:ping
apps/web/src/lib/socket.ts + socket.test.ts         state machine, seq guard, answer retry
apps/web/src/lib/socket-toasts.ts                  state transitions to toasts
apps/web/src/components/connection-bar.tsx         elapsed time
apps/web/src/components/announcement-banner.tsx
apps/web/src/features/host/message-box.tsx
apps/web/src/features/host/player-panel.tsx        connection dots, offline time
apps/web/src/features/host/controls.tsx            reconnecting hint, RTT badge
apps/web/src/features/play/*.tsx, screen/*.tsx     banner mount
apps/web/e2e/connection.e2e.ts                     new spec
apps/server/scripts/load-test.ts                   asserts seq monotonic per player; sends two announcements
.claude/skills/realtime/SKILL.md, CHANGELOG.md
```

## Steps

1. **Shared schema.** `seq` on the snapshot base, `announcement`, the two commands, `host:ping`. Check: `pnpm typecheck` (server and web will fail to compile until the following steps; that is expected, finish steps 2 to 4 before the first green typecheck).
2. **Engine.** `announce`, `clearAnnouncement`, clearing on `next` and `startGame`, length validation, JSON round-trip invariant. Check: `vitest run src/game/engine.test.ts`.
3. **Manager and handlers.** `seq` stamped on every snapshot including the direct emit on join and attach; `host:ping` ack. Socket test: a player with two sockets receives strictly increasing `seq`; an announcement reaches the player, the screen and the host; a restart keeps the announcement. Check: `vitest run test/socket.test.ts`.
4. **Client store.** State machine, `seq` guard, answer retry. Tests with a fake socket: reconnect transitions, offline event, a lower `seq` ignored, retry after timeout then `alreadyAnswered` treated as ok, no retry once `questionClosed`. Check: `vitest run src/lib/socket.test.ts`.
5. **Toasts and bar.** `socket-toasts.ts` subscribes to the store and emits toasts on transitions (no toast on first connect). Check: manual with airplane mode on a phone for 5 s, then off.
6. **Host visibility and RTT.** Check: manual; disconnect a phone and watch the chip and the hint.
7. **Message box and banner.** Presets, free text, clear. Check: manual on phone, projector and after a phone reload.
8. **Keepalive.** Server options; the load test with `--flap 0.3` still passes; a phone with the screen locked for 15 s is still connected after unlocking. Check: load test, manual.
9. **E2E.** `connection.e2e.ts`: during a question call `context.setOffline(true)` on a phone, expect the bar with elapsed time; `setOffline(false)`, expect the "Reconnected" toast and the same player still listed; host sends a message, expect the banner on the phone and the projector; host clears it, expect it gone. Check: `pnpm e2e`.
10. **Load test.** Assert `seq` monotonic per player; send two announcements mid-game and assert every player saw the latest. Check: three passing runs, fan-out still under 200 ms.
11. **Docs and final pass.** Realtime skill, changelog; `pnpm verify`, e2e against Docker, load test.

## Done when

- A lower `seq` can never replace a higher one on any client; proven by a unit test and the load test.
- A tapped answer during a 3 s connection drop is recorded without the player tapping again, or the player is told to tap again; never silently lost.
- Connection changes produce exactly one toast each; the bar shows elapsed time.
- The host sees connection state per player and can send and clear a message that reaches phones, the projector and reconnecting players.
- The load test passes three times with `--flap 0.3`.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify; $env:TEST_DATABASE_URL="postgres://ashquiz:ashquiz@localhost:5432/ashquiz"; pnpm --filter @ash-quiz/server test
docker compose up -d --build --wait
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
$env:LOAD_TEST_USERNAME="admin"; $env:LOAD_TEST_PASSWORD="..."; pnpm load-test --players 60 --flap 0.3
```

## Manual test list (draft)

1. During a question, turn on airplane mode on a phone for 5 s. Expect the bar with a counting timer, then "Reconnected" and the question still answerable if time remains.
2. Tap an answer, turn on airplane mode within a second, turn it off after 3 s. Expect the answer recorded on the host (or a "tap again" toast if the retry also failed), never a silent loss.
3. Lock a phone for 15 s during the lobby. Expect it still connected after unlocking, with no reconnect toast.
4. On the host, send "Short break". Expect the banner on every phone and the projector; reload a phone, expect the banner still there; press Clear, expect it gone everywhere.
5. Kick a player. Expect the toast on their phone and the join page offered.
6. Disconnect two phones and watch the host panel. Expect grey dots, the offline time, and the hint next to the primary action.
7. Run the load test with `--flap 0.3`. Expect `PASS` and the `seq` assertion reported.
8. Watch the RTT badge on the host control on venue wifi. Expect a value under 150 ms on a LAN.

## Results

- `engine.test.ts`: host messages (set, trim, length, clear, cleared by start and next, old games without the field), `disconnectedAt` stamped and cleared.
- `test/realtime.test.ts`: `seq` raised per transition and still higher after a restart that keeps the message; two sockets of one player get strictly increasing `seq`; a message reaches host, projector and phone, survives a rejoin, is cleared; `host:ping` acks the host only; the host sees `disconnectedAt`.
- `src/lib/socket.test.ts` (fake socket): every state transition, `since` and `attempts`, offline and online events, visibility, kick; lower `seq` ignored; emits held until the rejoin; answer retry, `alreadyAnswered` on the retry, "tap again", no retry once closed; one "Reconnected" toast per recovery and none on the first connect. `primary-action.test.ts`: the reconnecting hint.
- `e2e/connection.e2e.ts` passes against the production build.
- Real drop, checked with a script: the server was stopped mid-question, a phone tapped an answer while it was down, the server came back. The answer was recorded without a second tap, the phone showed "Reconnected", and the host could end the game.
- Load test, 60 players with `--flap 0.3`, three runs against the production bundle: PASS each time. Both messages reached all 60 players, `seq` never went back, fan-out max 8 ms, 0 answers missed.

## Deviations

- **`disconnectedAt` on players.** "Offline for 12 s" needs the time of the drop. The engine stamps it in `disconnectPlayer` (now taking `now`), and restore stamps it for players who were connected. Snapshots carry it.
- **Every emit in a session waits for the rejoin, not only answers.** The real-drop check found that a host button pressed while the host page was reconnecting reached the server before the re-attach and was rejected as unauthorized (older than this phase). `emitAck` now holds non-attach events until a snapshot arrives on the new connection (up to 5 s).
- **No toasts for kicked, game ended or session closed.** Those states already replace the page with the reason and a way back, so a toast would say the same thing twice. "Session closed on another device" never happens: two devices with the same token are allowed.
- **`idle` stays a status** for pages without a game session, next to the five planned ones.
- **Keepalive** (`pingInterval` 10 s, `pingTimeout` 20 s) was already set in phase 8; this phase documents it in the realtime skill.
- The socket tests live in `test/realtime.test.ts`; the plan named `socket.test.ts`.
