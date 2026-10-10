# Feature backlog

Candidate features after the design phases (9 to 12). None is planned in detail yet: pick the ones wanted and a phase plan is written for each group, in the format of the other plans. Effort is a rough size: S (a day), M (a few days), L (a week or more). Every item keeps the existing rules: nickname only, server-authoritative state, same origin, i18n keys for errors.

## Playing

| Feature | Why | Effort | Notes |
|---|---|---|---|
| Partial-credit multiple choice ("some of these") | Several correct options where picking some is enough | M | New question type in the shared schema (keeps `multiple` as "all must be picked"); scoring option per question: same points for any correct pick, or points per correct option; wrong picks subtract or void, to decide; phone UI as multiple choice |
| Slider or range question | Estimation questions with a visual answer | M | Like number with min/max/step and a slider input; distribution as a histogram |
| Player reactions | Audience energy between questions | M | Emoji burst on the projector; rate limited; not persisted |
| Sounds and music | Atmosphere | M | Needs licensed audio assets; opt-in on the projector only; phones silent by default |
| Practice mode (self-paced) | Training use, no host needed | L | Different flow: player advances alone, no projector; engine mostly reusable |

## Hosting

| Feature | Why | Effort | Notes |
|---|---|---|---|
| Question bank | Reuse questions across quizzes | L | New table, picker in the editor, tags |
| Import questions from CSV or Excel | Build quizzes outside the app | M | Column format documented; validation report |
| Quiz sharing between hosts | Team of organisers | M | Owner plus editors per quiz; permission checks on every route |
| PDF results report | Hand-out after the event | M | Server-side rendering; no third-party service |
| Projector branding | Company logo and event name on the lobby and podium | S | Upload once per host; shown by theme |
| Scheduled games and public lobby link | Pre-share the join link before the event | S | PIN reserved ahead; lobby opens at a time |

## Platform

| Feature | Why | Effort | Notes |
|---|---|---|---|
| Installable app (PWA) | Faster repeat joins, home screen icon | S | Manifest and a minimal service worker that does not cache the API or sockets |
| Admin dashboard | See running games, player counts, errors | M | Reuses `/api/health` data; admin only |
| Metrics endpoint | Operations in the cloud | S | Prometheus-style counters; protected |
| Password reset | Host forgot the password | M | Needs e-mail delivery, which is a third-party service (compliance review) or an admin-side reset link instead |
| Two-factor login for hosts | Security for public deployments | M | TOTP, no SMS |

## From the test notes (October 2026)

Collected while testing phases 9 to 12. Effort as above.

### Already done

- Bubble-gum press animations and playful details (phase 11 follow-up).
- Drag and drop for questions with a drag preview and a pop on landing (phase 11).
- Structured game settings: readable summary when collapsed, real collapse and expand controls, tabs instead of one long list (phase 11).
- Subdued themes and answer colours for company events (phase 11 follow-up).
- Custom drop-down lists (phase 11 follow-up).
- Pause on the projector's results summary (phase 11 follow-up).
- The quiz settings push the content aside instead of covering the phone preview (phase 11 follow-up).
- Sticky top bar in the quiz editor (phase 11 follow-up).
- Host messages fly in and out with an elastic animation, and the content below follows (phase 12 follow-up).
- Streak bonus, ordering question, avatars, nickname generator and filter, play again (phase 13).
- Pause and resume, host messages that leave by themselves, showing an answered question again, "Show podium" telling the host where it went, the selected-answer marker, the double scrollbar (phase 14).
- Phone game screens without the header, question images that fit, review cards, results summary, new game dialog in groups (phase 15).

### Open

| Task | Kind | Effort | Notes |
|---|---|---|---|
| Rooms with their own admin | Feature | L | Each room (workspace) has an admin; only its members see and edit its quizzes and games. Today every quiz and game belongs to one host account. Needs a rooms table, membership and roles, permission checks on every route and socket attach, migration of existing quizzes. |
| Play-through preview in the editor | Feature | M | The host plays the quiz on a phone-like frame (question, answer, reveal) without starting a game. Reuses the phone screens with a local fake snapshot; no server state. |
| Host lobby restructure | Design | M | The lobby screen of the host control (QR code, PIN, players, message box) as one composition around the QR code instead of stacked panels. |
| Host live dashboard and hints | Feature | L | One coherent view of the running game: answers in, who is stuck or offline, per-question stats, standings. Hints or messages to selected players (host-to-player messages were out of scope in phase 12). |
| Change answers until a deadline | Feature | M | A game mode where players can change their answer until the time is up (or an earlier deadline); the last answer counts, and the speed bonus uses its time or is turned off. |
| Join and login home screen redesign | Design | M | The join page (`/`) and the login page (`/login`) get a clearer structure with the cow logo and the app name big and centre stage, in a joyful, game-like style: a funny logo animation (blink, wobble, a "moo" bounce) and a livelier animated background. Must stay snappy: CSS keyframes on `transform` and `opacity` only, inline SVG logo (no image or animation library downloads), no layout shift, nothing that blocks typing the PIN, everything stopped under reduced motion. Check with a Lighthouse performance run on a throttled phone profile before and after. |
| Sounds for key moments | Feature | M | Short playful sounds for important events and messages, switched on per quiz. Generated in the browser (Web Audio) to avoid licensed audio files; projector only, phones silent by default. Same as the "Sounds and music" item above. |
