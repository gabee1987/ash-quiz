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

Answer option colours and shapes are fixed by index: red triangle, blue diamond, yellow circle, green square, orange pentagon, purple hexagon. Colour is never the only signal.

## Mobile first

- Phone layout is the default; the screen view is the exception. Touch targets at least 48 px high. Answer buttons fill the width and the lower half of the viewport.
- Use `100dvh` based layouts, `viewport-fit=cover` safe-area padding, no horizontal scroll, no hover-only affordances.
- Forms: `inputMode="numeric"` for the PIN, `autoComplete="off"`, `enterKeyHint`.
- A persistent thin status bar shows connection state when it is not `connected`, using `errors.connectionLost`.
- Timer: a shrinking bar plus seconds, driven by `requestAnimationFrame` against the clock offset. Stop at 0, never negative.

## Projector view

`/screen/$pin` targets 1080p at 2 to 4 m viewing distance: question text at 40 px or more, options at 32 px or more, the QR code at least 300 px in the lobby, the join URL spelled out next to it. Shows answer count live, the distribution bar chart in reveal, top 10 in scoreboard, top 3 podium at the end. Keyboard: Space or Right arrow triggers "next" only if the screen is also the host (same browser session), otherwise the screen is passive.

## Components and style

- **Primitives** are shadcn/ui components (Radix underneath) copied into `src/components/ui/` and edited for our look: `Button` (variants `default`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `link`; sizes `sm`, `default` (48 px), `lg`, `xl`, `icon`, `icon-sm`), `Card`, `Input`, `Textarea`, `Label`, `Select`, `Switch`, `Checkbox`, `RadioGroup`, `Dialog`, `Sheet`, `Tabs`, `Badge`, `Tooltip`, `DropdownMenu`, `Skeleton`, `Separator`, `Progress`, `Toaster` (Sonner). Add more with `pnpm dlx shadcn@latest add <name>` from `apps/web`, then run prettier on the file and replace any hard-coded English text (e.g. "Close") with `t()`.
- **App components** live in `src/components/`: `TextField` (label + input + error), `ChoiceCards` (single choice as cards), `NativeSelect` (platform select styled like `Input`, best on phones), `ConfirmDialog`, `FormAlert` (inline error tied to a form), `Timer`, `OptionButton`, `QrCode`, `Spinner`, `AppHeader`, `HostNav`, `ModeToggle`.
- **Imports**: `@/` points to `src/` (shadcn requires it). New code imports primitives and app components with `@/components/...`; existing relative imports may stay.
- **Tokens only.** Colours come from semantic tokens in `styles.css` (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`/`text-primary-foreground`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`, plus `primary-edge` and friends for the chunky button edge). Never `bg-white/10`, `text-red-300` and similar. Exceptions: the six answer-option colours in `option-colours.ts`, the QR code's white background (cameras need dark on white) and the medal colours.
- **Colour mode**: `light`, `dark` or `system` per device in localStorage `ash-quiz.mode`, applied as `data-mode` on `<html>` before first paint by `public/mode-init.js` (a file, not an inline script: the CSP allows scripts from `'self'` only). `lib/mode.ts` is the store (`useMode`, `setMode`). `dark:` variants follow `data-mode`. Tokens have light values under `:root` and dark values under `:root[data-mode='dark']`, so most components need no `dark:` class at all.
- **Game themes**: `settings.theme` (`classic`, `arcade`, `sunset`, `mint`) is a quiz setting. `/play/$pin`, `/screen/$pin` and `/host/games/$pin` call `useGameTheme(snapshot.settings.theme)`, which sets `data-theme` on `<html>` (so dialogs and toasts in portals follow it). A theme only overrides `--hue`, `--hue-accent` and `--tint`; every token is computed from them, so both modes keep their contrast. Swatches for pickers come from `lib/themes.ts`, which mirrors the hues in `styles.css`.
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
