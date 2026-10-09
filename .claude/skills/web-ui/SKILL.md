---
name: web-ui
description: Frontend conventions for apps/web: route map, TanStack Router and Query usage, socket-driven game screens, mobile-first and projector layouts, component and styling rules. Load when adding or changing any page, route or component.
---

# Web UI

## Route map (`apps/web/src/routes`)

| Route | Audience | Purpose |
|---|---|---|
| `/` | players | join form (PIN + name, team picker in team mode), `?pin=` prefill from QR |
| `/play/$pin` | players | the whole game on a phone: lobby, question, answered, reveal, scoreboard, podium |
| `/login` | hosts | username + password |
| `/host` | hosts | quiz list with Play, Edit, New, Results |
| `/host/quizzes/$quizId` | hosts | editor |
| `/host/games/$pin` | hosts | control view (phone or laptop) |
| `/host/games` | hosts | game history |
| `/host/results/$gameId` | hosts | results summary and export |
| `/screen/$pin` | projector | public read-only big-screen view |
| `/screen/results/$gameId` | projector | results summary (host session required) |

`/host/*` routes have a layout route that loads `/api/auth/me` and redirects to `/login` on 401. `/play/$pin` and `/screen/$pin` need no login.

## Data

- REST data (quizzes, results, me) goes through TanStack Query with `queryKey` arrays like `['quizzes']`, `['quiz', id]`. Mutations invalidate the keys they affect. The API client is one `apiFetch<T>(path, init)` helper in `src/lib/api.ts` that throws `ApiError { status, code }` where `code` is the i18n key from the server.
- Live game state comes only from the socket store (see `realtime` skill). Game screens are pure functions of the latest snapshot plus local UI state (selected option, text input). Never keep a second copy of game state.
- Route search params are validated with Zod in `validateSearch`.

## Screens are phase switches

`/play/$pin` and `/screen/$pin` render `switch (snapshot.phase)` with one component per phase in `src/features/play/` and `src/features/screen/`. Question rendering is a `switch (question.type)` with one component per type in `src/features/questions/`, each used by both the phone (answerable) and the screen (display only) through a `mode: 'answer' | 'display'` prop.

Answer options are identified by index. Their colours come from the game's answer palette (`settings.answerPalette`: `vivid`, `candy`, `neon`, `earth`, and the calm `muted`, `corporate`; six colours per palette in red, blue, yellow, green, orange, purple families, defined in `styles.css` under `[data-palette]` and read through `optionVars(index)` + `optionFill` from `option-colours.ts`) and their marks from the symbol set (`settings.answerSymbols`: `shapes`, `letters`, `numbers`, `icons`; `OptionSymbol` in `icons.tsx`). Colour is never the only signal. Palettes are independent of the theme and the colour mode, so answers never blend into the background.

## Quiz editor (`/host/quizzes/$quizId`)

