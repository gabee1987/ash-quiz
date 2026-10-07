# Phase 2: Game engine

**Branch:** `feature/game-engine` (from `develop`)
**Commit:** `feat(engine): add pure game state machine with scoring and snapshots`
**Skills to load:** `game-engine`, `verification`, `git-workflow`

## Goal

A pure, fully tested game state machine in `apps/server/src/game` that every later phase drives. No sockets, no database, no timers: inputs in, new state out.

## Scope

In:
- `GameState`, `Player`, `Team` types and `EngineError`.
- All commands from the `game-engine` skill command table.
- Scoring for all six question types, speed bonus, team averaging, dense ranking.
- `toHostSnapshot`, `toPlayerSnapshot`, `toPublicQuestion`.
- Text normaliser.
- A fixture quiz for tests.

Out: anything that touches I/O, PIN generation (phase 4), persistence (phase 4).

## Files

```
apps/server/src/game/types.ts          GameState, Player, Team, EngineError
apps/server/src/game/normalise.ts      text normaliser + unit tests in normalise.test.ts
apps/server/src/game/scoring.ts        isCorrect(question, answer), pointsFor(...), rank(...)
apps/server/src/game/engine.ts         createGame + all commands
apps/server/src/game/snapshots.ts      toHostSnapshot, toPlayerSnapshot, toPublicQuestion
apps/server/src/game/index.ts          re-exports
apps/server/src/game/fixtures.ts       fixtureQuiz(): one question of each type, deterministic ids
apps/server/src/game/engine.test.ts
apps/server/src/game/scoring.test.ts
apps/server/src/game/snapshots.test.ts
```

Shared package changes: add `errors.*` codes nowhere (they are plain strings), but add `'screen:attach'` to `ClientToServerEvents` now so phase 4 does not need a schema change:

```ts
'screen:attach': (data: { pin: string }, ack: (res: { ok: true } | ErrorPayload) => void) => void
```

## Steps

1. **Types and error.** Write `types.ts` per the skill. `EngineError extends Error` with `code: string`. Check: `pnpm --filter @ash-quiz/server typecheck`.
2. **Normaliser.** `normalise('  Győr  ')` is `'gyor'`, `'A   b'` is `'a b'`. Table-driven test with 8 cases including empty string, mixed case, ß, and multiple spaces. Check: `vitest run src/game/normalise.test.ts`.
3. **Scoring.** `isCorrect` for each type (returns `boolean | null`, null for poll and ungraded text), `pointsFor(question, correct, t, T, speedBonus)`, `denseRank(items)`. Tests: every row of the skill's correctness table, boundary `t = 0`, `t = T`, `t > T` clamps, tolerance inclusive, speed bonus off gives `P`. Check: `vitest run src/game/scoring.test.ts`.
4. **createGame and lobby commands.** `createGame`, `joinPlayer`, `reconnectPlayer`, `disconnectPlayer`, `kickPlayer`. Tests: name uniqueness is case-insensitive and trimmed, 51st player rejected with `errors.gameFull`, team mode requires a known team, classic mode ignores `teamId`, join after start rejected unless token matches. Check: run the test file.
5. **Question flow.** `startGame`, `submitAnswer`, `endQuestion`, `next`, `skipQuestion`, `extendTime`, `endGame`. Tests: full happy path through the fixture quiz ending in `finished`; answer after deadline rejected; second answer rejected; wrong answer type rejected; `next` in `question` phase throws `errors.invalidTransition`; `skipQuestion` awards nothing and lands on scoreboard; `extendTime` moves `questionEndsAt` and keeps the phase; `endGame` works from every phase. Check: run the test file.
6. **Host grading.** Text question with empty `acceptedAnswers`: `endQuestion` sets `awaitingGrading`, points stay 0 and `correct: null`; `gradeText(ids)` scores the listed players with speed bonus based on their original answer time, clears the flag; `next` throws while `awaitingGrading`. Check: tests.
7. **Teams.** Team score after a question is the rounded mean over current members including non-answerers at 0. Kicked member's past points stop counting from the next question only (team score is cumulative, never recomputed). Tests with a 3-member team where one does not answer. Check: tests.
8. **Ranks and snapshots.** Dense ranking with ties; `toPublicQuestion` strips `correctOptionId`, `correctOptionIds`, `correct`, `acceptedAnswers`, `tolerance` (assert with `expect(obj).not.toHaveProperty`); player snapshot has `me`, `myAnswer`, `lastPoints`; host snapshot never contains `token`; `distribution` keys per the skill. Check: `vitest run src/game/snapshots.test.ts`.
9. **Serialisation invariant.** In `engine.test.ts`, after every command in the happy path assert `JSON.parse(JSON.stringify(state))` deep-equals `state`. Check: tests.
10. **Final pass.** `pnpm verify`.

## Done when

- All commands in the skill table exist with the documented behaviour and error codes.
- `engine.test.ts`, `scoring.test.ts`, `snapshots.test.ts`, `normalise.test.ts` pass; at least 40 test cases in total.
- No import from `node:` modules, `drizzle`, `socket.io` or `Date` inside `src/game`.
- `pnpm verify` passes.

## Verification command

```
pnpm verify && pnpm --filter @ash-quiz/server exec vitest run src/game
```

## Manual test list (draft)

Engine-only phase, nothing to click. The delivery report lists the test counts per file and shows the `vitest` summary line.

## Deviations

- `PublicQuestion` in `packages/shared/src/game.ts` now uses a distributive `Omit`. Plain `Omit` over the `Question` union kept only the keys shared by all members, so `options` was missing from the public type.
- Added the error code `errors.playerNotFound` (unknown player id or token in `reconnectPlayer`, `kickPlayer`, `submitAnswer`, `toPlayerSnapshot`). `disconnectPlayer` ignores unknown ids, because a kicked player's socket can still disconnect afterwards.
- `errors.notYourTurn` from the skill's list is not used by any command.
- `endGame` on an already finished game returns the state unchanged, so `finishedAt` keeps its first value.
- Team ids are deterministic (`team-1`, `team-2`, ...) in the order of `settings.teamNames`, since the engine takes no random input.
- `settings.shuffleOptions` is not applied by the engine: shuffling needs randomness and is left to the realtime layer (phase 4/5).
- Added hu/en translations for the engine error codes that had none yet (`questionClosed`, `alreadyAnswered`, `invalidAnswer`, `unknownTeam`, `invalidTransition`, `playerNotFound`).
