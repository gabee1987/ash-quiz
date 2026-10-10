---
name: motion
description: Quizmoo animation rules: CSS keyframe utilities, staggering, keying screens so animations replay only when meant to, reduced motion, press wobble, confetti, springy easings. Load when adding or changing any animation or transition.
---

# Motion

- CSS keyframes only, defined in `styles.css` under `@theme` and used as `animate-pop`, `animate-fade-up`, `animate-slide-in`, `animate-grow-x` / `animate-grow-y` (with `origin-left` / `origin-bottom`), `animate-float`, `animate-wiggle`, `animate-pulse-ring`, `animate-burst`, `animate-draw` (SVG stroke), `animate-progress`, `animate-drift` (backdrop), `animate-dot`; `glow-border` adds a slowly rotating gradient ring. No animation library: nothing to download, and the global reduced-motion rule ends every animation at once.
- Animate `transform` and `opacity` only. Lists stagger with `style={stagger(index)}` from `lib/motion.ts`.
- Entrance animations run on mount. Game screens are keyed by phase and question id, so a snapshot that only changes `answeredCount` never replays them; an element that should pop on every change is keyed by that value on purpose (the player counter).
- JS-driven effects go through `lib/motion.ts`: `useMotionOk()` / `motionOk()` for `prefers-reduced-motion`, `useCountUp()` / `<CountUp>` for numbers. Confetti is `celebrate()` in `lib/confetti.ts` (lazy `canvas-confetti`, no worker because of the CSP, skipped under reduced motion).
- `Backdrop` (three drifting colour blobs behind every page) is mounted once in the root layout.
- **Press wobble**: `installSquish()` (`lib/squish.ts`, installed in the root layout) gives every clicked button, button-like link, menu item and `[data-squish]` element (choice cards) a short "bubble gum" squash and stretch through the Web Animations API with `composite: 'add'`, so it stacks on hover lifts and entrance animations without restarting them. Nothing to add per component; opt out with `data-no-squish`.
- Menus and select lists open with `animate-menu-pop`, dialogs with `animate-dialog-pop`. Springy transitions use the easing tokens `ease-spring` (small overshoot: focus rings, switch thumbs, icons) and `ease-spring-soft` (large moves: sheets, the editor's column change, progress bars).
- The editor's settings choreography animates `grid-template-columns` (four fixed tracks at `xl`, no grid gap, spacing inside the side columns) and slides each side panel inside an `overflow-x-clip` wrapper anchored to the moving edge. Keep track counts equal between states, or the browser jumps instead of interpolating.
- Scrollbars are styled globally in `styles.css` (pill thumb in the theme colour, plumper on hover); Firefox gets the thin `scrollbar-color` variant.
- The projector's results summary (`useSlideshow`) moves on every 8 s and can be paused (button or P); resuming keeps the time that was left.
- Host messages fly in and out with an elastic animation and show their remaining time as a progress bar on the message itself.
