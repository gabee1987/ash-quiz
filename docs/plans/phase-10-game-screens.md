# Phase 10: Game screens and animations

**Branch:** `feature/game-screens` (from `develop`, after phase 9)
**Commit:** `Redesign play, projector and host screens with animations`
**Skills to load:** `web-ui`, `realtime`, `game-engine`, `i18n`, `verification`, `git-workflow`

## Goal

The part of the app players and the audience actually see feels like a game: the lobby fills up visibly, questions land with a flourish, answers give immediate tactile feedback, the reveal and the scoreboard build tension, the podium celebrates. All of it at 60 fps on a mid-range phone, with no change to the networking fan-out and full respect for reduced-motion settings.

## Scope

In:
- **Motion library.** `motion` (the package formerly published as `framer-motion`, imported from `motion/react`), loaded through `LazyMotion` with the `domAnimation` feature set so the player route stays small. One `src/lib/motion.ts` exporting the shared variants (fade-up, pop, slide, stagger) and a `useMotionOk()` hook that returns false under `prefers-reduced-motion`; every animated component uses it. Confetti via `canvas-confetti`, loaded lazily on the podium only.
- **Join screen.** Six-box PIN input (one box per digit, auto-advance, paste support, numeric keypad), nickname field with live character count, a large "Join" button with a pressed state, the team picker as big selectable cards.
- **Player lobby.** "You're in" card with the player's name and team that pops in, a live player counter, a subtle idle animation, the host's quiz title.
- **Player question.** Question enters with a slide; the timer becomes a ring around the question number plus the existing bar; option buttons use the full lower half with the shape icon, press feedback (scale down, release up), and a brief "sent" check once the ack arrives. Text and number inputs get a sticky submit bar above the keyboard. The "answered" state shows a calm waiting animation and the answer count among connected players.
- **Player reveal.** Full-screen colour wash (success or destructive token) with the correct or wrong label, the points counting up from 0 to `lastPoints`, the correct answer shown, the rank change (`previousRank` to `rank`) as an arrow with the delta.
- **Player scoreboard and podium.** Rank list with layout animation when positions change; the player's own row highlighted and kept in view. Podium reveals third, second, first with a pause between, then confetti for the winners and a "Well played" card for everyone else with their final rank.
- **Projector.** Lobby: the join URL and QR left, player names popping into a grid right, the counter in the corner. Question: big question text, option cards with shapes and the answer counter ticking. Reveal: distribution bars growing from zero with the correct ones lit. Scoreboard: top 10 with layout animation and point deltas. Podium: staged like the phone, bigger, with confetti. The pending-release and results-summary screens get the same treatment.
- **Host control.** Same layout, rebuilt with phase 9 primitives: the player panel becomes a grid of chips (name, team colour, connection dot), the primary action is one large button with the keyboard hint, secondary actions in a row, the current answers table live-updating, the grading panel with big correct/wrong toggles.
- **Engine support.** `previousRank` on `PlayerPublic` and `TeamPublic`, computed purely as the dense rank by `score - roundPoints` (pure, no new state). `roundPoints` already exists.
- **Performance rules.** Animate `transform` and `opacity` only; animations are keyed by `phase` and `questionIndex`, never re-triggered by snapshots that only change `answeredCount`; lists use stable keys (player id); `React.memo` on option buttons and rank rows. A `useSnapshotSelector` helper so components subscribe to the slice they render.

Out: sounds and music (needs licensed assets; backlog), avatars (backlog), new question types (backlog), editor (phase 11), socket toasts and host messaging (phase 12).

## Third-party packages added

`motion`, `canvas-confetti` with `@types/canvas-confetti`. Open-source, bundled, no network calls. Listed in `docs/security-notes.md`.

## Files

