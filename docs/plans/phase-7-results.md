# Phase 7: Results, history, export, retention

**Branch:** `feature/results` (from `develop`)
**Commit:** `feat(results): add game history, results summary, CSV export and retention`
**Skills to load:** `server-api`, `web-ui`, `game-engine`, `i18n`, `verification`, `git-workflow`

## Goal

After an event the host can open any past game, see the podium, per-question statistics and the per-player table, show it on the projector, and export a CSV. Old games are deleted automatically.

## Scope

In:
- Results derivation from `games.state`: `apps/server/src/game/results.ts` (pure) producing `{ podium, players[], teams[], questions[] }` with per-question correct %, average time, distribution, and per-player per-question points.
- `GET /api/games`, `GET /api/games/:pin/results`, `GET /api/games/:pin/results.csv`, `DELETE /api/games/:pin`.
- `/host/games` history list (date, quiz, mode, players, phase) with Open / Delete.
- `/host/games/$pin/results` page: podium, per-question cards with distribution bars (reuse phase 5 component), player table sortable by score and name, team table in team mode, buttons: Export CSV, Show on screen.
- `/screen/$pin` shows the results summary when the game is finished and `?summary=1` is set (podium, then per-question stats on key press or auto-cycle).
- Retention job: daily `setInterval` in the server deleting finished games older than `RESULTS_RETENTION_DAYS`; also run once at boot.
- Host control "Finish" button links to the results page at the end.

Out: PDF export, charts beyond bars, per-player answer review UI beyond the table.

## Files

```
apps/server/src/game/results.ts + results.test.ts
apps/server/src/routes/results.ts
apps/server/src/retention.ts + test
apps/server/test/results.test.ts
apps/web/src/routes/host/games.index.tsx
apps/web/src/routes/host/games.$pin.results.tsx
apps/web/src/features/results/*.tsx             Podium, QuestionStats, PlayerTable, TeamTable
apps/web/src/features/screen/Summary.tsx
```

## Steps

1. **Results derivation.** Pure function over `GameState`. Tests with a finished fixture state: correct percentages, average time ignores non-answers, team totals, CSV rows. Check: `vitest run src/game/results.test.ts`.
2. **CSV.** UTF-8 with BOM (Excel opens Hungarian characters correctly), `;` separator (Hungarian Excel default), columns: rank, name, team, total, then one column per question with points. Test the exact bytes of the first line. Check: tests.
3. **Routes.** Owner-only; results of a game still in memory read from the manager, otherwise from the DB row. Tests. Check: `vitest run test/results.test.ts`.
4. **Retention.** `deleteExpiredGames(db, days, now)` with a test; scheduled in `index.ts`. Check: tests.
5. **History page.** Query list, Open, Delete with confirmation. Check: manual.
6. **Results page.** Components per scope; sortable table without a library. Check: manual on laptop and phone.
7. **Screen summary.** `?summary=1` renders podium then question stats; Space advances when logged in as host, otherwise auto-cycles every 8 s. Check: manual.
8. **i18n.** `results.*`, `history.*`. Check: key-set test.
9. **Final pass.** `pnpm verify`.

## Done when

- A finished game's results are reachable within two taps from `/host` and look correct on a projector.
- CSV opens in Hungarian Excel with accents and columns intact.
- A game older than the retention window disappears after restart.
- `pnpm verify` passes.

## Verification command

```
pnpm verify && TEST_DATABASE_URL=postgres://ashquiz:ashquiz@localhost:5432/ashquiz pnpm --filter @ash-quiz/server test
```

## Manual test list (draft)

1. Play a short game with two phones to the end. On the host control press "Results". Expect the results page with the podium matching the game.
2. Check question 1's card: correct %, average time, distribution. Expect values consistent with what was answered.
3. Sort the player table by name then by score. Expect correct ordering.
4. Export CSV, open in Excel. Expect readable accents and one column per question.
5. Open `/host/games`. Expect the game listed with date and player count.
6. "Show on screen": the laptop opens `/screen/<pin>?summary=1`. Expect podium, then question stats cycling.
7. Delete the game from history, confirm. Expect it gone and `/host/games/<pin>/results` returns a translated not-found.
8. Set `RESULTS_RETENTION_DAYS=0`, restart the server. Expect finished games removed, running ones kept.
