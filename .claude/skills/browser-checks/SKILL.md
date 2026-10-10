---
name: browser-checks
description: How to check Quizmoo in a real browser: screenshots with Playwright scripts, the production build on port 3999 against the dev database, the e2e suite, and the stale dev-server traps while the user's dev:lan runs. Load before any screenshot, visual check or e2e run.
---

# Browser checks

UI changes are checked visually (AGENTS.md section 5). Unit tests do not show layout.

## Production build on :3999

The user's `dev:lan` usually holds :3000 and a Vite port, so checks run on a separate production build:

1. `pnpm build`.
2. From `apps/server`, with the variables from the root `.env` plus `NODE_ENV=production`, `PORT=3999` and `APP_ORIGIN=http://localhost:3999`: `node dist/index.js` in the background.
3. After every new web build, restart the :3999 process (it serves the built files it found at start).
4. Stop it when done: `Get-NetTCPConnection -LocalPort 3999 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`.

It uses the dev database, which is the user's data (see `database`).

## Screenshot scripts

- Playwright scripts (`.cjs`) live in the session scratchpad, never in the repo. Run them with Node and take `chromium` from `@playwright/test`, the only Playwright package installed (`require(require.resolve('@playwright/test', { paths: ['C:/Coding/quizmoo/apps/web'] }))`). Use the installed Chrome (`channel: 'chrome'`), as the e2e config does.
- Log in with the host account the user gave for testing; never write that password into a repo file.
- Each script creates its own quiz and games with a fixed prefix (e.g. "Shots p16") and deletes every quiz and game with that prefix in a `finally` block, also after a failure.
- Phone shots at 390 × 844, laptop at 1440 × 900, projector at 1920 × 1080; take both colour modes when colours changed. Assert the claim when there is one (e.g. "no scroll": `scrollHeight <= innerHeight`), then look at the picture.
- Selectors: `getByRole(..., { name, exact: true })`. Loose names match more than meant ("Pear" also matched "Appearance").
- Write scripts with the Write tool, not shell heredocs: backticks in a quoted `node -e` string get eaten, and `cat > file` can hang the shell.

## E2E suite

`apps/web/e2e/*.e2e.ts` against a running app (default `http://localhost:3000`, or `E2E_BASE_URL`):

```powershell
$env:E2E_BASE_URL="http://localhost:3999"; $env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

A failed run can leave "E2E" quizzes and games behind; delete them before rerunning. When a UI change moves something an e2e spec looks for (a tab, a dialog step), update the spec in the same change.

## The user's running dev servers

- Edit source files with the Edit/Write tools while `dev:lan` runs, never `sed -i` or `cat >` (see AGENTS.md learnings).
- After server edits check that the API on :3000 restarted after the last edit; after `styles.css` changes check that Vite serves the new classes (`curl -s localhost:<vite port>/src/styles.css | grep <class>`). If not, tell the user to restart `dev:lan`.
- Port 5173 can belong to another of the user's projects; read the port `dev:lan` printed.
