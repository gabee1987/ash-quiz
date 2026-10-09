---
name: game-engine
description: Rules for the pure Quizmoo game engine in apps/server/src/game: state shape, phase transitions, scoring formulas for every question type, team scoring, error codes. Load when touching the engine, scoring, snapshots or anything that interprets answers.
---

# Game engine

The engine is a set of pure functions over a `GameState` value. No I/O, no timers, no `Date.now()`: the caller passes `now` (unix ms). Side effects live in `apps/server/src/realtime`.

## State

```ts
interface GameState {
  id: string
  pin: string                       // 6 digits, unique among active games
  quiz: Quiz                        // frozen copy taken when the game was created
  settings: GameSettings
  phase: GamePhase                  // 'lobby' | 'question' | 'reveal' | 'scoreboard' | 'finished'
  questionIndex: number             // -1 in lobby
  players: Record<string, Player>
  teams: Record<string, Team>       // empty in classic mode
  questionStartedAt: number | null
  questionEndsAt: number | null
  awaitingGrading: boolean          // text question with no acceptedAnswers, host must grade
  createdAt: number
  finishedAt: number | null
}
interface Player {
  id: string; name: string; teamId: string | null
  token: string                     // secret, never in snapshots
  connected: boolean
  score: number
  answers: Record<string /* questionId */, { answer: Answer; at: number; points: number; correct: boolean | null }>
}
interface Team { id: string; name: string; score: number }
```

`GameState` must be JSON-serialisable as is: it is persisted to Postgres on every transition and restored on boot.

## Commands

Each command is `(state, input, now) => GameState` and returns a new object (no mutation). Invalid commands throw `EngineError` whose `code` is an i18n key (`errors.gameNotFound`, `errors.gameAlreadyStarted`, `errors.nameTaken`, `errors.gameFull`, `errors.notYourTurn`, `errors.questionClosed`, `errors.alreadyAnswered`, `errors.invalidAnswer`, `errors.unknownTeam`, `errors.invalidTransition`).

| Command | Allowed in | Effect |
|---|---|---|
| `createGame(quiz, settings, pin, id, now)` | - | lobby state, teams created from `settings.teamNames` in team mode |
| `joinPlayer({ id, name, teamId, token, avatar })` | lobby only (reconnect allowed any time via token) | adds player; name unique case-insensitively and allowed by `isNameAllowed` (`names.ts`, else `errors.nameNotAllowed`), max 60 players (`MAX_PLAYERS` in `packages/shared`); team mode requires a known `teamId`; `avatar` from `avatars`, else `fallbackAvatar(id)`; a token rejoin keeps the stored name and avatar |
| `setNextGame(pin)` | finished | "Play again": `nextPin` points phones and the projector to the next round |
| `reconnectPlayer(token)` / `disconnectPlayer(playerId, now)` | any | flips `connected`; disconnect stamps `disconnectedAt`, reconnect clears it |
| `announce({ id, text }, now)` / `clearAnnouncement()` | any | sets or clears `announcement: { id, text, at }` (1 to 200 characters, trimmed); `startGame` and `next` clear it too |
| `kickPlayer(playerId)` | any except finished | removes player, recomputes nothing (their past points stay out of team totals from then on) |
| `startGame()` | lobby, at least 1 player, at least 1 question | goes to question 0 |
| `submitAnswer(playerId, questionId, answer)` | question, before `questionEndsAt`, once per player per question | records answer, answer type must match question type |
| `endQuestion()` | question | scores all answers, goes to reveal; sets `awaitingGrading` for host-graded text |
| `gradeText(correctPlayerIds)` | reveal with `awaitingGrading` | marks listed answers correct, scores them, clears flag |
| `next()` | reveal -> scoreboard; scoreboard -> question (index+1) or finished | |
| `skipQuestion()` | question | discards answers of the current question, goes to scoreboard |
| `extendTime(seconds)` | question | pushes `questionEndsAt` |
| `endGame()` | any | finished, sets `finishedAt` |

`endQuestion` is also what the realtime layer calls when every connected player has answered, so "all answered" is not an engine concern.

## Scoring

Let `P` = question points, `T` = time limit in ms, `t` = answer time minus `questionStartedAt` (clamped to `[0, T]`).

- Correct answer, speed bonus on: `round(P * (1 - t / T / 2))`, so between `P` and `P/2`.
- Correct answer, speed bonus off: `P`.
- Wrong or missing answer: `0`.
- Poll: always `0`, `correct` is `null`.
- Streak: a correct answer raises the player's `streak`, a wrong or missing one resets it to 0; polls, skipped questions and answers waiting for host grading leave it unchanged (grading then moves it). With `settings.streakBonus` a correct answer's points include `streakBonusFor(streak)` = `min(streak - 1, 5) * 100`, also stored as `bonus` on the answer record.

Correctness per type:

| Type | Correct when |
|---|---|
| single | `optionId === correctOptionId` |
| multiple | set of `optionIds` equals set of `correctOptionIds` (all or nothing) |
| truefalse | `value === correct` |
| text | `normalise(value)` equals `normalise(a)` for some accepted answer; with no accepted answers, `correct` stays `null` until `gradeText` |
| number | `abs(value - correct) <= tolerance` |
| order | `optionIds` equals the stored option order exactly (all or nothing); the answer must be a permutation of the options |

Ordering questions store the correct order as the option order. `toPublicQuestion` shows them shuffled with `displayOrder` (`order.ts`): seeded by the question id, never the correct order, the same for everyone. Their reveal distribution counts, per option, the players who put it in its right place.

`normalise`: trim, lowercase, NFD then strip combining marks (so "Győr" matches "gyor"), collapse internal whitespace.

Team mode: after scoring a question, each team's gain is `round(mean(points of all its current members))`, members without an answer counting as 0. Individual scores are still kept and shown.

Ranks: dense ranking by score descending, ties share a rank; stable on name for display.

## Snapshots

`toHostSnapshot(state, now)` and `toPlayerSnapshot(state, playerId, now)` live in `snapshots.ts`. The question in the `question` phase is passed through `toPublicQuestion`, which strips every correct-answer field. `reveal` is filled in reveal, scoreboard and finished phases and includes the full question. `distribution` keys: option id, `'true'`/`'false'`, normalised text, or the number as a string.

## Tests

`engine.test.ts` covers every row of the command table, every scoring row, the normaliser, team averaging with a non-answering member, dense ranking with ties, and the invariant that `JSON.parse(JSON.stringify(state))` deep-equals `state` after each command. Use a small fixture quiz with one question of each type.
