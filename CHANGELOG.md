# Changelog

## Unreleased

### Design
- New design system: shadcn/ui components on Radix, design tokens for colours, radii and shadows, the Nunito font (served by the app itself), icons.
- Light, dark and system colour mode on every screen, chosen per device and remembered, applied before the page is drawn (no flash).
- Four game themes (Classic, Arcade, Sunset, Mint), set per quiz and overridable per game; phones, the projector and the host control follow the game's theme.
- New layout for hosts: sidebar on laptops, bottom tab bar on phones; restyled login, quiz list (cards), game history (table on laptops, cards on phones), results, users, password, editor forms and host control.
- Errors from the server that no form field causes are shown as toasts.
- Accessibility: visible focus rings, contrast checked automatically in both modes, reduced-motion setting respected.

### Fixes
- Rate limiting applies to API requests only. Static files were counted too, so many phones sharing one public IP (venue wifi with a cloud deployment) could get errors and a blank page while loading the app.

## 1.0.0 – 2026-10-07

First release.

### Playing
- Players join with a QR code or a 6-digit PIN and a nickname; up to 60 players per game.
- Question types: single and multiple choice, true/false, free text (automatic or host-graded), number with tolerance, poll; optional images.
- Individual and team mode; speed bonus; shuffled options.
- Reconnect and page reload keep the player's identity and score.
- Projector screen with QR code, live answer count, answer distribution, scoreboard and podium.

### Hosting
- Quiz editor with autosave, validation, phone preview and image upload.
- Game settings per quiz, overridable per game: when correct answers and the scoreboard are shown, answer button style, final results released by the host (projector and phones separately).
- Host control for laptop and phone: next question, scoreboard, +30 s, skip, end, remove player, grade free-text answers.
- Game history, results page (podium, per-question statistics, sortable player and team tables), CSV export for Excel, results summary on the projector.
- User management for administrators.

### Operations
- One Docker image (API, realtime and web app on one origin) with PostgreSQL; migrations run on start.
- Every game transition is persisted; a restart resumes running games.
- Graceful shutdown on SIGTERM; `/api/health` with database status and running game count.
- Automatic deletion of finished games after the retention period (default 90 days).
- Security headers and Content Security Policy, request size limits, rate-limited login.
- Load test (60 players, 20% reconnecting) and browser end-to-end test, both in the repository; the end-to-end test runs in CI against the Docker image.
