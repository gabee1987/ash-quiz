# Phase 14: Host control: pause, timed messages, show a question again

**Branch:** `feature/host-control` (from `develop`, after phase 13 and the Quizmoo rename)
**Commit:** `Add pause, timed host messages and showing a question again`
**Skills to load:** `game-engine`, `realtime`, `web-ui`, `i18n`, `verification`, `git-workflow`

## Goal

The host can stop the clock, let a message disappear by itself, and put an earlier question back on every screen to talk it through, all without breaking the server-authoritative model: every one of these lives in the game state, survives a restart, and reaches reconnecting players. Two small bugs from the October test notes are fixed along the way.

## Scope

In:
- **Pause and resume a question.** Engine commands `pause` and `resume`, allowed only while a question runs. `pausedAt` (Unix ms or null) in `GameState` and in both snapshots. While paused, answers are refused with `errors.gamePaused`, the deadline timer is not armed, and the clock is frozen on every screen at `questionEndsAt - pausedAt`. Resuming shifts `questionStartedAt` and `questionEndsAt` by the pause length, so the time left and the speed bonus are as before the pause. Scoring uses each answer's stored `timeMs` (measured from the shifted start) instead of `at - questionStartedAt`, so answers given before a pause keep their speed. `endQuestion`, `skip`, `next` and `end` clear the pause; `+30 s` while paused adds to the frozen time. Phones and the projector show "Paused" in place of the answer buttons' interaction (buttons disabled, a card over the timer); the host gets Pause and Resume next to +30 s.
- **Host messages that clear themselves.** `announce` takes an optional `durationSec` (5 to 600). The announcement carries `expiresAt` (null for a message that stays). The GameManager arms a second per-game timer that applies the engine's `expireAnnouncement(id)`, which clears only that same message once its time has passed (a newer message is never cleared by an older timer). Restored games re-arm it. The host's message box gets a duration choice (stays, 10 s, 30 s, 1 min) and shows the time left of the current message.
- **Show an answered question again.** Engine commands `showQuestion { index }` and `closeQuestion`: between questions (reveal or scoreboard, nothing to grade, answers not held back until the end) the host puts any earlier or the current question back on the projector and phones as its reveal, read only. `reviewIndex` in `GameState`; snapshots then show phase `reveal` for that question with `reviewing: true`; phones show their own result on it, ranks do not move. `next`, `scoreboard` and `end` leave the review; `closeQuestion` returns to where the game was. The host's question list in the review panel gets a "Show again" button per question; while reviewing, the primary action is "Back to the game".
- **"Show podium" says where it went.** The projector link opens a named window (`quizmoo-screen-<pin>`), so a second click focuses the same window instead of opening another. After the podium is released the host sees "The podium is on the projector" and an "Open projector" button that brings that window up (or opens it).
- **Bug: selected answer on phones.** The coloured option's selection is an inset ring in the option's text colour plus the pressed-down look, inside the option's own space; no ring offset reaching into the neighbours.
- **Bug: double scrollbar with the quiz settings open.** Check on screen; if reproduced, let the panel grow with the page on a tall window instead of scrolling inside itself.

Out: pausing outside a question (nothing runs on a clock there), pausing the projector's results summary (already in phase 11), messages to single players, a countdown bar on the phones' banner.

## Files

```
packages/shared/src/game.ts                        pausedAt, reviewing, Announcement.expiresAt
packages/shared/src/events.ts                      pause, resume, showQuestion, closeQuestion, announce.durationSec
apps/server/src/game/types.ts                      pausedAt, reviewIndex
apps/server/src/game/engine.ts                     pause, resume, expireAnnouncement, showQuestion, closeQuestion
apps/server/src/game/host-control.test.ts          new engine tests
apps/server/src/game/snapshots.ts (+ test)         pausedAt, review view
apps/server/src/realtime/game-manager.ts           no deadline while paused, message timer
apps/server/src/realtime/handlers.ts               new commands
apps/server/test/realtime.test.ts                  timers, pause round trip
apps/web/src/components/timer.tsx                  frozen display
apps/web/src/components/option-button.tsx          selection marker
apps/web/src/features/host/*                       pause buttons, message duration, show again, podium hint
apps/web/src/features/play/question.tsx, screen/question.tsx   paused state
apps/web/src/routes/host/games.$pin.tsx, quizzes.$quizId.tsx
apps/web/src/i18n/hu.json, en.json
apps/web/e2e/host-control.e2e.ts
CHANGELOG.md, docs/plans/backlog.md, .claude/skills/game-engine, realtime
```

## Steps

