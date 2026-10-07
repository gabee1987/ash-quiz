# Phase 5: Host control, projector screen, team mode, grading

**Branch:** `feature/host-and-screen` (from `develop`)
**Commit:** `feat(host): add projector screen, polished host control, team mode and text grading`
**Skills to load:** `web-ui`, `realtime`, `game-engine`, `i18n`, `verification`, `git-workflow`

## Goal

The host experience is complete: a projector screen anyone can open, a host control that works on a phone and a laptop, a mid-game review panel, team mode end to end, and host grading of free-text answers.

## Scope

In:
- `/screen/$pin`: lobby (QR, PIN, join URL, joined names), question (text, image, options, timer, answered count), reveal (correct answer, distribution bars), scoreboard (top 10 with deltas), podium (top 3 with animation), team variants.
- `/host/games/$pin` redesigned: phase-aware primary button, player panel with connection state and kick, review panel (live standings, per-question breakdown so far, answer list for the current question), grading panel for text questions, settings summary, "open screen" link, end-game confirmation.
- Game creation dialog on `/host`: mode (classic/team), team names, speed bonus, shuffle options.
- Team mode: lobby groups by team on screen and phones, scoreboard shows team ranking with individual list under each, podium shows teams.
- Shuffle options per game (engine: shuffle once at `createGame`, store the order in the frozen quiz copy).
- Keyboard shortcuts on the screen when the browser also holds the host session (Space / Right = next).
- Images in questions and options rendered on screen and phones (upload comes in phase 6; render `imageId` via `/api/images/:id` now).

Out: the editor, results history, export.

## Files

```
apps/web/src/routes/screen.$pin.tsx
apps/web/src/features/screen/*.tsx            Lobby, Question, Reveal, Scoreboard, Podium
apps/web/src/features/host/*.tsx              Controls, PlayerPanel, ReviewPanel, GradingPanel, CreateGameDialog
apps/web/src/components/qr-code.tsx, distribution-bars.tsx
apps/web/src/routes/host/games.$pin.tsx       rewritten
apps/web/src/routes/host/index.tsx            create game dialog
apps/server/src/game/engine.ts                shuffle at createGame
apps/server/src/realtime/handlers.ts          'host:command' gets { type: 'gradeText', correctPlayerIds }
packages/shared/src/events.ts                 add gradeText command
```

## Steps

1. **Shared.** Add `{ type: 'gradeText', correctPlayerIds: string[] }` to `hostCommandSchema`. Engine already has `gradeText`; wire it in handlers with a test. Check: typecheck, `vitest run test/realtime.test.ts -t grade`.
2. **Shuffle.** `createGame` shuffles option order when `settings.shuffleOptions`, using an injectable `random` for tests. Correctness is id-based so nothing else changes. Test. Check: engine tests.
3. **Screen route.** `screen:attach`, phase switch, components sized per the `web-ui` projector rules. QR via `qrcode.react` encoding `${APP_ORIGIN}/?pin=<pin>` (origin from `GET /api/games/:pin/public`, which gains `joinUrl`). Check: manual at 1080p, read from 3 m.
4. **Distribution bars.** Pure component from `reveal.distribution` and the question; highlights correct buckets; for text and number shows top 6 buckets plus "other". Unit test the bucket shaping function. Check: `vitest run src/features/screen/buckets.test.ts`.
5. **Host control.** Rewrite per scope; works at 375 px width and at desktop width. Primary button label follows phase: Start / End question / Show scoreboard / Next question / Finish. End game asks for confirmation. Check: manual on phone and laptop.
6. **Review panel.** Standings table (rank, name, team, score, correct count) and per-question breakdown (correct %, average time) from the host snapshot. Needs `questionStats` added to `HostSnapshot` by the engine (`snapshots.ts`), with a test. Check: engine snapshot tests.
7. **Grading panel.** When `awaitingGrading`, list each player's text answer with a toggle, "Apply grading" sends `gradeText`. Check: manual.
8. **Team mode UI.** Create dialog with team names (chips), join picker already exists; lobby grouping, team scoreboard and podium on screen and phones. Check: manual with two phones in different teams.
9. **Keyboard.** Screen page checks `me` query; if logged in as the host, Space/Right sends `next`. Check: manual.
10. **i18n.** `screen.*`, `host.game.*`, `host.create.*` in both languages. Check: key-set test.
11. **Final pass.** `pnpm verify`.

## Done when

- A game can be run from a phone as host while a laptop shows `/screen/$pin` on a projector, with nothing on the laptop but the browser.
- A game can also be run with no projector: phones show everything needed.
- Team mode game from creation to podium works with 2 teams.
- Host-graded text question: answers can be marked and the scores update on all devices.
- Review panel answers "who is leading and how did question 3 go" without leaving the page.
- `pnpm verify` passes.

## Verification command

```
pnpm verify && TEST_DATABASE_URL=postgres://ashquiz:ashquiz@localhost:5432/ashquiz pnpm --filter @ash-quiz/server test
```

## Manual test list (draft)

1. Host on phone: create a team game with teams "Piros" and "Kék", shuffle on. Expect the PIN and a link "Open screen".
2. Laptop: open `/screen/<pin>` without logging in. Expect QR, PIN, join URL in large text.
3. Phone A scans the QR. Expect the join form with PIN prefilled and a team picker. Join "Piros". Phone B joins "Kék".
4. Expect the screen lobby lists both names under their teams.
5. Start. Expect the screen shows the question and options at projector size, with the answered counter rising as phones answer.
6. Reveal. Expect distribution bars on the screen with the correct option highlighted; phones show their points.
7. Scoreboard. Expect team ranking first, members under each team.
8. On the text question with no accepted answers, both answer. Expect the host control shows the grading panel; mark one correct, apply. Expect points update on that phone and the screen.
9. Open the review panel mid-game. Expect current standings and per-question correct percentages.
10. Press Space on the laptop while not logged in. Expect nothing. Log in on the laptop, press Space. Expect next.
11. Finish. Expect team podium on the screen and phones.
12. Resize the host control to phone width. Expect every control reachable without horizontal scroll.
