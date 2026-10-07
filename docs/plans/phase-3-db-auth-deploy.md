# Phase 3: Database, auth, deployment

**Branch:** `feature/db-auth-deploy` (from `develop`)
**Commit:** `feat(auth): add migrations, sessions, login and quiz API with Docker deploy`
**Skills to load:** `server-api`, `web-ui`, `i18n`, `verification`, `git-workflow`

## Goal

A deployable server with a real database: migrations, seeded admin user, login, quiz CRUD, and a login page. After this phase the app can be put on Railway or Render and HR can log in on a phone.

## Scope

In:
- Drizzle migrations generated from the existing schema, auto-applied in production.
- `createDb` wired into `buildApp` via a `deps` argument.
- Auth: argon2 hashing, sessions, `requireSession`, login/logout/me routes, rate limit on login.
- Quiz CRUD routes with ownership checks and server-side id assignment.
- Seed script: admin user from `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` env plus the fixture quiz.
- Web: `/login` page, `/host` layout route with auth guard, `/host` page listing quizzes (title, question count, updated date) with a logout button. No editor yet.
- Dockerfile, `.dockerignore`, `docker-compose.yml` extended with an `app` service, `docs/deploy.md` for Railway and Render and the laptop/LAN case.
- Test database support via `TEST_DATABASE_URL`.

Out: images, games API, user management UI, the editor.

## Files

```
apps/server/drizzle/0000_*.sql               generated
apps/server/src/auth/password.ts             hash, verify
apps/server/src/auth/session.ts              create, verify, destroy, cookie helpers
apps/server/src/auth/require-session.ts      preHandler
apps/server/src/routes/auth.ts
apps/server/src/routes/quizzes.ts
apps/server/src/scripts/seed.ts              pnpm --filter @ash-quiz/server seed
apps/server/src/migrate.ts                   runMigrations(db)
apps/server/test/helpers/test-db.ts          creates a schema per test file, drops after
apps/server/test/auth.test.ts
apps/server/test/quizzes.test.ts
apps/web/src/lib/api.ts                      apiFetch, ApiError
apps/web/src/routes/login.tsx
apps/web/src/routes/host/route.tsx           layout with auth guard
apps/web/src/routes/host/index.tsx           quiz list
Dockerfile, .dockerignore, docs/deploy.md
```

## Steps

1. **Config.** Add `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` (optional), `RESULTS_RETENTION_DAYS` (default 90) to `config.ts` and `.env.example`. Check: typecheck.
2. **Migrations.** Run `db:generate`, review the SQL, add `runMigrations` and call it from `index.ts` when `NODE_ENV=production`. Check: `pnpm db:up && pnpm --filter @ash-quiz/server db:migrate` creates the tables (`psql` or Drizzle Studio not required; a quick `SELECT` via a one-off `tsx` script is fine).
3. **Test DB helper.** `withTestDb()` creates schema `test_<random>`, runs migrations into it using `search_path`, returns `db` and a `cleanup`. Skips the suite with a visible message when `TEST_DATABASE_URL` is unset. Check: a trivial test inserts and reads a user.
4. **Dependency injection.** `buildApp(config, { db })`. Update `app.test.ts` to pass a stub `db` object (it does not query). Check: existing tests pass.
5. **Password and session.** Per the `server-api` skill. Tests: hash verifies, wrong password fails, session round trip, expired session rejected and deleted. Check: `vitest run test/auth.test.ts`.
6. **Auth routes.** Login, logout, me. Login rate limit 10/min per IP via `@fastify/rate-limit` route config. Tests: wrong password 401 with `errors.invalidCredentials`, correct login sets cookie and `me` returns the user, logout clears, 11th attempt in a minute is 429. Check: tests.
7. **Quiz routes.** CRUD with `quizInputSchema`, ids assigned with `nanoid(8)` where missing, owner-only access. Tests: create returns id, list shows only own quizzes (two users), get/put/delete by non-owner is 403, invalid body is 400 with `issues`. Check: `vitest run test/quizzes.test.ts`.
8. **Seed script.** Idempotent: creates admin if missing, creates the fixture quiz if the admin has no quizzes. Refuses to run without both env vars. Check: run twice, second run reports "nothing to do".
9. **Web login and host list.** `apiFetch`, `/login` form with translated validation and error display, `/host` layout guard using a `me` query and `redirect` to `/login`, `/host` list page with logout. i18n keys under `auth.*`, `host.*`, `common.*` in both languages. Check: `pnpm --filter @ash-quiz/web typecheck`, manual test.
10. **Docker.** Multi-stage Dockerfile: install with pnpm, build web and server, final image `node:22-alpine` with `apps/server/dist`, `apps/web/dist`, production `node_modules` only (`pnpm deploy --prod` or `--filter` install). `CMD node apps/server/dist/index.js`. Compose `app` service depends on `db`. Check: `docker compose up --build` serves the login page on `http://localhost:3000` and login works.
11. **Deploy doc.** `docs/deploy.md`: Railway (service from Dockerfile + Postgres plugin, env vars, `APP_ORIGIN`), Render (web service + Postgres, note the free-tier spin-down), laptop LAN (`docker compose up`, find the laptop IP, phones use `http://<ip>:3000`, note that the QR must use that origin). Check: read-through only.
12. **CI.** Confirm `.github/workflows/ci.yml` runs the DB tests with `TEST_DATABASE_URL` (already set there). Check: `pnpm verify` locally with the env var set.

## Done when

- `pnpm verify` passes with and without `TEST_DATABASE_URL`; without it the DB suites print as skipped.
- Fresh clone, `pnpm db:up`, `db:migrate`, `seed`, `pnpm dev`: login works at `http://localhost:5173/login` and the fixture quiz is listed.
- `docker compose up --build` gives the same on port 3000.
- No personal data columns were added to `users`.

## Verification command

```
pnpm verify && TEST_DATABASE_URL=postgres://ashquiz:ashquiz@localhost:5432/ashquiz pnpm --filter @ash-quiz/server test
```

## Manual test list (draft)

1. `pnpm db:up`, `pnpm --filter @ash-quiz/server db:migrate`, then seed with `SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD=<10+ chars>`. Expect "created admin" and "created sample quiz".
2. `pnpm dev`, open `http://localhost:5173/host` on the laptop. Expect redirect to `/login`.
3. Log in with a wrong password. Expect a translated error, no redirect.
4. Log in correctly. Expect the quiz list with the sample quiz and its question count.
5. Switch language to EN in the header. Expect all texts on the page to change, reload keeps EN.
6. Open the same URL on a phone on the same wifi using the laptop IP and port 5173. Expect the login page laid out for a phone, no horizontal scroll.
7. Log out. Expect redirect to `/login` and `/host` is protected again.
8. `docker compose up --build`, repeat steps 2 to 4 on port 3000.
