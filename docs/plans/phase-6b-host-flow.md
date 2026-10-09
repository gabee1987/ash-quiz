# Phase 6b: Host flow options, host sidebar, plain answer buttons

**Branch:** `feature/host-flow` (from `develop`)
**Commit:** `Add reveal and scoreboard options, host sidebar and plain answer buttons`
**Skills to load:** `game-engine`, `realtime`, `web-ui`, `i18n`, `verification`, `git-workflow`

Inserted after phase 6 from feedback on the first real test run. Phases 7 and 8 do not cover it.

## Goal

The host decides when correct answers and the scoreboard are shown, can go straight to the next question, and navigates the host pages from a sidebar on a laptop. Players get calm, uncoloured answer buttons and a way home after the game.

## Scope

In:
- Game settings stored on each quiz (`quizzes.settings`, migration `0002`), edited in a collapsible "Game settings" section of the quiz editor. The new-game dialog shows them as a summary and can override them for that game only in a collapsed section. `POST /api/games` uses the quiz's settings when the request has none. Team mode needs two distinct team names (shared schema rule). The settings:
  - `revealAnswers: 'afterQuestion' | 'atEnd'`. With `atEnd`, nothing that reveals correctness (correct answer, right/wrong, points, scores, ranks) reaches players or the public screen until the game is finished. The host control still sees everything. At the end every player sees their own answers next to the correct ones.
  - `scoreboard: 'afterQuestion' | 'onDemand'`. With `onDemand` the primary action after a question is "Next question" and the scoreboard is a secondary button; phones do not show the running rank. `atEnd` implies `onDemand`, and then no scoreboard is shown until the end.
- Engine: `next` from reveal goes straight to the next question (or finishes); new `scoreboard` command moves reveal to scoreboard; `skip` only stops at the scoreboard when the scoreboard is shown after every question.
- Host control: both "Show scoreboard" and "Next question" after every question; which one is primary follows the setting.
- Host sidebar on laptop width (quizzes, users for admins, change password, log out); a compact top nav on phones.
- Game setting `answerStyle: 'plain' | 'colourful'` (default `plain`): plain buttons with letters A, B, C… or coloured buttons with shapes on phones. The editor preview shows plain; the projector always keeps colours and shapes.
- Players: "Back to home" button on the final screen, which also forgets the stored player token for that game.

Out: results history and projector summary (phase 7).

## Steps

1. Shared schemas: settings fields with defaults, `scoreboard` host command, snapshot `settings` on the base and `answersHidden`, player `myResults`. Check: `pnpm typecheck`.
2. Engine and snapshots: new transitions, concealment of public and player snapshots, `myResults`. Restored games get default settings. Check: engine and snapshot tests.
3. Realtime: dispatch `scoreboard`. Check: realtime tests.
4. Web: create dialog, controls, primary action, player reveal/podium, screen reveal, plain option buttons, host layout with sidebar. Check: browser run.
5. i18n both languages. Check: key-set test.
6. Final pass: `pnpm verify` and DB tests.

## Verification command

```powershell
pnpm verify; $env:TEST_DATABASE_URL="postgres://quizmoo:quizmoo@localhost:5432/quizmoo"; pnpm --filter @quizmoo/server test
```

## Deviations

- **Concealment is server-side, per audience.** With `revealAnswers: 'atEnd'`, player snapshots and the public screen snapshot carry no reveal, points, scores, ranks or correct counts (zeroed, flagged by `answersHidden`). The host room keeps full data, so a projector logged in as the host hides them in the UI instead.
- **End-of-game answer review for every game**, not only with results at the end: `myResults` lists the questions actually asked with the player's answer and the correct one.
- **The running rank on phones** is hidden when the scoreboard is on demand, since it is a scoreboard of its own. Per-question points still show.
- **Skip** lands on the scoreboard only when the scoreboard follows every question; otherwise it moves straight to the next question.
- **Editor layout.** The editor's side preview moved from the `lg` to the `xl` breakpoint, because the new sidebar takes width on laptops.
- **Restored games.** Games persisted before this phase get the new settings' defaults on restore.
- **Settings per quiz** (user feedback during the phase): first built as game-only options in the dialog, then moved onto the quiz with a per-game override. An override replaces the quiz's settings as a whole for that game. The frozen quiz copy in a game (`GameQuiz`) leaves the quiz's settings out; the game's own settings apply.
- **The editor's phone preview** follows the quiz's answer style.
