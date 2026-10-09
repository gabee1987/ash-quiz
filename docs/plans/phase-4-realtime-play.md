# Phase 4: Realtime play

**Branch:** `feature/realtime-play` (from `develop`)
**Commit:** `feat(realtime): add socket game sessions with player screens and host controls`
**Skills to load:** `realtime`, `game-engine`, `server-api`, `web-ui`, `i18n`, `verification`, `git-workflow`

## Goal

A complete game can be played end to end: host creates a game from a quiz, players join by PIN on their phones, every question type can be answered, reveal and scoreboard show, the podium ends it. Reconnection works. The host control is functional but plain; the projector view comes in phase 5.

## Scope

In:
- `GameManager` with timers, persistence to `games`, restore on boot.
- Socket handlers: `player:join`, `player:answer`, `host:attach`, `host:command`, `screen:attach` (attach only; the screen UI is phase 5), disconnect handling, per-socket rate limit.
- `POST /api/games` (create lobby, returns pin), `GET /api/games/:pin` (host metadata).
- PIN generation: 6 digits, unique among games in memory, not starting with 0.
- Web socket store and `useGame` hook.
- `/` join page wired up: PIN + name, team picker when the game is in team mode (fetch `GET /api/games/:pin/public` returning `{ mode, teams, phase }`), stores token, navigates to `/play/$pin`.
- `/play/$pin`: all phases and all six question types in answer mode, reconnect banner, auto-rejoin from stored token.
- `/host` quiz list gets a "Play" button that creates a game and navigates to `/host/games/$pin`.
- `/host/games/$pin` minimal: PIN, join URL, player list with connection dots, current phase, buttons Start / End question / Next / Skip / +30 s / End game, and a kick button per player. Enough to run a game; design polish is phase 5.
- Realtime integration tests.

Out: projector screen, host grading UI, team mode UI beyond the join picker, results page.

## Files

```
apps/server/src/realtime/game-manager.ts
apps/server/src/realtime/pin.ts
apps/server/src/realtime/persist.ts            save(state), loadActive()
apps/server/src/realtime/handlers.ts           registerSocketHandlers(io, deps)
apps/server/src/realtime/rate-limit.ts
apps/server/src/routes/games.ts
apps/server/test/realtime.test.ts
apps/server/test/games.test.ts
apps/web/src/lib/socket.ts                     socket instance + store
apps/web/src/lib/player-storage.ts             token per pin
apps/web/src/lib/clock.ts                      offset + useCountdown, clock.test.ts
apps/web/src/features/questions/*.tsx          SingleChoice, MultipleChoice, TrueFalse, Text, Number, Poll (mode: answer | display)
apps/web/src/features/play/*.tsx               Lobby, Question, Answered, Reveal, Scoreboard, Podium
apps/web/src/routes/play.$pin.tsx
apps/web/src/routes/host/games.$pin.tsx
apps/web/src/components/*.tsx                  Button, OptionButton, Timer, Spinner, ConnectionBar
```

## Steps

1. **Shared events.** Confirm `screen:attach` exists (phase 2). Add `GET /api/games/:pin/public` response type to shared as `gamePublicInfoSchema`. Check: typecheck.
2. **Persistence.** `save(state)` upserts `games` (`state`, `phase`, `finished_at`); `loadActive()` per the `realtime` skill. Test with the test DB. Check: `vitest run test/realtime.test.ts -t persist`.
3. **GameManager.** `create`, `get`, `apply`, timers, restore, finished-game eviction after 1 hour. Use injectable `now()` and `setTimeout` for tests. Tests: timer fires `endQuestion` at `questionEndsAt`; `extendTime` re-arms; restore re-arms and fires immediately for a passed deadline; eviction. Check: tests.
4. **Socket handlers.** Per the `realtime` skill. Snapshot in the join/attach ack. Tests with `socket.io-client` against `app.server.listen(0)`: join returns token and lobby snapshot; second join with the token after disconnect reclaims the player with its score; name clash gets `errors.nameTaken`; answer after `endQuestion` gets `errors.questionClosed`; host command from a socket without session gets `errors.unauthorized`; all players answering triggers reveal without waiting for the timer; 11 events in a second disconnects the socket. Check: `vitest run test/realtime.test.ts`.
5. **Games routes.** Create (session, owns quiz), get host metadata, get public info (no auth, only `mode`, `teams`, `phase`, `quizTitle`). Tests. Check: `vitest run test/games.test.ts`.
6. **Web socket store and clock.** `socket.ts` store, `clock.ts` with `useCountdown(endsAt)` driven by `requestAnimationFrame`. Test the offset maths and that the countdown never goes below 0. Check: `vitest run src/lib/clock.test.ts`.
7. **Join page.** Submit joins via socket, stores `{ token, name }`, navigates. Team picker from public info when `mode === 'team'`. Errors translated under the form. Check: manual.
8. **Question components.** Six components with `mode` prop, shared `OptionButton` with fixed colour/shape per index. Multiple choice has a confirm button; text and number have a submit button; single, true/false and poll submit on tap. Check: manual on a phone.
9. **Play route.** Phase switch, auto-rejoin on mount from stored token, connection bar, `lastPoints` toast in reveal, personal rank in scoreboard, podium at the end. Check: manual with two phones.
10. **Host control.** Minimal page per scope. "Play" button on `/host`. Check: manual.
11. **i18n.** All new keys in both dictionaries (`play.*`, `host.game.*`, `errors.*`). Check: `i18n.test.ts` equal key sets (add this test now if phase 3 did not).
12. **Final pass.** `pnpm verify`.

