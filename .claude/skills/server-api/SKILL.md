---
name: server-api
description: Fastify, auth, session, Drizzle and migration conventions for apps/server. Load when adding HTTP routes, touching the database schema, sessions, login, quiz CRUD, image upload or results export.
---

# Server API

## Layout

```
apps/server/src
  app.ts            buildApp(config, deps): registers plugins, routes, sockets
  config.ts         env parsing (zod), fails fast
  db/schema.ts      Drizzle tables
  db/index.ts       createDb(url)
  auth/             password hashing, session create/verify, preHandler
  routes/           one file per resource: auth.ts, quizzes.ts, images.ts, games.ts, results.ts
  game/             pure engine (see game-engine skill)
  realtime/         sockets, game manager (see realtime skill)
  scripts/seed.ts   creates the first admin user and a sample quiz
```

`buildApp` takes its dependencies (`db`, `gameManager`) as arguments so tests can inject fakes or a test database. Nothing reads `process.env` outside `config.ts`.

## Routes

All under `/api`. JSON in, JSON out. Bodies and params are parsed with Zod schemas from `@ash-quiz/shared` where one exists, otherwise a local schema in the route file. A parse failure returns `400 { error: 'errors.invalidInput', issues }`.

Error shape everywhere: `{ error: '<i18n key>' }`. Status codes: 400 invalid input, 401 not logged in, 403 not owner, 404 not found, 409 conflict (e.g. username taken), 429 rate limited.

| Method and path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/login` | - | `{ username, password }` -> sets session cookie, returns `{ user }` |
| `POST /api/auth/logout` | session | clears cookie |
| `GET /api/auth/me` | session | `{ user }` or 401 |
| `GET /api/quizzes` | session | list own quizzes (id, title, questionCount, updatedAt) |
| `POST /api/quizzes` | session | create from `quizInputSchema` |
| `GET /api/quizzes/:id` | owner | full quiz |
| `PUT /api/quizzes/:id` | owner | replace from `quizInputSchema` |
| `DELETE /api/quizzes/:id` | owner | |
| `POST /api/images` | session | multipart, returns `{ id }` |
| `GET /api/images/:id` | - | image bytes, long cache headers |
| `POST /api/games` | session | `{ quizId, settings }` -> creates lobby, returns `{ pin }` |
| `GET /api/games` | session | own games (gameId, pin, quiz title, mode, phase, player count, dates) |
| `GET /api/games/:gameId/results` | owner | full results JSON |
| `GET /api/games/:gameId/results.csv?lang=hu\|en` | owner | CSV export |
| `DELETE /api/games/:gameId` | owner | delete a finished game and its results |

Quiz question ids and option ids are generated server-side with `nanoid(8)` when missing, so the editor can send new questions without ids.

## Auth and sessions

- Passwords hashed with `@node-rs/argon2` (defaults). Minimum length 10, no other complexity rules.
- Session token: 32 random bytes, base64url, in an `httpOnly`, `sameSite=lax`, `secure` (production) cookie named `ash_session`, 30 days. The DB stores the SHA-256 of the token.
- `requireSession` preHandler loads the user onto `request.user`. Expired sessions are deleted on sight.
- Login is rate limited to 10 attempts per minute per IP. Failed login returns `401 { error: 'errors.invalidCredentials' }` regardless of whether the user exists.
- Users are created by the seed script or by an admin via `POST /api/users` (admin only, phase 6). No self-registration.
- Keep `users` free of personal data: username only. Future SSO adds an `oidc_identities` table; do not add provider columns to `users`.

## Database

- Drizzle with the `postgres` driver. Schema in `db/schema.ts`, migrations generated with `pnpm --filter @ash-quiz/server db:generate` into `apps/server/drizzle/`, applied with `db:migrate`. Never edit a generated migration that has been applied; add a new one.
- Migrations run automatically at server start in production (`migrate()` from `drizzle-orm/postgres-js/migrator`) so Railway/Render deploys need no extra step.
- Queries live in the route or manager that uses them. No repository layer.
- JSON columns are typed with `$type<>()` from shared types and validated with Zod on write.
- Images: accept `image/jpeg`, `image/png`, `image/webp` up to 5 MB, resize with `sharp` to max 1280 px on the long edge, store as WebP. Reject anything else with 400.

## Results and retention

Results are derived from the persisted `games.state` (player answers and scores), never stored twice. A daily job deletes finished games older than `RESULTS_RETENTION_DAYS` (default 90) in line with data minimisation.
