# Feature backlog

Candidate features after the design phases (9 to 12). None is planned in detail yet: pick the ones wanted and a phase plan is written for each group, in the format of the other plans. Effort is a rough size: S (a day), M (a few days), L (a week or more). Every item keeps the existing rules: nickname only, server-authoritative state, same origin, i18n keys for errors.

## Playing

| Feature | Why | Effort | Notes |
|---|---|---|---|
| Answer streak bonus | Rewards consistency, standard in Kahoot | S | Engine only: `streak` per player, bonus per setting; shown on reveal |
| Partial-credit multiple choice ("some of these") | Several correct options where picking some is enough | M | New question type in the shared schema (keeps `multiple` as "all must be picked"); scoring option per question: same points for any correct pick, or points per correct option; wrong picks subtract or void, to decide; phone UI as multiple choice |
| Phone end-of-game answer review redesign | The current list on the podium screen is cramped: question, own answer, correct answer and points all in one small card | S | One card per question with the result colour as a stripe, the own answer and the correct answer on separate lines, collapsible per question; requested after phase 9 |
| Ordering question type ("put in order") | Common in Kahoot, good for process questions | M | New type in shared schema, engine scoring (exact or partial), drag on the phone (reuses phase 11 sortable), projector display |
| Slider or range question | Estimation questions with a visual answer | M | Like number with min/max/step and a slider input; distribution as a histogram |
| Avatars or emoji per player | Lobby and scoreboard feel personal | S | Chosen at join from a fixed set, stored on the player; no uploads |
| Nickname generator | Faster join, avoids rude names | S | Two-word generator in HU and EN; "surprise me" button |
| Nickname filter | Company events | S | Word list per language, server-side, i18n error |
| Player reactions | Audience energy between questions | M | Emoji burst on the projector; rate limited; not persisted |
| Sounds and music | Atmosphere | M | Needs licensed audio assets; opt-in on the projector only; phones silent by default |
| Practice mode (self-paced) | Training use, no host needed | L | Different flow: player advances alone, no projector; engine mostly reusable |

## Hosting

| Feature | Why | Effort | Notes |
|---|---|---|---|
| Pause game | Breaks, technical problems | M | Engine must shift `questionEndsAt`; needs phase 12's message system to tell players |
| Re-show an answered question | Discuss a question again, or recover from a projector problem | S | Host command `showQuestion(index)` that puts an already revealed question back on the projector and the phones in a read-only reveal state (no re-answering, no score change); requested after phase 9 |
| Play again with the same players | Second round at an event | S | New game from the same quiz, players' tokens re-join from the lobby link |
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

## Suggested first group (one phase, "Play features")

Streak bonus, ordering question, avatars, nickname generator and filter, play again. All are self-contained, mostly engine and schema work, and make the game noticeably richer for players.