- **Layout**: at `xl` three panes (sortable `QuestionList`, the selected question's `QuestionToolbar` + `QuestionForm`, the `PhonePreview` at 82 % zoom); at `lg` list and form, preview behind a toggle; below `lg` the form alone, the list in a bottom `Sheet` opened from a fixed bottom bar. Title, `SaveIndicator`, `ProblemsMenu`, settings and Play live in the top bar, which sticks to the top from `sm`. The settings (description and `GameSettingsForm`) dock as a third column at `xl`, replacing the list so the preview stays visible while themes are chosen (non-modal, Escape closes it); below `xl` they open in a right `Sheet`. The host sidebar is hidden on this route (`routes/host/route.tsx`).
- **Draft** is one `QuizInput` in state; edits go through the pure helpers in `features/editor/draft.ts` (`insertQuestion`, `duplicateQuestion`, `removeQuestion` / `restoreQuestion` for undo, `move` for questions and options). Delete has no confirmation; a Sonner toast with "Undo" restores the question for 10 s.
- **Drag and drop**: `@dnd-kit` through `lib/sortable.ts` (`useSortableSensors`: mouse after 4 px, touch after a 250 ms hold, keyboard; `useSortableAccessibility` for translated announcements; `dragMove`). Keyboard drag starts from a handle button; mouse and touch may drag the whole row. Keep a non-drag alternative (move buttons) for every sortable list.
- **Validation**: `validateQuiz` runs the shared schema; `locateProblem(path)` maps an error path to its question, a label and the `data-field` of the element to focus. Every editable field that can be invalid carries `data-field="<error path>"` (wrappers are fine: the first focusable inside gets focus). New questions show their errors only once visited.
- **Saving**: `useAutosave` returns `{ status, retry }` with `saved | pending | saving | invalid | offline | error`; offline saves retry on the `online` event and every 10 s. `useBlocker` asks before leaving while the status is `invalid`, `offline` or `error`, and the browser's own prompt covers closing the tab while anything is unsaved.
- **Shortcuts**: `matchShortcut` in `shortcuts.ts` (ignored while a field, dialog or menu has focus); list them in `shortcutKeys` so the "?" dialog stays complete.

## Mobile first

- Phone layout is the default; the screen view is the exception. Touch targets at least 48 px high. Answer buttons fill the width and the lower half of the viewport.
- `/play/*` has no `AppHeader`: the root layout shows `GameMenu` instead (a fixed round button top right with the language and colour mode). Keep the top right corner of phone game screens free, or give the element `pr-12` / `mr-12`.
- A question image on the phone sits in a `flex-3` box (absolutely positioned `img`, `max-h-full`, `object-contain`, `min-h-28`) next to the answers' `flex-2` box, so image and answers fit the screen together.
- Use `100dvh` based layouts, `viewport-fit=cover` safe-area padding, no horizontal scroll, no hover-only affordances.
- Forms: `inputMode="numeric"` for the PIN, `autoComplete="off"`, `enterKeyHint`.
- A persistent thin status bar shows connection state when it is not `connected`, using `errors.connectionLost`.
- Timer: a shrinking bar plus a ring with the seconds, driven by `requestAnimationFrame` against the clock offset. Stop at 0, never negative; the last five seconds turn red and pulse.
- Join: `PinInput` (one box per digit) and the lazy `QrScanner` (camera + `jsqr`, decoded on the device; offered only when `navigator.mediaDevices.getUserMedia` exists, i.e. HTTPS or localhost). `pinFromScan` in `lib/pin.ts` accepts the join link, a play link or the bare digits.

## Projector view

`/screen/$pin` targets 1080p at 2 to 4 m viewing distance: question text at 40 px or more, options at 32 px or more, the QR code at least 300 px in the lobby, the join URL spelled out next to it. Shows answer count live, the distribution bar chart in reveal (`RevealLayout`, shared with the results summary: question and image left, bars right, figures below), top 10 in scoreboard, top 3 podium at the end (`PodiumStage`, also used on phones in its compact form). If the screen is also the host (same browser session), Space or Right arrow triggers "next" and the same action floats as a button bottom right; otherwise the screen is passive.

## Motion

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

## Components and style

- **Primitives** are shadcn/ui components (Radix underneath) copied into `src/components/ui/` and edited for our look: `Button` (variants `default`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `link`; sizes `sm`, `default` (48 px), `lg`, `xl`, `icon`, `icon-sm`), `Card`, `Input`, `Textarea`, `Label`, `Select`, `Switch`, `Checkbox`, `RadioGroup`, `Dialog`, `Sheet`, `Tabs`, `Badge`, `Tooltip`, `DropdownMenu`, `Skeleton`, `Separator`, `Progress`, `Toaster` (Sonner). Add more with `pnpm dlx shadcn@latest add <name>` from `apps/web`, then run prettier on the file and replace any hard-coded English text (e.g. "Close") with `t()`.
- **App components** live in `src/components/`: `TextField` (label + input + error), `ChoiceCards` (single choice as cards; two columns when the card group itself is at least 28rem wide, a container query), `SelectField` (labelled Radix select in the app's style; use it instead of a native `<select>`), `ConfirmDialog`, `FormAlert` (inline error tied to a form), `Timer`, `OptionButton`, `DistributionBars`, `CountUp`, `RankArrow`, `WaitingDots`, `PinInput`, `QrScanner` (lazy), `QrCode`, `Backdrop`, `Spinner`, `AppHeader`, `HostNav`, `ModeToggle`.
- **Imports**: `@/` points to `src/` (shadcn requires it). New code imports primitives and app components with `@/components/...`; existing relative imports may stay.
- **Tokens only.** Colours come from semantic tokens in `styles.css` (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`/`text-primary-foreground`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`, plus `primary-edge` and friends for the chunky button edge). Never `bg-white/10`, `text-red-300` and similar. Exceptions: the answer palettes in `styles.css` (read through `option-colours.ts`), the QR code's white background (cameras need dark on white) and the medal colours.
- **Colour mode**: `light`, `dark` or `system` per device in localStorage `quizmoo.mode`, applied as `data-mode` on `<html>` before first paint by `public/mode-init.js` (a file, not an inline script: the CSP allows scripts from `'self'` only). `lib/mode.ts` is the store (`useMode`, `setMode`). `dark:` variants follow `data-mode`. Tokens have light values under `:root` and dark values under `:root[data-mode='dark']`, so most components need no `dark:` class at all.
- **Game themes**: `settings.theme` (playful `classic`, `arcade`, `sunset`, `mint`, `ocean`, `berry`, `forest`; subdued `graphite`, `navy`, `petrol`, `stone`, `bordeaux` for formal events, with chroma below 1) is a quiz setting. `/play/$pin`, `/screen/$pin` and `/host/games/$pin` call `useGameTheme(snapshot.settings)`, which sets `data-theme` and `data-palette` on `<html>` (so dialogs and toasts in portals follow them). A theme only overrides `--hue`, `--hue-accent`, `--tint` and `--chroma`; every token is computed from them, so both modes keep their contrast. The tokens are declared on `:root` and on every `[data-theme]` element, so a theme on a wrapper (the editor's phone preview) renders inside the page without changing it. Swatches for pickers come from `lib/themes.ts`, which mirrors the hues in `styles.css`.
- **Look**: Nunito (self-hosted via `@fontsource-variable/nunito`, never a font CDN), headings `font-black`/`font-extrabold`, 12 to 24 px radii (`rounded-xl` to `rounded-2xl`), `shadow-soft` on cards, solid buttons with a darker bottom edge that sink when pressed.
- **Errors**: a failed request where no field is at fault calls `toastError(error)` from `lib/toast.ts` (e.g. `useMutation({ onError: toastError })`); errors tied to a form use `FormAlert` or the field's own error.
- **Accessibility**: every interactive element shows a focus ring (`focus-visible:ring-[3px] focus-visible:ring-ring`); text meets 4.5:1 in both modes (`e2e/a11y.e2e.ts` runs axe in both modes); `prefers-reduced-motion` ends all CSS animations and transitions immediately (global rule in `styles.css`).
- Tailwind utility classes only. No CSS modules.
- Function components, hooks for logic, no class components, no default exports except route files.
- Files kebab-case, components PascalCase. One component per file unless a tiny private helper.
- Icons: `lucide-react` (`<PlayIcon aria-hidden="true" />` next to a text label, or an `aria-label` on an icon-only button). The answer shapes and the check/cross marks stay in `src/components/icons.tsx`.
- Every text through `t('...')` (see `i18n` skill).

## Tests

Vitest with `@testing-library/react` and `happy-dom` for logic-bearing components only: the timer hook, the socket store, the answer normaliser mirror if one exists, the editor's question validation. Playwright end-to-end lives in `apps/web/e2e` (phase 8).
