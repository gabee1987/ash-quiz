# Phase 18: Change answers until a deadline

**Branch:** `feature/change-answers` (from `develop`, after phase 17)
**Commit:** `Let players change their answer until a deadline`
**Skills to load:** `game-engine`, `scoring`, `realtime`, `socket-client`, `web-ui`, `game-screens`, `i18n`, `browser-checks`, `verification`, `git-workflow`

## Goal

A game setting that lets players change their answer while the question runs. The last answer counts, including its time for the speed bonus. An optional lock-in stops changes a few seconds before the end, so last-second switching after a glance at a neighbour's phone is not worth it.

## Decisions (agreed with the user)

- **Speed bonus:** a changed answer's time is the time of the change, so changing late costs speed points. Re-sending the same answer changes nothing (keeps its time), which also makes a client retry harmless.
- **Early close stays:** the question still ends as soon as every connected player has answered, as today. Changing is for games where people are still thinking.
- **Lock-in seconds:** `answerLockSec` (0 to 60, 0 = until the time is up). Changes stop that many seconds before `questionEndsAt`; a first answer is still accepted until the end. "Add time" moves the lock with the deadline.

## Scope

In:
- **Settings:** `answerChanges` (default off) and `answerLockSec` (default 0) in `gameSettingsSchema`, so they are quiz defaults and per-game overrides like every other setting. Old quizzes and saved games get the defaults on parse.
- **Engine:** `submitAnswer` replaces the player's answer when `answerChanges` is on and the lock has not started (`errors.answerLocked` after it); an identical answer is a no-op. Off: `errors.alreadyAnswered` as today.
- **Phone:** after answering, the answered view offers "Change answer" while changes are open, with the seconds left until the lock. Changing shows the question again with the current answer pre-selected (every question type) and a "Keep it" way back. The button disappears when the lock starts.
- **Settings form:** a switch in the scoring group with a lock-in seconds field under it; summaries and the host control's settings line mention it.

Out: answer history, showing changes to the host, changing after the question closes.

## Files

```
packages/shared/src/quiz.ts                          answerChanges, answerLockSec
apps/server/src/game/engine.ts (+ engine.test.ts)    replace or refuse, errors.answerLocked
apps/server/test/realtime.test.ts                    a change over the socket
apps/web/src/features/play/change-window.ts (+ test) when the phone may still change
apps/web/src/features/play/question.tsx, answered.tsx
apps/web/src/features/questions/*.tsx                initial answer
apps/web/src/features/host/game-settings-form.tsx, settings-line.ts
apps/web/src/i18n/hu.json, en.json
apps/web/e2e/play-features.e2e.ts                    change an answer in a real game
```

## Steps

1. **Settings and engine.** Tests first: a change replaces the answer and its time; identical answer keeps the time; off refuses with `alreadyAnswered`; after the lock `answerLocked`, while a first answer is still accepted; the speed points use the changed time. Check: `vitest run src/game`.
2. **Socket.** A realtime test: a player answers, changes, and the reveal scores the second answer. Check: `vitest run test/realtime.test.ts`.
3. **Phone.** `changeWindow` helper with tests (off, open, locked, paused, no deadline). Answered view and change flow; question inputs take an initial answer. Check: web tests, screenshots of answered and changing on a phone.
4. **Settings form, summaries, i18n.** Check: the editor and the new game dialog show the switch and the seconds field; typecheck.
5. **Final pass.** e2e spec for changing an answer, all e2e on the production build, `pnpm verify`, changelog, backlog.

## Done when

- With the setting on, a player can change their answer until the lock; the reveal scores the last answer with its time.
- With the setting off, nothing changes for players.
- The lock-in refuses changes but not first answers.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

## Manual test list (draft)

1. In a quiz's settings turn on "Change answers" with 0 lock seconds; start a game with two phones.
2. Answer on one phone. Expected: "Change answer" with the seconds left; tapping it shows the question with your answer selected.
3. Pick another option. Expected: back to the answered view; the reveal scores the new answer.
4. Set lock-in to 10 s. Expected: the button disappears 10 s before the end; a phone that has not answered can still answer.
5. Turn the setting off. Expected: answering works as before, no change button.

## Results

- `engine.test.ts` (4 cases): a change replaces the answer and its time and the reveal scores it; an identical answer returns the same state; the lock-in refuses a change but takes a first answer; "Add time" moves the lock.
- `realtime.test.ts`: answer, change, end the question; the reveal scores the changed answer.
- `change-window.test.ts` (4 cases): off or unanswered, seconds until the end or the lock, closed after the lock, frozen while paused.
- `e2e/change-answers.e2e.ts`: answer, open "Change answer" (previous answer selected), "Keep it", change, reveal scores the change.
- `pnpm verify` passes (server 276 tests with the test database, web 126, builds).

## Deviations

- **Lock-in as choice cards, not a free number:** "The time is up", "5 s before the end", "10 s before the end" (a different saved value is shown as an extra card). The app has no number fields in the settings, and three choices are quicker on a phone. The schema still takes any 0 to 60.
- **No server change for retries:** an identical answer is a no-op in the engine, so the client's single retry needs no answer id.
- **The last player to answer cannot change:** their answer closes the question early (the early close stays, as decided); a solo test therefore never shows the button. Tested by the user with two phones.
- **Not checked in the browser by the agent:** the session had no host login for screenshots and the e2e run; the user runs the new e2e spec and the manual tests.
