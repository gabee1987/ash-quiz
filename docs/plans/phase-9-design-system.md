# Phase 9: Design system, themes, light and dark mode

**Branch:** `feature/design-system` (from `develop`)
**Commit:** `Add design system with shadcn primitives, themes and dark mode`
**Skills to load:** `web-ui`, `i18n`, `verification`, `git-workflow`

## Goal

Every screen of the app is built from one set of primitives and one set of design tokens, looks playful but clean, supports light and dark mode on phones and host screens, and lets the host pick a visual theme per quiz. This phase lays the foundation; the game screens get their animations in phase 10 and the editor its new layout in phase 11.

## Inspiration (reference only, nothing copied)

- Kahoot: full-bleed colour per answer, oversized shapes, a lobby that feels like a waiting room.
- Quizizz and Blooket: card-based host dashboard, rounded corners, soft shadows, badges.
- Mentimeter and Slido: calm host UI, high-contrast projector views.
- Duolingo: chunky buttons with a bottom "3D" edge, bouncy feedback, one rounded display font.

Direction: a rounded display font, saturated accents on neutral surfaces, 16 to 24 px corner radii, chunky buttons with a pressed state, generous spacing, no gradients heavier than a subtle two-stop surface wash.

## Scope

In:
- **shadcn/ui base.** `components.json`, `src/components/ui/*` (code copied into the repo, not a runtime dependency), `cn()` helper (`clsx` + `tailwind-merge`), `class-variance-authority`, the needed Radix primitives, `lucide-react` icons. A `@/` path alias for `apps/web` (shadcn requires it). Primitives installed: Button, Card, Input, Label, Textarea, Select, Switch, Checkbox, RadioGroup, Dialog, Sheet, Tabs, Badge, Tooltip, DropdownMenu, Skeleton, Separator, Progress, Sonner (toasts).
- **Tokens.** All colours, radii, shadows and font families as CSS variables in `styles.css`, exposed to Tailwind through `@theme inline`. Semantic names only (`--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--muted`, `--destructive`, `--success`, `--warning`, `--ring`, `--radius`), plus the six fixed answer-option colours with their on-colours.
- **Colour mode.** `light`, `dark`, `system`, persisted in localStorage `ash-quiz.mode`, applied as `data-mode` on `<html>` by an inline script in `index.html` before first paint (no flash). A toggle in the header on every screen, including play and screen. The `theme-color` meta follows the mode.
- **Game themes.** A new quiz setting `theme: 'classic' | 'arcade' | 'sunset' | 'mint'` (shared schema, default `classic`, overridable per game like the other settings). Applied as `data-theme` on the play, screen and host-control routes from the snapshot's settings. Each theme defines its token set for both modes. `classic` reproduces today's indigo look.
- **Typography.** Nunito (variable, Latin Extended for Hungarian accents) self-hosted via `@fontsource-variable/nunito`. No font CDN: players' phones must not call a third party (data minimisation, GDPR).
- **Shell.** New root layout: compact header with logo mark, language switch and mode toggle; host area gets a left sidebar on laptop and a bottom tab bar on phone (Quizzes, Games, Users, Account). Login page restyled.
- **Restyle with the primitives, no behaviour change:** login, host quiz list, game history, results page, users, password, join form, the connection bar, dialogs, the host control panels and the editor forms. Game-phase screens (play, screen) only pick up the tokens and font here; their layout and motion are phase 10.
- **Toasts.** Sonner mounted once in the root; `ApiError` mutations show a translated toast instead of inline text where no field is at fault. Socket toasts are phase 12.
- **Accessibility baseline.** Visible focus rings on every interactive element, 4.5:1 contrast for text in both modes (checked with an automated tool), `prefers-reduced-motion` respected by the primitives.
- **Docs.** Rewrite the "Components and style" section of the `web-ui` skill: primitives in `src/components/ui`, app components in `src/components`, tokens, modes, themes, icons via lucide, the `@/` alias. Remove the "no component library, no icon library" rule.

Out: animations beyond the primitives' built-in transitions (phase 10), editor layout (phase 11), new features, a theme editor, per-player theme choice (players follow the game theme), sounds.

## Third-party packages added

All are open-source npm packages bundled into the app; none calls a network service at runtime. Listed in the dependency section of `docs/security-notes.md`.

