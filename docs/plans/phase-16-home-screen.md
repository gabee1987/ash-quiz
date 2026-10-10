# Phase 16: Join and login home screen

**Branch:** `feature/home-screen` (from `develop`, after phase 15)
**Commit:** `Redesign the join and login screens with an animated cow`
**Skills to load:** `web-ui`, `game-screens`, `design-system`, `motion`, `i18n`, `browser-checks`, `verification`, `git-workflow`

## Goal

The first screen people see sets the mood: the cow and the Quizmoo name big and centre stage, a playful, game-like look with funny animations, and a clear structure from the logo to the PIN. It stays snappy: nothing new to download, no JavaScript animation loop, no layout shift, and the PIN can be typed the moment the page shows. Web only.

## Scope

In:
- **Hero.** A shared `HomeHero` on `/` and `/login`: the cow logo drawn inline (so its parts can move), the app name as a big wordmark and a short tagline. On phones it sits above the form; from `lg` the hero is on the left and the form on the right.
- **Cow animation.** Idle: the head bobs gently, the eyes blink now and then, the ears flick. The wordmark's letters bounce in once on load. Tapping the cow makes it jump with a "Moo!" speech bubble (a real button with a translated label); repeated taps cycle through a few speech lines.
- **Playful background on these two pages.** A few floating quiz shapes (the answer symbols and a "?") drift slowly behind the content, in the theme's colours, on top of the existing backdrop blobs.
- **Structure.** Join: the hero, then the join card (PIN, then name and avatar as today), then the host login link. Login: the hero (smaller on phones), then the login card and a link back to joining. The header on these pages keeps the language and colour mode but drops its small logo and name, since the hero shows them.
- **Performance budget.** CSS keyframes on `transform` and `opacity` only, at most 8 floating shapes, no filters or blur in animations, no new dependency, no image download for the cow, the hero has a fixed size (no layout shift), and everything stands still under `prefers-reduced-motion`.

Out: the host pages, the game screens, the favicon and header logo file, sounds.

## Files

```
apps/web/src/components/cow-logo.tsx (+ test)        inline animated cow
apps/web/src/components/home-hero.tsx (+ test)       logo, wordmark, tagline, moo
apps/web/src/components/floating-shapes.tsx          background shapes
apps/web/src/components/app-header.tsx               brand hidden on / and /login
apps/web/src/routes/index.tsx, login.tsx             layout
apps/web/src/styles.css                              keyframes
apps/web/src/i18n/hu.json, en.json
```

## Steps

1. **Baseline.** Measure the current `/` on the production build with a phone profile (390 × 844, CPU slowed 4×): largest contentful paint, layout shift, main-thread time over 5 s of idle, JavaScript loaded. Check: numbers written down.
2. **Cow and hero.** `CowLogo` with animatable parts, `HomeHero` with the wordmark and the moo button. Tests: the hero has the app name as the page heading, the cow is a button with a label, a tap shows the speech bubble and the next tap shows the next line. Check: `vitest run`, screenshots.
3. **Background shapes.** Check: screenshots in light and dark mode; animations are transform and opacity only.
4. **Join and login layout.** Header without the brand on these routes. Check: screenshots of the phone (390 × 844: the PIN boxes visible without scrolling) and the laptop, both modes, both languages.
5. **Performance check.** Same measurement as step 1. Check: no layout shift, idle main-thread time and LCP not noticeably worse than the baseline.
6. **Final pass.** `pnpm verify`, e2e specs (they use the join and login pages, `a11y.e2e.ts` runs axe on both), changelog, backlog.

## Done when

- The cow and the name are big and centred on the join and login pages, with the idle animation and the tap moo.
- On a 390 × 844 phone the PIN boxes are visible without scrolling.
- The pages show no layout shift, and idle main-thread time stays close to the baseline.
- Reduced motion stops every animation on these pages.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

## Manual test list (draft)

1. Open the join page on a phone. Expected: the cow and "Quizmoo" big at the top, letters bounce in, the PIN boxes visible without scrolling.
2. Watch for a few seconds. Expected: the cow bobs, blinks and flicks its ears; shapes drift behind.
3. Tap the cow a few times. Expected: it jumps and says "Moo!", then other lines.
4. Type a PIN right after the page opens. Expected: no delay, nothing jumps.
5. Open the login page on a laptop. Expected: hero left, login card right; a link back to joining.
6. Switch to dark mode and to Hungarian. Expected: readable in both, texts translated.
7. Turn on "reduce motion" in the OS. Expected: everything stands still.