## Done when

- A full game with the fixture quiz can be played from lobby to podium with two phones and the host on a laptop, over the dev servers.
- Killing the server mid-question and restarting it: players reconnect automatically within 5 s, the question is scored at its original deadline or immediately if passed, scores are intact.
- Locking a phone for 30 s and unlocking it shows the current phase without any tap.
- Realtime tests cover every bullet in step 4.
- `pnpm verify` passes.

## Verification command

```
pnpm verify && TEST_DATABASE_URL=postgres://quizmoo:quizmoo@localhost:5432/quizmoo pnpm --filter @quizmoo/server exec vitest run test/realtime.test.ts test/games.test.ts
```

## Manual test list (draft)

1. Host: log in on the laptop, press Play on the sample quiz. Expect a 6-digit PIN and an empty player list.
2. Phone A: open the join URL, enter PIN and "Anna". Expect the lobby with "Anna" and the laptop list shows Anna with a green dot.
3. Phone B: join as "anna". Expect `errors.nameTaken` translated. Join as "Bence".
4. Host: Start. Expect both phones show question 1 with the timer running in sync with the laptop within 1 s.
5. Both phones answer. Expect reveal appears immediately on all three screens without waiting for the timer, with points on each phone.
6. Host: Next twice. Expect scoreboard then question 2. Walk through all six types; text and number need a keyboard, multiple choice needs confirm.
7. On question 3, turn on airplane mode on phone A for 10 s, then off. Expect the red connection bar, then the current phase restored with no tap. Score unchanged.
8. Kill `pnpm dev` server process during a question, restart. Expect both phones reconnect and the game continues from the same question.
9. Host: +30 s on a question. Expect timers on phones extend.
10. Host: Kick Bence. Expect Bence's phone shows a translated "removed" message and the lobby/join form.
11. Finish the quiz. Expect podium on phones with the final rank and the laptop shows top 3.
12. Close and reopen phone A's browser after the game. Expect the podium again, not the join form.

## Deviations

- `PlayerSnapshot` gained `lastCorrect: boolean | null` so the phone can show correct / wrong without guessing from points (a correct answer can score 0 on a 0-point question).
- Shared `GameHostInfo` type for `GET /api/games/:pin` (`pin`, `quizTitle`, `mode`, `phase`, `joinUrl` built from `APP_ORIGIN`).
- `POST /api/games` rejects team mode without team names (`400 errors.invalidInput`); there is no team setup UI yet, so the Play button always creates a classic game.
- After joining or attaching, the socket receives a snapshot of the state at that moment, not the state from before the handler's awaits. The end-to-end run found that a host attaching while players joined otherwise missed them.
- Answers to the host-graded text flow and team mode UI beyond the join picker remain phase 5, as planned.
- New error key `errors.kicked` (sent with `game:closed`).
- `socket.io-client` added as a server dev dependency for the realtime tests.
- Fixed after browser testing: `emitAck` lost its `this` binding (host page and join stuck), the join page crashed on QR links because the router parses `?pin=123456` as a number, and the per-socket rate limit no longer applies to an attached (authenticated) host socket. Each has a regression test (`socket.test.ts`, realtime host rate-limit test); the QR case is covered by the schema coercion in `routes/index.tsx`.
- Added `pnpm dev:lan` (`scripts/dev-lan.mjs`) for phone testing on the local network.
