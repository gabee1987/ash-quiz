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

## Results

- `src/components/home-hero.test.tsx` (5 cases): the speech lines cycle and start again after the last, every line exists in both languages, the app name is the page heading, nothing is said before the first tap and each tap shows the next line, the line is announced through a live region.
- Performance on the production build, phone profile (390 × 844, CPU slowed 4×), median of 7 runs:

  | | Before | After |
  |---|---|---|
  | `/` largest contentful paint | 488 ms | 508 ms |
  | `/login` largest contentful paint | 456 ms | 520 ms |
  | Layout shift | 0 | 0 |
  | Main-thread time over 5 s idle | 8–9 ms | 46 ms |
  | JavaScript / CSS loaded | 744 / 108 KB | 751 / 113 KB |
  | Animated properties other than transform and opacity | none | none |

  The idle cost is Chrome's bookkeeping for 21 running compositor animations (about 2 ms per animation per 5 s on the slowed CPU, none of it layout or paint); it varied between 44 and 88 ms across identical runs.
- Screens checked: join and login on a phone and a laptop, light and dark, Hungarian and English; the PIN boxes end at 612 of 844 px (asserted); a tap mid-jump with the bubble; every speech line inside a 360 px screen in both languages (asserted); reduced motion: no running animation and the bubble stays (asserted).
- All 9 e2e specs pass, including the axe check of the join and login pages in both modes.

## Deviations

- **No "look around" for the pupils**: they already sit at the edge of the eye whites (the cow's cross-eyed look), so there is no room to move them. The idle motion is the bob, the blink and the ear flicks.
- **Five floating shapes, not up to eight**, and **no fade on the wordmark and tagline**: each running animation costs a little main-thread time, and text that fades in from transparent delays the largest contentful paint until it is visible.
- **The login hero is the same size as the join hero** on phones; the login card fits below it on a 390 × 844 screen, so a smaller variant was not needed.
- **One app slogan on both pages** ("Think. Quiz. Outsmart the herd!" / "Gondolkodj. Válaszolj. Győzd le a csordát!"), informal in Hungarian, instead of a separate host tagline on the login page (the user's call after testing).
- **The Hungarian texts of the whole app were rewritten** (182 of 588 strings) in a friendly, informal tone at the user's request: no "Ön" on host and editor screens any more, verbs instead of noun phrases in headings. Placeholders were checked by script; the English texts are unchanged.
- **The speech bubble is outlined in the text colour**, not the theme colour: where its tail overlaps the cow's tile, a theme-coloured outline vanished and the bubble looked cut off.
- **A layout shift of 0.0002** can appear when the Nunito font arrives after the first paint: the wordmark's letters are separate boxes, so the font swap moves them. Google's "good" threshold is 0.1; preloading the font would remove it but touches every page.
