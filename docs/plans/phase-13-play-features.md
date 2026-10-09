# Phase 13: Play features

**Branch:** `feature/play-features` (from `develop`, after phase 12)
**Commit:** `Add streak bonus, ordering questions, avatars, nickname help and play again`
**Skills to load:** `game-engine`, `realtime`, `server-api`, `web-ui`, `i18n`, `verification`, `git-workflow`

## Goal

The game gets noticeably richer for players without new infrastructure: a reward for answering well in a row, a new question type, a face next to every name, help with picking a name (and protection from rude ones), and a second round with the same people in two taps.

## Scope

In:
- **Streak bonus.** New game setting `streakBonus` (default off, on the create-game dialog and in the quiz's settings).
  - Each correct answer after the first in a row adds 100 points, up to +500 (`min(streak - 1, 5) * 100`).
  - A wrong or missing answer resets the streak to 0. Polls, skipped questions and text answers still waiting for grading leave it unchanged; grading then extends or resets it.
  - The bonus is part of the answer's points, so team averages, the results and the CSV include it. It is also stored separately on the answer record for display.
  - Phones show "3 in a row, +200" on the reveal; the host's standings show the current streak.
- **Ordering question ("Put in order").** New type `order`: 2 to 6 options, and the order in the editor is the correct order.
  - Phones and the projector show the options shuffled. The shuffle is deterministic per question (seeded by its id), never equal to the correct order, and the same for everyone and on every reconnect.
  - The answer is `{ type: 'order', optionIds }` and must be a permutation of the options. It counts as correct only when the whole order is right, as with multiple choice.
  - Phones sort the items by dragging (reusing the phase 11 drag and drop), with move-up and move-down buttons, then press Send.
  - The reveal shows the correct order and, per item, how many players put it in the right place.
  - The editor adds a type card. The options keep their drag handles, have no correct toggle, and come with a hint that players see them shuffled.
  - Results, the CSV and the review show the player's order as "B, A, C".
- **Avatars.** A fixed set of 24 animal emoji (`avatars` in shared).
  - Chosen on the join page from a grid, with a random one preselected; the choice is stored per pin with the name.
  - Validated by the server and stored on the player (`avatar`). Games saved before this get a deterministic one from the player id.
  - Shown next to the name in the lobby (phone and projector), the scoreboard, the podium, the host's player panel and the results tables.
- **Nickname help.**
  - **Generator:** a "Surprise me" button on the join page makes a two-word name (adjective + animal) in the page language, within 24 characters. It is client-side and does not depend on the avatar.
  - **Filter:** the server rejects names containing words from a short Hungarian and English list (normalised: lower case, accents and repeated letters removed, common digit look-alikes mapped) with `errors.nameNotAllowed`. Matching is whole words or word starts, to avoid false hits inside harmless words.
- **Play again.** After a finished game the host presses "Play again".
  - `POST /api/games/:gameId/again` creates a new lobby from the finished game's quiz and settings (owner only; the original game must be finished).
  - It stores `nextPin` on the old game (in the state and both snapshots) and returns the new pin.
  - The host control opens the new game, and the projector of the old game switches to the new lobby by itself.
  - Phones of the old game show "Join the next round". It joins the new game with the stored name and avatar (a fresh player there), with no typing.

Out: partial credit for ordering questions, streak bonus amounts set per game, custom avatar uploads, a profanity list for languages other than Hungarian and English, carrying scores over between rounds.

## Files

```
packages/shared/src/quiz.ts                       order question, streakBonus setting
packages/shared/src/game.ts                       order answer, avatars, avatar/streak on PlayerPublic, nextPin, streak on reveal
packages/shared/src/events.ts                     avatar on join
apps/server/src/game/scoring.ts + test            order correctness, streak bonus
apps/server/src/game/engine.ts + test             streak, avatar, setNextGame
apps/server/src/game/snapshots.ts + test          shuffled public order, distribution per item, avatar, streak, nextPin
apps/server/src/game/order.ts + test              deterministic shuffle
apps/server/src/game/names.ts + test              nickname filter
apps/server/src/realtime/handlers.ts              avatar, name filter
apps/server/src/routes/games.ts + test/games.test.ts   play again
apps/server/src/routes/results.ts                 avatar, order answers in CSV
apps/web/src/lib/avatars.ts, lib/nicknames.ts + tests
apps/web/src/routes/index.tsx                     avatar picker, Surprise me
apps/web/src/features/questions/order-answer.tsx  phone input
apps/web/src/features/questions/*                 format, correct answer, input switch
apps/web/src/features/editor/*                    order type
apps/web/src/features/play/*, screen/*, host/*    avatars, streak, next round, projector switch
apps/web/e2e/play-features.e2e.ts                 new spec
apps/server/scripts/load-test.ts                  unchanged (single choice only)
.claude/skills/game-engine/SKILL.md, CHANGELOG.md, i18n
```

## Steps

1. **Shared schemas.** Order question and answer, `streakBonus`, avatars, `avatar` on join and on players, `nextPin`. Check: `pnpm typecheck` (red until step 3).
2. **Engine.** Order correctness, streak and bonus (endQuestion and gradeText), avatar on join, `setNextGame`, the deterministic shuffle, snapshots. Check: `vitest run src/game`.
3. **Server.** Name filter in `player:join`, avatar validation, the play-again route, results and CSV. Check: `vitest run` with the test database.
4. **Editor.** Order type card, options without the correct toggle, validation, phone preview. Check: the editor and validate tests; manual.
5. **Phones and projector.** Order input, order reveal, streak line, avatars everywhere, the next-round button, the projector switch. Check: manual on a phone and the projector.
6. **Join page.** Avatar picker, Surprise me, the filter error. Check: manual; nickname tests.
7. **Host.** Play again, avatars and streaks in the panels. Check: manual.
8. **E2E.** `play-features.e2e.ts`:
   - A quiz with an ordering question; two phones join with avatars, one with a generated name.
   - A rude name is rejected.
   - Streaks show on the reveal; the ordering answer is scored.
   - Play again moves both phones and the projector to the new lobby.
   Check: `pnpm e2e`.
9. **Docs and final pass.** Engine skill, changelog; `pnpm verify`, server tests with the database, e2e.

## Done when

- An ordering question can be created, played on a phone by dragging or with the buttons, scored all or nothing, and revealed with per-item placement counts; the public question never shows the correct order.
- With the streak bonus on, three correct answers in a row give +100 and +200 on the second and third; a wrong answer resets; polls do not.
- Every player has an avatar in every place their name appears.
- "Surprise me" fills a valid name; a listed word is rejected with a translated error.
- Play again creates a new lobby with the same settings; phones join it with one tap and the projector switches by itself.
- `pnpm verify`, the server tests with the database and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify; $env:TEST_DATABASE_URL="postgres://ashquiz:ashquiz@localhost:5432/ashquiz"; pnpm --filter @ash-quiz/server test
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

## Manual test list (draft)

1. In the editor, add a "Put in order" question with four items. Expect drag handles and no correct toggle, plus the hint that players see them shuffled.
2. Play it on a phone. Expect the items shuffled; reorder by dragging and with the arrow buttons, send, and expect the reveal with the correct order and the per-item counts.
3. Turn on the streak bonus and answer three questions right. Expect "+100", then "+200" on the reveal, and the streak in the host's standings.
4. On the join page, press "Surprise me" a few times and pick an avatar. Expect it next to the name in the lobby, on the projector and on the host.
5. Try a rude name. Expect the translated error.
6. Finish a game and press "Play again". Expect the host in the new lobby, the projector showing the new PIN, and "Join the next round" on the phones joining with one tap.

## Results

- `play-features.test.ts` (engine, 33 cases):
  - Streaks: +100, +200, a reset and back to +0; the +500 cap; missing answers, polls and skips; host grading; off by default; the bonus on the reveal and hidden while results wait.
  - Ordering: exact-order scoring, permutation checks, the stable shuffle that never shows the answer, per-item placement counts.
  - Avatars: picked, kept on a rejoin, and the fallback for old games.
  - The name filter: blocked words and disguises, plus harmless names such as "Dick Turpin", "Pina", "Nazim", "Szarvas Péter" and "Segítő Sára".
  - `setNextGame`.
- Server tests with the database: 245 of 245, including the play-again route (owner only, finished only, a second press returns the same round) and a join over the socket with an avatar, an unknown avatar and a blocked name.
- Web: `nicknames.test.ts` (every generated name is valid in both languages, and the avatar matches the animal).
- `e2e/play-features.e2e.ts` passes against the production build, as do the other five specs (6 of 6). The new spec passed four runs in a row.
- Screenshots checked: the editor with the ordering question and its preview; the join page with "Surprise me" and the avatar grid; the lobby avatar; the streak pill; the phone and projector ordering question and reveal; the host's finished screen with "Play again"; the next-round card.

## Deviations

- **"Surprise me" also picks the matching avatar** ("Happy Fox" with 🦊). The plan kept them independent; picking another avatar afterwards still works.
- **Ordering items have no images.** The editor hides the per-item image field for this type: the phone's sortable list has no room for pictures.
- **Ordering items have no answer colours or symbols** on the phone, the projector or in the reveal bars. Phones only know the shuffled order, so a colour per position would mean nothing; items show their position number instead.
- **The editor's phone preview shows the items in the correct order** (the editor's order), not shuffled: it is the host's view of what they typed.
- **Fixed two flaky checks in `editor.e2e.ts`** that predate this phase:
  - Its URL patterns did not allow "-" in quiz ids (nanoid uses it), so they failed whenever a new id contained one.
  - Its keyboard drag sometimes lost an arrow press right after the pick-up; it now presses until the item is announced at the top.
  After both fixes the spec passed 10 runs in a row.
