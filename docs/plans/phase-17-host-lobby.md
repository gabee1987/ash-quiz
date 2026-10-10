# Phase 17: Host lobby

**Branch:** `feature/host-lobby` (from `develop`, after phase 16)
**Commit:** `Rebuild the host lobby around the QR code`
**Skills to load:** `web-ui`, `game-screens`, `design-system`, `motion`, `i18n`, `browser-checks`, `verification`, `git-workflow`

## Goal

While players join, the host's screen is one composition around the QR code instead of stacked panels: the way in (QR code, PIN, join link) is the centre, the players appear around it as they arrive, and Start is where the eye goes next. Web only: no schema, engine or server change.

## Scope

In:
- **Join stage.** One card with a large QR code, the PIN in big digits, the join link and "Open projector". On a laptop the QR code is next to the PIN; on a phone they stack, with the QR code smaller so Start is reachable without much scrolling.
- **Players as tiles.** In the lobby the players show as a grid of avatar tiles with their names (no scores, which are all 0), offline players dimmed with how long they have been away, and a small remove button per tile (with the same confirmation as today). New tiles pop in. With no players, a friendly waiting state. In team mode the tiles are grouped by team with a count per team.
- **Start next to the players.** The primary Start button (with the player count) sits under the players; "End game" stays as a smaller secondary action. The message box stays available below.
- **Nothing that means nothing.** The review panel (standings of zeros, no questions yet) is hidden in the lobby.
- Other phases keep today's layout.

Out: the projector's lobby, the phone lobby, other host phases, server changes.

## Files

```
apps/web/src/features/host/host-lobby.tsx                 layout of the lobby phase
apps/web/src/features/host/lobby-players.tsx              tiles, waiting state, remove
apps/web/src/features/host/lobby-groups.ts (+ test)       players grouped by team
apps/web/src/features/host/settings-line.ts               settings summary, shared with the header
apps/web/src/routes/host/games.$pin.tsx                   lobby phase uses HostLobby
apps/web/src/i18n/hu.json, en.json
```

## Steps

1. **Before screenshots** of the lobby, empty and with seven players (one offline), laptop and phone. Check: pictures taken.
2. **Grouping helper.** `lobby-groups.test.ts`: classic mode one group in join order; team mode one group per team in the teams' order, empty teams kept, counts. Check: `vitest run`.
3. **Lobby layout and tiles.** Check: screenshots empty and full, laptop and phone, light and dark; Start, remove and the message box still work.
4. **Final pass.** e2e specs (several start from the host lobby), `pnpm verify`, changelog, backlog.

## Done when

- On a laptop the QR code, PIN and players are visible without scrolling in the lobby.
- Players show as tiles without scores; offline players are dimmed; remove asks first.
- Team mode groups the tiles by team.
- The review panel is not shown in the lobby.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

## Manual test list (draft)

1. Start a game on a laptop. Expected: the QR code and PIN big in one card, a waiting message where the players will be, no standings table.
2. Join with two phones. Expected: a tile pops in for each player with avatar and name.
3. Close one phone. Expected: its tile dims and shows how long it has been offline.
4. Remove a player from their tile. Expected: a confirmation first; the tile disappears.
5. Start a team game and join one phone per team. Expected: tiles grouped under the team names with counts.
6. Open the host control on a phone. Expected: PIN, a smaller QR code, then Start and the players.

## Results

- `src/features/host/lobby-groups.test.ts` (4 cases): one group in classic mode in the given order, one group per team in the teams' order, a team nobody joined is kept, an empty classic lobby.
- Screens checked through the dev server: the lobby empty and with seven players (one offline) on a laptop and a phone, classic mode in light and team mode in dark. On the laptop the QR code, PIN and all players fit without scrolling; the phone page went from 2,298 to 1,686 px with seven players.
- All 9 e2e specs pass on the production build. `connection.e2e.ts` and `play-features.e2e.ts` first failed because the "1 / 1 connected" badge was gone from the lobby; it is back in the join card.

## Deviations

- **Start has no player count** on it ("Start", not "Start · 7 players"): the count is right below it in the players heading.
- **The players heading shows only the count**; online/total moved into the join card's badge, which the e2e specs and the old header used.
- **The lobby renders its own Start and End game** instead of the shared `Controls`, so that End game can sit at the bottom; `Controls` lost its "no players yet" line, which only the lobby showed (the tile area's waiting state says it now).
- **An empty team lobby shows the general waiting state**, not the empty teams; the teams appear with the first player.
- **Found, not fixed:** the admin names page nests a list inside a paragraph (React's development build reports it; production is unaffected). Added to the backlog.
