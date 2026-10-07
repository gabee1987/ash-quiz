# Phase 10: Game screens, animations, answer styles and themes

**Branch:** `feature/game-screens` (from `develop`, after phase 9)
**Commit:** `Animate the game screens, add answer palettes, symbols and themes`
**Skills to load:** `web-ui`, `realtime`, `game-engine`, `i18n`, `verification`, `git-workflow`

## Goal

The part of the app players and the audience actually see feels like a game: the lobby fills up visibly, questions land with a flourish, answers give immediate tactile feedback, the reveal and the scoreboard build tension, the podium celebrates. Answer buttons stand out from the game theme with their own colours and symbols, both chosen by the host, and there are more themes to choose from. Everything runs on the compositor (transform and opacity only), nothing is added to the networking fan-out, and reduced-motion settings are respected.

Re-scoped after the phase 9 review: the host asked for playful motion on buttons, backgrounds and borders, answer colours and symbols as options, more themes, phone answers that do not blend into the theme, an in-app QR scanner on the join page, a better per-question result screen with the question's image, a better podium with celebration and on-screen navigation, and a theme preview in the editor.

## Scope

In:
- **Animation foundation, CSS only.** Keyframes in `styles.css` (`pop`, `rise`, `fade-up`, `grow-x`, `grow-y`, `float`, `wiggle`, `pulse-ring`, `burst`, `shimmer`, `draw`, `progress`) exposed as `animate-*` utilities, staggered with inline `animation-delay`. A `useMotionOk()` hook (`prefers-reduced-motion`) for JS-driven effects (count-up, confetti). Confetti via `canvas-confetti`, loaded lazily on the podium only. No animation library: the keyframes cost nothing to download and run on the compositor; the global reduced-motion rule ends them instantly.
- **Playful chrome.** Solid buttons lift on hover and sink on press; a soft animated backdrop (three drifting colour blobs in the theme's hues) behind every page; the lobby card, the PIN and the winner get a slowly shifting gradient border.
- **Answer palettes and symbols.** Two new quiz settings, overridable per game: `answerPalette` (`vivid`, `candy`, `neon`, `earth`) and `answerSymbols` (`shapes`, `letters`, `numbers`, `icons`). Palettes are six fixed colours with their own text colours, defined as CSS variables per `[data-palette]`, independent of the theme and the colour mode, so answer buttons never blend into the background. The existing `answerStyle` (`plain` or `colourful` phones) stays; its default becomes `colourful`, and `plain` buttons keep a coloured symbol badge on a neutral card.
- **More themes.** `ocean`, `berry`, `forest` and `graphite` join the four of phase 9. Themes gain a chroma multiplier so `graphite` can be nearly neutral. Theme tokens are also computed inside any `[data-theme]` element, so the editor's phone preview can show a theme without changing the page.
- **Join screen.** Six-box PIN input (auto-advance, backspace, paste, numeric keypad), a camera button that opens an in-app QR scanner (`jsqr`, lazy loaded; frames are decoded on the device and never leave it; shown only where the browser allows camera access, i.e. HTTPS or localhost), a large Join button, the team picker as cards.
- **Player screens.** Lobby card that pops in with a waiting animation and a live player count; question with the timer as a ring plus the bar, staggered option entrance, press feedback and a pending state; answered state with a drawn check mark; reveal with a colour wash, points counting up, the correct answer with its colour, and the rank change as an arrow (`previousRank`); scoreboard rows sliding in with the player's own row highlighted; podium staged third, second, first with confetti for the top three and a "Well played" card for everyone else.
- **Projector screens.** Lobby with names popping into a grid and the counter; question with option cards and the ring timer; reveal restructured: question text and image on the left, bars growing from zero on the right with the correct ones lit, counts counting up, stat chips underneath; scoreboard top 10 with point deltas and rank arrows; podium with pillars growing from the floor, crown, confetti, and the runners-up fading in; the results summary gets the same reveal layout, the image, on-screen previous and next buttons and a progress bar for the auto-advance. A host-attached projector shows the primary action as a floating button next to the keyboard shortcut.
- **Results page.** Each question's image as a thumbnail next to its statistics.
- **Editor preview.** The phone preview renders inside the quiz's theme and palette and shows a sample question when none is selected, so choosing a theme, palette or symbol set previews an answer screen immediately.
- **Engine support.** `previousRank` on `PlayerPublic` and `TeamPublic`, computed purely as the dense rank by `score - roundPoints` (pure, no new state).
- **Performance rules.** Animate `transform` and `opacity` only; entrance animations run on mount and are keyed by `phase` and `questionIndex`, never re-triggered by snapshots that only change `answeredCount`; lists use stable keys (player id). The player route chunk may grow by at most 45 KB gzip over phase 9 (the scanner and confetti are separate lazy chunks).

Out: sounds and music (backlog), avatars (backlog), new question types including partial-credit multiple choice (backlog), re-showing an answered question (backlog), the phone's end-of-game answer review redesign (backlog), the editor (phase 11), socket toasts and host messaging (phase 12).

## Third-party packages added

`canvas-confetti` with `@types/canvas-confetti` (podium celebration, lazy), `jsqr` (QR decoding on the join page, lazy). Open-source, bundled, no network calls. Listed in `docs/security-notes.md`. The `motion` library planned earlier is not used (see Deviations).

## Files

```
packages/shared/src/quiz.ts                       themes, answerPalette, answerSymbols
packages/shared/src/game.ts                       previousRank
apps/server/src/game/snapshots.ts + snapshots.test.ts   previousRank
apps/server/src/game/fixtures.ts, test/settings.test.ts, test/quizzes.test.ts
apps/web/src/styles.css                           themes in wrappers, chroma, palettes, keyframes
apps/web/src/lib/themes.ts                        8 themes, palettes, useGameTheme(settings)
apps/web/src/lib/motion.ts + motion.test.ts       useMotionOk, useCountUp
apps/web/src/lib/confetti.ts                      lazy loader
apps/web/src/components/backdrop.tsx
apps/web/src/components/pin-input.tsx + test
apps/web/src/components/qr-scanner.tsx            lazy
apps/web/src/components/option-button.tsx, option-colours.ts, icons.tsx
apps/web/src/components/timer.tsx                 ring
apps/web/src/components/distribution-bars.tsx     animated
apps/web/src/components/ui/button.tsx             hover lift
apps/web/src/routes/index.tsx                     join screen
apps/web/src/routes/play.$pin.tsx, screen.$pin.tsx, screen.results.$gameId.tsx, host/games.$pin.tsx
apps/web/src/features/play/*.tsx
apps/web/src/features/screen/*.tsx                lobby, question, reveal, scoreboard, podium, summary
apps/web/src/features/questions/*.tsx             symbols passed through
apps/web/src/features/results/question-stats.tsx  image
apps/web/src/features/host/game-settings-form.tsx palette, symbols, themes
apps/web/src/features/editor/phone-preview.tsx    theme + sample question
apps/web/src/routes/host/quizzes.$quizId.tsx      preview gets the settings
apps/web/src/i18n/hu.json, en.json
apps/web/e2e/game.e2e.ts
docs/security-notes.md, CHANGELOG.md, .claude/skills/web-ui/SKILL.md (motion rules, palettes)
```

## Steps

1. **Schema and engine.** Themes, palettes, symbols in the shared schema with defaults; `previousRank` in `snapshots.ts` with tests: lobby (equal to rank), after a question where positions swap, ties, concealed results. Check: `vitest run src/game/snapshots.test.ts` and the server test suite.
2. **Tokens and keyframes.** Themes computed in `[data-theme]` wrappers, `--chroma`, the four palettes, the keyframes, the button hover lift, the backdrop. Check: `pnpm --filter @ash-quiz/web build`; the editor preview changes colour with the theme.
3. **Join screen.** PIN input with tests (typing, backspace moves back, paste of six digits, non-digits ignored), the scanner. Check: `vitest run src/components/pin-input.test.tsx`; manual on a phone over HTTPS.
4. **Player screens.** Check: manual with two phones; the pending state ends when the ack arrives; the ring and the bar agree.
5. **Projector screens and the summary.** Check: manual on a 1080p display; 60 names fit the lobby grid (load test); the image shows on the reveal and the summary.
6. **Settings and preview.** Check: manual; picking a theme, palette or symbol set changes the preview at once.
7. **E2E and performance.** Selectors updated; `pnpm e2e` against the production build; Chrome performance recording during reveal and scoreboard with 4x CPU throttling: no long task over 50 ms; load test with the projector open.
8. **Docs and final pass.** Skill, changelog, security notes, plan results; `pnpm verify`.

## Done when

- Every player, projector and host screen matches the scope above in both modes and all eight themes, with every palette and symbol set.
- With reduced motion enabled no animation plays and nothing is hidden or delayed.
- No long task over 50 ms during reveal or scoreboard on a throttled CPU; load test fan-out still under 200 ms with the screens open.
- The player route chunk grew by at most 45 KB gzip over phase 9.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify; $env:TEST_DATABASE_URL="postgres://ashquiz:ashquiz@localhost:5432/ashquiz"; pnpm --filter @ash-quiz/server test
docker compose up -d --build --wait
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
$env:LOAD_TEST_USERNAME="admin"; $env:LOAD_TEST_PASSWORD="..."; pnpm load-test --players 60
```

## Manual test list (draft)

1. Join from a phone by typing the PIN digit by digit, then by pasting it. Expect auto-advance and the numeric keypad.
2. Over HTTPS, tap the camera button and point the phone at the projector's QR code. Expect the PIN filled in and the quiz title shown.
3. In the lobby with three phones, watch the projector. Expect each name to pop in and the counter to update.
4. Answer a single-choice question. Expect the button to press, a pending state, then the drawn check mark.
5. Answer correctly and incorrectly on two phones. Expect green and red washes, points counting up, and a rank arrow.
6. Finish the game. Expect the podium to rise third, second, first with confetti, and the fourth phone to see "Well played" with its rank.
7. Enable reduced motion on the phone and repeat 4 to 6. Expect final states instantly and no confetti.
8. In the editor, pick each theme, palette and symbol set. Expect the phone preview to follow immediately.
9. Open the results summary on the projector. Expect the image on each question's slide and the on-screen arrows to work.

## Results

Sizes are gzip, measured with `vite build` and the same script as phase 9 (route chunk, its static imports, the entry chunk and the CSS).

| Measure | Phase 9 | After |
|---|---|---|
| Entry chunk with its imports | 175.4 KB | 176.5 KB |
| CSS | 12.4 KB | 14.4 KB |
| `/play/$pin` total | 210.2 KB | 219.6 KB (+9.4 KB, budget +45 KB) |
| `/screen/$pin` total | 219.2 KB | 227.6 KB |
| QR scanner chunk (only when the camera button is pressed) | – | 48.8 KB |
| Confetti chunk (only on the podium) | – | 4.2 KB |

Long tasks on a phone with 4x CPU throttling (Chrome, `PerformanceObserver` for `longtask`, one game of two questions): none during the question, the answer, the reveal, the scoreboard or the podium with confetti. The only two (84 ms and 62 ms) occur right after joining, when the play route loads and connects.

Load test (60 players, 20% flapping, production bundle): PASS, answer ack p95 12 ms, fan-out max 7 ms, 0 answers missed.

End-to-end: the game spec and both accessibility specs pass against the production build (the PIN boxes and the camera button are labelled).

## Deviations

- **No animation library.** The plan named `motion`; everything is CSS keyframes instead (`styles.css`, `animate-*` utilities, `glow-border`), with `lib/motion.ts` only for reduced-motion detection and counting numbers up. Reasons: nothing to download on every phone (`motion` would have been about 20 KB gzip, and its layout animations need the larger feature set), the animations run on the compositor, and the global reduced-motion rule already ends them. The scoreboard therefore has no layout animation when positions swap; rows slide in and the rank arrows (`previousRank`) tell the story.
- **Scope added after the phase 9 review:** answer palettes and symbols, four more themes with a chroma multiplier, the in-app QR scanner, the question image on every reveal, the restructured projector reveal, on-screen navigation in the results summary, the floating next button on a host-attached projector, and the theme preview in the editor. The deferred requests (phone answer review redesign, re-showing an answered question, partial-credit multiple choice) are in the backlog.
- **Theme preview.** Tokens are declared on `:root` and on every `[data-theme]` element, so the editor's phone preview can render a theme and palette without touching the page. Because of that, the sample question and the selected question are rendered inside the frame rather than in a separate preview mode.
- **`answerStyle` defaults to `colourful`.** The default only applies where the setting is absent: new quizzes, and quizzes saved before the setting existed (phase 6b). Those older quizzes change from plain to coloured phone buttons; the host can switch them back in the editor.
- **Confetti without a web worker.** `canvas-confetti` normally spawns a worker from a blob URL, which the CSP (`script-src 'self'`) blocks; the instance is created with `useWorker: false`. The CSP is unchanged.
- **Camera button only in secure contexts.** Browsers expose `getUserMedia` only over HTTPS or on localhost, so the button is hidden on a plain-HTTP LAN deployment; the camera app route (QR code with `?pin=`) keeps working there.
- **Host control not rebuilt.** The plan's host control rebuild (chips grid, large grading toggles) was not done: the phase 9 restyle stands, the host's next step is additionally available as a button on a host-attached projector. The chips with connection state belong to phase 12.
- **Phone end-of-game answer review** is unchanged (it was requested as a later, separate branch).
