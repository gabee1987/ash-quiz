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

- Tailwind utility classes only, tokens in `styles.css` `@theme`. No CSS modules, no component library. Shared primitives in `src/components/`: `Button`, `Card`, `TextField`, `Timer`, `OptionButton`, `QrCode`, `Spinner`.
- Function components, hooks for logic, no class components, no default exports except route files.
- Files kebab-case, components PascalCase. One component per file unless a tiny private helper.
- Icons: inline SVG in `src/components/icons.tsx`. No icon library.
- Every text through `t('...')` (see `i18n` skill).

## Tests

Vitest with `@testing-library/react` and `happy-dom` for logic-bearing components only: the timer hook, the socket store, the answer normaliser mirror if one exists, the editor's question validation. Playwright end-to-end lives in `apps/web/e2e` (phase 8).