`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, the `@radix-ui/*` packages pulled in by the chosen primitives, `sonner`, `@fontsource-variable/nunito`, `@axe-core/playwright` (dev). `next-themes` is not used; a 40-line mode store replaces it.

## Files

```
apps/web/components.json
apps/web/src/components/ui/*.tsx                 shadcn primitives (generated, then edited for tokens)
apps/web/src/components/mode-toggle.tsx
apps/web/src/components/app-header.tsx
apps/web/src/components/host-nav.tsx
apps/web/src/lib/cn.ts
apps/web/src/lib/mode.ts + mode.test.ts          mode store (light/dark/system)
apps/web/src/lib/themes.ts                       theme ids, labels, preview swatches
apps/web/src/styles.css                          tokens, modes, themes, fonts
apps/web/index.html                              no-flash mode script, theme-color
apps/web/vite.config.ts, tsconfig.json           @/ alias
apps/web/src/routes/__root.tsx, host/route.tsx   shell
apps/web/src/routes/*.tsx                        restyle
apps/web/src/components/{button,text-field,dialog,spinner,connection-bar}.tsx   replaced by ui/* or rewritten on top of them
apps/web/src/features/host/game-settings-form.tsx theme picker with swatches
apps/web/e2e/a11y.e2e.ts
packages/shared/src/quiz.ts                      theme setting
.claude/skills/web-ui/SKILL.md
docs/security-notes.md, CHANGELOG.md
```

## Steps

1. **Baseline.** Run `pnpm --filter @ash-quiz/web build` and record the gzip sizes of the entry chunk and the `play.$pin` route chunk in this plan under a "Results" heading. Budget for the phase: at most +60 KB gzip on the player route. Check: numbers recorded.
2. **Alias and shadcn init.** Add `@/` to `tsconfig.json` and `vite.config.ts`; `pnpm dlx shadcn@latest init` with Tailwind v4, CSS variables on, neutral base colour; add the primitives listed in scope. Check: `pnpm typecheck` passes.
3. **Tokens, modes, fonts.** Replace the `@theme` block: semantic tokens with light and dark values under `:root` and `[data-mode="dark"]`, Nunito as `--font-sans`, radii and shadows. Inline no-flash script in `index.html`. `lib/mode.ts` store with `useMode()`; tests for storage, system fallback and the `matchMedia` listener. Check: `vitest run src/lib/mode.test.ts`; toggling in the browser changes every surface with no flash on reload.
4. **Game themes.** Add `theme` to `gameSettingsSchema` (default `classic`), the four theme token blocks under `[data-theme="..."]` (each overriding only hues so both modes keep working), swatch previews in `lib/themes.ts`, the picker in `game-settings-form.tsx` with `settings.theme.*` i18n keys. Apply `data-theme` on `/play/$pin`, `/screen/$pin` and `/host/games/$pin` from `snapshot.settings.theme`. Check: shared and server settings tests pass; a quiz saved before this phase loads as `classic`.
5. **Shell.** `app-header.tsx`, `host-nav.tsx` (sidebar at `lg:` and up, bottom tab bar below), root and host layouts. Check: manual at 375 px and 1280 px widths; keyboard navigation reaches every link.
6. **Restyle host pages.** Login, quiz list (cards with title, question count, mode badge, actions in a dropdown), history (table on laptop, cards on phone), results, users, password. Replace `button.tsx`, `text-field.tsx`, `dialog.tsx` with thin wrappers over `ui/*` or delete them and update the imports. Check: `pnpm --filter @ash-quiz/web test`; manual pass of every host page in both modes.
7. **Restyle join, host control and the editor forms with primitives,** keeping their structure. Game-phase screens get only tokens and font. Check: play a two-phone game end to end in both modes.
8. **Toasts.** Mount `<Toaster>` in the root; `useMutation` error handlers show `t(error.code)`. Check: a failed login shows a toast; a failed quiz save shows a toast and keeps the draft.
9. **Accessibility pass.** `a11y.e2e.ts` runs axe on login, quiz list, join, play lobby and projector lobby in both modes and fails on serious or critical violations. Check: `pnpm e2e` passes.
10. **Docs and skill.** Update the `web-ui` skill, `docs/security-notes.md` dependency list, `CHANGELOG.md` under an "Unreleased" heading. Check: read through.
11. **Final pass.** `pnpm verify`, `pnpm e2e` against the Docker image, bundle size recorded against the budget from step 1, the load test once (a design phase must not touch fan-out; this proves it).

## Done when

- Every screen uses the new primitives and tokens; no ad hoc `bg-white/10`-style surfaces remain (a grep for `white/` finds only the option-colour on-colours).
- Light, dark and system modes work on phones, host and projector with no flash on reload.
- A quiz can be given one of four themes and the play, screen and host-control views follow it.
- Contrast and axe checks pass in both modes.
- The player route chunk grew by at most 60 KB gzip; the load test still passes.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify; $env:TEST_DATABASE_URL="postgres://ashquiz:ashquiz@localhost:5432/ashquiz"; pnpm --filter @ash-quiz/server test
docker compose up -d --build --wait
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
$env:LOAD_TEST_USERNAME="admin"; $env:LOAD_TEST_PASSWORD="..."; pnpm load-test --players 60
```

## Manual test list (draft)

1. Open `/login` in light mode, switch to dark, reload. Expect the dark page to appear without a light flash.
2. Set the OS to dark and the app to "system". Expect the app to follow; switch the OS to light. Expect the app to follow without a reload.
3. On the quiz list, open a quiz's settings and pick "Arcade". Start a game. Expect the projector, the phone and the host control in the arcade palette, in both modes.
4. Open a quiz created before this phase. Expect it to run with the classic theme.
5. Tab through the host sidebar and the quiz list. Expect visible focus rings and a sensible order.
6. On a 375 px wide phone, open every host page. Expect no horizontal scroll and a bottom tab bar.
7. Enter a wrong password. Expect a toast with the translated error.
8. Run the Chrome Lighthouse accessibility audit on the join page in both modes. Expect no contrast failures.

## Results

Sizes are gzip, measured with `vite build` and a script that sums a route chunk, its static imports, the entry chunk and the CSS (what a phone downloads to show that route).

| Measure | Before (1.0.0) | After |
|---|---|---|
| Entry chunk with its imports | 151.3 KB | 175.4 KB |
| CSS | 6.0 KB | 12.4 KB |
| `/play/$pin` total | 177.5 KB | 210.2 KB (+32.7 KB, budget +60 KB) |
| `/screen/$pin` total | 187.0 KB | 219.2 KB |

Not counted above: the Nunito font. A Hungarian page loads the Latin and Latin Extended subsets (38 KB and 35 KB woff2), once per device thanks to the browser cache; `font-display: swap` shows text in the fallback font until they arrive.

Load test (60 players, 20% flapping, production bundle): PASS, fan-out max 8 ms, no answers missed.

## Deviations

- **No-flash script is a file, not inline.** The CSP allows scripts from `'self'` only, so the colour mode is applied by `public/mode-init.js`, loaded as a blocking classic script in `<head>`, instead of an inline script. Same effect, CSP unchanged.
- **`radix-ui` instead of separate `@radix-ui/*` packages.** The current shadcn CLI installs the combined `radix-ui` package; only the imported primitives end up in the bundle. `tw-animate-css` (CSS only) was added too: the primitives' enter and exit transitions depend on it.
- **Header switches are buttons, not menus.** The first build used Radix dropdown menus for language and colour mode in the header and put the player route at +64.8 KB, over budget. The header now has a two-button HU/EN switch and a mode button that cycles light, dark and system; `TooltipProvider` is not mounted until a page uses tooltips. Result: +32.7 KB.
- **Themes are applied on `<html>`, not on a route wrapper**, so dialogs and toasts rendered in portals follow the theme. The game routes set and remove `data-theme` with `useGameTheme`.
- **Dropdown, dialog and tooltip primitives** had hard-coded English "Close" labels; they now use `common.close`.
- **Rate limiting no longer covers static files** (`apps/server/src/app.ts`, test in `apps/server/test/app.test.ts`). Found while running the new accessibility spec: the global limit of 300 requests per minute per IP also counted the app's static files, so the end-to-end suite started getting 429s. The same limit would have hit an event using a cloud deployment, where all phones on the venue wifi share one public IP (60 phones × about 25 files per page load). Only `/api/` is limited now; the stricter login limit is unchanged. `buildApp` accepts an optional `webDist` so the test can serve a fixture directory. This is a fix to 1.0.0 behaviour, not part of the design work, and can be committed separately.
- **Duplicating a quiz already exists**: phase 11's plan lists `POST /api/quizzes/:quizId/duplicate` as new, but it is already implemented (with a translated "(copy)" title). Phase 11 should drop that item.