1. **Shared schema** for all three features. Check: `pnpm --filter @quizmoo/shared typecheck`.
2. **Engine**: pause and resume with the shifted clock and `timeMs` scoring; expiring messages; review. Check: `vitest run src/game` (new `host-control.test.ts`, existing scoring tests unchanged).
3. **Snapshots**: `pausedAt`, `reviewing` and the review view (phase, question index, reveal, own result, no rank movement). Check: `vitest run src/game/snapshots.test.ts`.
4. **Manager and handlers**: no deadline timer while paused (and re-armed on resume), the message timer, the new commands. Check: `vitest run test/realtime.test.ts` with the test database.
5. **Web, host**: pause and resume buttons, message duration and time left, "Show again" and "Back to the game", podium hint with the named projector window. Check: `pnpm --filter @quizmoo/web typecheck`, primary-action tests.
6. **Web, phones and projector**: frozen timer, "Paused", answers disabled; the review shows as a reveal. Check: manual with a phone and the projector.
7. **Bugs**: selection marker; double scrollbar on screen. Check: screenshots.
8. **E2E** `host-control.e2e.ts`: pause, a phone cannot answer, resume, answer; a 10 s message disappears on the phone by itself; show question 1 again during the scoreboard of question 2, then back. Check: `pnpm e2e` against the production build.
9. **Docs and final pass**: changelog, backlog, skills; `pnpm verify`, database tests, e2e.

## Done when

- A paused question cannot be answered, does not end on its own, shows the same frozen time everywhere, and resumes with the time it had; a restart keeps it paused.
- Speed points of answers given before a pause are unchanged by it.
- A message with a duration disappears from every screen without the host, also after a restart; an older timer never clears a newer message.
- The host can put any revealed question back on the projector and phones and return; scores and ranks do not change.
- The host sees where the podium went and can bring the projector window up.
- The selected answer marker stays inside its option.
- `pnpm verify`, the database tests and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify; $env:TEST_DATABASE_URL="postgres://quizmoo:quizmoo@localhost:5432/quizmoo"; pnpm --filter @quizmoo/server test
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

## Manual test list (draft)

1. During a question, press Pause. Expect the clock frozen on the host, the projector and phones, "Paused" on phones, answer buttons disabled.
2. Wait 20 s, press Resume. Expect the clock to continue from the same second; answers work again.
3. Pause, restart the server, reload. Expect the game still paused; Resume works.
4. Send a message for 10 s. Expect it on phones and the projector, gone by itself after 10 s; the host's box counts down.
5. Send a 30 s message, then a new one that stays before it runs out. Expect the second one to stay.
6. After question 3, use "Show again" on question 1. Expect question 1's reveal on the projector and each phone's own result; press "Back to the game", expect question 3's scoreboard or reveal as before.
7. With "Final results on release", finish a game and press "Show podium". Expect the hint and "Open projector" bringing up the projector window.
8. On a phone, pick an option in a multiple-choice question with colourful buttons. Expect the marker inside the option, not reaching into the next one.

## Results

- `src/game/host-control.test.ts` (11 cases): pause refuses answers and resumes with the same time left; speed points of answers before a pause unchanged (and after it, timed without the pause); pause only in a running question, once, before the deadline; +30 s while paused; end, skip and end game clear the pause; `pausedAt` in snapshots; message `expiresAt` and duration limits; only the same message expires, only on time; a question shown again as its reveal with each player's own result and no rank movement; close, next, scoreboard and end leave it; refused during a question, for an unplayed question, while grading and with answers held back.
- `test/realtime.test.ts`: no deadline while paused, re-armed on resume; a restored paused question stays paused; a timed message clears on time, a newer one is never cleared by an older timer, and the timer is re-armed after a restart; socket round trip of pause (`errors.gamePaused`), resume, show again and back.
- `primary-action.test.ts`: Resume while paused, "Back to the game" while a question is shown again.
- `e2e/host-control.e2e.ts` passes against the production build, as do the other eight specs.
- Server tests with the database: 271 passed. Screens checked on a production build: paused phone, projector and host; timed message with the countdown; question 1 shown again on phone, projector and host; podium hint; selection marker.

## Deviations

- **Resume is the primary button while paused** (and Space on a host-attached projector), instead of a button next to +30 s. Pause sits next to +30 s and Skip.
- **Paused phones** keep the question visible with the answer buttons disabled and a "Paused" pill under the frozen clock, rather than a card over the timer: the players can keep reading.
- **One projector window name for every game** (`quizmoo-projector`), not one per PIN, so after "Play again" (where the projector follows by itself) the button still reaches the same window.
- **Double scrollbar**: reproduced (the page scrolled 66 px only because of the docked panel). The panel's height cap now fits from where the panel starts; the question list column had the same cap and got the same fix.
- **Added after the first review:** the time bar on the message itself (striped, draining in step everywhere through one CSS animation started part-way for late joiners, still draining with reduced motion), and the join page asking for the PIN first, with the name, avatar, team and Join appearing once the game is found. `nicknames.e2e.ts` was updated for that flow.
