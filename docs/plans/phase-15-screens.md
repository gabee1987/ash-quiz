# Phase 15: Phone and results screens

**Branch:** `feature/screens-v2` (from `develop`, after phase 14)
**Commit:** `Redesign the phone game screens, results page and new game dialog`
**Skills to load:** `web-ui`, `i18n`, `verification`, `git-workflow`

## Goal

The screens people look at most get clearer: a phone shows a question with its image and every answer at once, the end-of-game review on the phone is readable, the host's results page starts with what matters, and starting a game shows the settings in plain groups. Web only: no schema, engine or server change.

## Scope

In:
- **Phone game screens without the header.** On `/play/*` the app header (logo, language, colour mode) is replaced by a small floating round button in the top right corner that opens a menu with the language and the colour mode. The space goes to the game.
- **Question with an image fits the phone.** The image takes the space left between the question text and the answers and shrinks to fit (`object-contain`), so the image and all answers are visible without scrolling on a 390 × 844 phone with four options. Without an image the answers fill the space as before. If the answers alone are taller than the screen (six long options, ordering), the page scrolls as today and the image keeps a minimum height.
- **End-of-game review on the phone.** One card per question with a stripe in the result colour (green right, red wrong, neutral for polls and no answer), the question and the points on the card; tapping it opens "Your answer" and "Correct answer" on separate lines. All closed at first.
- **Results page: summary first.** At the top: figures (players, questions, average correct share, average answer time), the podium, and the easiest and hardest question. Below, tabs: Players (with the team table in team mode) and Questions. The summary figures come from a pure, tested helper.
- **New game dialog in groups.** Three groups (Game flow, Look, Scoring), each a card with its summary as chips and a "Change" button that opens that group's part of the settings form (one group open at a time). A group changed from the quiz's defaults is marked "Changed for this game" with "Reset".

Out: the projector's layout, the editor, server changes, new settings.

## Files

```
apps/web/src/routes/__root.tsx, components/app-header.tsx     header hidden on /play
apps/web/src/components/game-menu.tsx                          floating language and mode menu
apps/web/src/features/play/question.tsx                        image area
apps/web/src/features/play/podium.tsx                          review cards
apps/web/src/features/results/summary.ts (+ test)              figures, easiest and hardest
apps/web/src/features/results/results-summary.tsx
apps/web/src/routes/host/results.$gameId.tsx                   summary and tabs
apps/web/src/features/host/create-game-dialog.tsx              groups
apps/web/src/features/host/game-settings-form.tsx              summary per group
apps/web/src/i18n/hu.json, en.json
```

## Steps

1. **Game menu and header.** Check: screenshots of the phone lobby and question in both modes; the menu changes the language and mode.
2. **Question image layout.** Check: screenshots at 390 × 844 with an image and four options, and with six long options.
3. **Review cards.** Check: screenshot of the podium page with right, wrong, unanswered and poll questions; a card opens and closes.
4. **Results summary.** `summary.test.ts`: averages, ties for easiest and hardest, polls and ungraded text left out, no answers. Check: `vitest run`, screenshot.
5. **New game dialog.** Group summaries split from `settingsSummary`; changed marker and reset. Check: screenshot, a changed group starts the game with the change.
6. **Final pass.** Existing e2e specs still pass (they use the join page, the dialog and the results page); `pnpm verify`; changelog, backlog.

## Done when

- On a 390 × 844 phone a question with an image and four options shows all of it without scrolling.
- Phones in a game have no header; language and mode are in the floating menu.
- The phone review shows one card per question with the result colour, opening to the own and correct answer.
- The results page shows the summary first and the players and questions in tabs.
- The new game dialog shows three groups with summaries and opens one at a time.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

## Manual test list (draft)

1. Join on a phone. Expected: no header in the lobby, a round button top right; switch to English and dark mode from it.
2. Play a question with an image and four answers. Expected: image and all answers on screen without scrolling.
3. Finish a game with results released. Expected: one card per question with green or red stripes; tap one to see your answer and the correct one.
4. Open the results page. Expected: figures, podium, easiest and hardest question first; Players and Questions tabs below.
5. Start a game. Expected: three groups with chips; change the theme in Look, see "Changed for this game"; Reset brings the quiz's setting back.

## Results

- `src/features/results/summary.test.ts` (4 cases): averages over scored questions and over every answer, ties keep the earlier question, no easiest or hardest with fewer than two scored questions, no answers or no questions.
- Screens checked on a production build: phone lobby with the menu (opened), a question with an image and four options fitting 390 × 844 without scrolling (asserted), six long options, the review cards closed and opened, the results page on a laptop and a phone with both tabs, the new game dialog with a changed and reset group (asserted).
- All 9 e2e specs pass; `game.e2e.ts` opens the Questions tab before checking a question's figures.

## Deviations

- **The image and the answers share the free space 3 : 2**, rather than the image taking only what is left: with two options (true or false) the buttons would otherwise grow to half the screen while the image shrinks.
- **The group labels** are the batch edit's (`host.batch.groups.*`), so both dialogs name the groups the same way. `settingsSummary` is now built from the new per-group `sectionSummary`; the look group lists the theme first.
- **The projector keeps its header**; only phones (`/play/*`) lose it.