```
apps/web/src/lib/motion.ts + motion.test.ts
apps/web/src/lib/use-snapshot-selector.ts
apps/web/src/components/pin-input.tsx + test
apps/web/src/components/count-up.tsx
apps/web/src/components/timer.tsx                 ring variant
apps/web/src/components/option-button.tsx         press feedback, sent state
apps/web/src/components/confetti.ts               lazy loader
apps/web/src/routes/index.tsx                     join screen
apps/web/src/features/play/*.tsx                  lobby, question, answered, reveal, scoreboard, podium
apps/web/src/features/screen/*.tsx                lobby, question, reveal, scoreboard, podium, summary, pending
apps/web/src/features/questions/*.tsx             answer and display modes restyled
apps/web/src/features/host/*.tsx                  controls, player-panel, grading-panel, review-panel
apps/web/src/routes/host/games.$pin.tsx
apps/server/src/game/snapshots.ts + engine.test.ts   previousRank
packages/shared/src/game.ts                       previousRank
apps/web/e2e/game.e2e.ts                          selectors updated
docs/security-notes.md, CHANGELOG.md, .claude/skills/web-ui/SKILL.md (motion rules)
```

## Steps

1. **Engine.** `previousRank` in `toPublicPlayers`/teams with tests: lobby (equal to rank), after a question where positions swap, ties. Check: `vitest run src/game/engine.test.ts`.
2. **Motion foundation.** `lib/motion.ts` variants, `useMotionOk`, `LazyMotion` in the root, `use-snapshot-selector.ts`. Tests: `useMotionOk` under a mocked `matchMedia`. Check: web tests; bundle size of the player route recorded (budget: +45 KB gzip over phase 9).
3. **Join screen and PIN input.** Tests for the PIN input: typing, backspace moves back, paste of six digits, non-digits ignored. Check: `vitest run src/components/pin-input.test.tsx`; manual on iOS Safari and Android Chrome keyboards.
4. **Player lobby, question, answered.** Check: manual with two phones; the "sent" check appears only after the ack; the timer ring and bar agree.
5. **Player reveal, scoreboard, podium.** Check: manual; with the OS reduced-motion setting on, every screen renders its final state immediately and confetti is skipped.
6. **Projector screens.** Check: manual on a 1080p display at 2 to 4 m: text sizes from the web-ui skill still hold; 60 names fit the lobby grid (use the load test to fill it).
7. **Host control.** Check: manual on a phone and a laptop; grading a text question; kicking a player.
8. **Performance.** Chrome DevTools performance recording on an Android phone (or 4x CPU throttling on the laptop) during the reveal and scoreboard: no long tasks over 50 ms, no layout thrash. The load test with 60 players while the projector and one phone are open: fan-out unchanged. Check: numbers recorded under "Results".
9. **E2E.** Update selectors in `game.e2e.ts`; add assertions that the podium shows three places and that the reduced-motion emulation (`page.emulateMedia({ reducedMotion: 'reduce' })`) completes the game faster than the animated run. Check: `pnpm e2e`.
10. **Docs.** `web-ui` skill motion rules (transform/opacity only, keyed by phase, `useMotionOk`), `CHANGELOG.md`, security notes. Check: read through.
11. **Final pass.** `pnpm verify`, e2e against Docker, load test.

## Done when

- Every player, projector and host screen matches the scope above in both modes and all four themes.
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

1. Join from a phone by typing the PIN digit by digit, then by pasting it. Expect auto-advance and the keypad keyboard.
2. In the lobby with three phones, watch the projector. Expect each name to pop in and the counter to update.
3. Answer a single-choice question. Expect the button to press, then a check once sent, then the waiting screen.
4. Answer correctly and incorrectly on two phones. Expect green and red washes, points counting up, and a rank arrow.
5. Make two players swap places. Expect the scoreboard rows to slide, not jump, on the phone and the projector.
6. Finish the game. Expect the podium to reveal third, second, first with confetti, and the fourth phone to see its own rank.
7. Enable reduced motion on the phone and repeat 3 to 6. Expect final states instantly and no confetti.
8. Run the load test with the projector open. Expect `PASS` and the lobby grid holding 60 names.
9. Open the host control on a phone during a text question. Expect big grading toggles and the answers list updating live.
