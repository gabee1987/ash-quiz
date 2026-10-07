# ASH Quiz

A live quiz for company events, in the style of Kahoot. The host shows the questions on a projector; up to 60 players answer on their phones after scanning a QR code or typing a 6-digit PIN and a nickname. No player accounts and no personal data beyond the nickname. The interface is in Hungarian and English.

- **Hosts** log in, build quizzes in an editor (single and multiple choice, true/false, free text, number, poll, images), run games from a laptop or phone, and review the results afterwards (podium, per-question statistics, CSV export).
- **Players** need only a browser. A dropped connection or a reloaded page rejoins the game with the same score.
- **Options per quiz**: individual or team mode, correct answers after each question or only at the end, scoreboard after each question or on demand, final results released by the host, plain or colourful answer buttons on phones.

One Node.js process serves the API, the realtime connection (Socket.IO) and the web app from the same address; PostgreSQL stores everything, including running games, so a restart resumes them.

## Documentation

| Document | For |
|---|---|
| [docs/event-checklist.md](docs/event-checklist.md) | The host on the day of an event |
| [docs/deploy.md](docs/deploy.md) | Running it on a laptop at the venue, on Railway or on Render, environment variables, first admin |
| [docs/security-notes.md](docs/security-notes.md) | Security controls, dependency audit and documented exceptions |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [docs/plans](docs/plans) | How it was built, phase by phase |

## Run it with Docker (quickest)

Requires Docker Desktop.

```powershell
Copy-Item .env.example .env        # then set SESSION_SECRET to a long random string
docker compose up -d --build
docker compose exec -e SEED_ADMIN_USERNAME=admin -e SEED_ADMIN_PASSWORD=<at least 10 characters> app node apps/server/dist/seed.js
```

Open <http://localhost:3000/login> and log in with that account. The seed also creates a sample quiz. To let phones on the same wifi join, set `APP_ORIGIN` in `.env` to `http://<laptop IP>:3000` (see [docs/deploy.md](docs/deploy.md)).

## Develop

Requires Node.js 22 or later, pnpm 12 and Docker (for PostgreSQL).

```powershell
pnpm install
pnpm db:up                                   # PostgreSQL in Docker
Copy-Item .env.example .env                  # set SESSION_SECRET
pnpm --filter @ash-quiz/server db:migrate
$env:SEED_ADMIN_USERNAME="admin"; $env:SEED_ADMIN_PASSWORD="<at least 10 characters>"; pnpm --filter @ash-quiz/server seed
pnpm dev                                     # API on :3000, web app on http://localhost:5173
```

`pnpm dev:lan` does the same but prints an address phones on the same wifi can open.

| Command | What it does |
|---|---|
| `pnpm verify` | Typecheck, unit and API tests, build. Must pass before every merge. |
| `$env:TEST_DATABASE_URL="postgres://ashquiz:ashquiz@localhost:5432/ashquiz"; pnpm --filter @ash-quiz/server test` | Server tests including the database suites (they create and drop their own databases) |
| `$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e` | Browser end-to-end test against a running app (default `http://localhost:3000`; set `E2E_BASE_URL` for another address). Uses the installed Chrome. |
| `$env:LOAD_TEST_USERNAME="admin"; $env:LOAD_TEST_PASSWORD="..."; pnpm load-test --players 60` | 60 simulated phones play a full game, 20% of them dropping and reconnecting; fails if a player is lost or broadcasts exceed 200 ms. `--url` for another server. |

### Layout

```
apps/server     Fastify API, Socket.IO, game engine (pure functions in src/game), Drizzle/PostgreSQL
apps/web        React app: player, host, editor, projector screens (Vite, TanStack Router, Tailwind)
packages/shared Zod schemas and types shared by both
docs/           Deployment, event checklist, security notes, phase plans
```

Working agreements for contributors (and coding agents) are in [AGENTS.md](AGENTS.md).

## Data protection

Players enter a nickname only; no e-mail, device identifier or IP address is stored. Hosts have a username and password, nothing else. Finished games, with the nicknames and answers in them, are deleted automatically after `RESULTS_RETENTION_DAYS` (default 90). No third-party services are used beyond the hosting provider and PostgreSQL; a cloud host requires a compliance review before use in client or government projects (see [docs/deploy.md](docs/deploy.md)).