- **Added during testing, on request (not in the plan):**
  - "Delete quiz" at the bottom of the editor's quiz settings.
  - Selection on the quiz list, with batch delete (`POST /api/quizzes/batch-delete`) and batch edit (`PATCH /api/quizzes/batch`) of the look, scoring, game flow, or every question's time limit and points.
  - Both routes are all or nothing: if a quiz is missing or someone else's, nothing changes (404); if a merged quiz is invalid, nothing changes (400).
  - Covered by three route tests in `test/quizzes.test.ts` and `e2e/quiz-management.e2e.ts`.
- **Second round of test feedback, on request (not in the plan):**
  - Host control shows the running question live: `HostSnapshot.live` (host room only, question phase) is the reveal count of the answers so far with the full question; rendered with the reveal bars, the correct answer and the players still missing.
  - Ordering items drag from anywhere on the item with no press and hold (`useInstantSortableSensors`, items `touch-none`); the entrance pop plays once, so a drop no longer looks like a reload.
  - Avatars: 60 emoji in four groups (`avatarGroups`); the picker is collapsed behind the chosen one.
  - "Surprise me" no longer generates adjective + animal on the phone (the planned generator and its "matching avatar" deviation are gone). It asks `GET /api/games/:pin/nickname?lang=` for a whole name from the admins' list (`nickname_lists` table, migration 0003, built-in lists until edited) that nobody in the game has; the avatar is random. Admins edit the lists on the new Names page (`GET/PUT/DELETE /api/nicknames[/:language]`); every name must pass the name filter.
  - Join page: an OK button under the PIN closes the keyboard and scrolls to the name.
- `errors.gameNotFinished` now reads "End the game first." (it is used by "Play again" too, not only by deleting).
