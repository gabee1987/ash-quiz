---
name: realtime
description: Socket.IO conventions for ASH Quiz in apps/server/src/realtime and the web socket client: rooms, join and reconnect by token, snapshot broadcasting, server-side timers, persistence and restore. Load when touching sockets, the game manager, timers or reconnection.
---

# Realtime layer

The engine decides, the realtime layer executes. `apps/server/src/realtime` owns the in-memory registry of running games, the socket handlers, the question timers and persistence.

## Game manager

`GameManager` holds `Map<pin, GameState>` plus one timer per game. Public methods wrap engine commands:

```
apply(pin, (state, now) => newState)   // run command, then broadcast, then persist
```

Order inside `apply`: run engine command (may throw `EngineError`), replace in map, reschedule the timer if `questionEndsAt` changed, broadcast snapshots, persist to Postgres (awaited, errors logged and retried once, never thrown to the client). Broadcast before persist so a slow DB never delays the game.

Timers: one `setTimeout` per game for `questionEndsAt - now`. On fire, call `endQuestion`. Clear on phase change, `extendTime`, `skip`, `end`. Timers are not persisted; `restoreGames()` on boot recomputes them from `questionEndsAt`, firing immediately for games whose deadline passed while the server was down.

Restore on boot: load games where `phase != 'finished'` and `created_at` is within 12 hours, mark every player `connected: false`, re-arm timers. Older unfinished games are marked finished.

Game lifetime: a finished game stays in memory for 1 hour so late reconnects still see the podium, then is dropped from the map (the DB row stays).

## Rooms and identity

- `game:<pin>:players`, `game:<pin>:host`, `game:<pin>:screen`.
- `socket.data` carries `{ pin, playerId }` for players or `{ pin, role: 'host' | 'screen' }`.
- A player is identified by their token, never by socket id. `player:join` with a valid token reclaims the existing player even if the name differs; the stored name wins. Without a token it is a fresh join, which the engine allows only in the lobby.
- Two sockets with the same token (phone and tablet) are allowed; both receive snapshots. `connected` is true while at least one is open.
- `host:attach` requires a valid session cookie whose user is the game's host (parse the cookie from `socket.handshake.headers.cookie`). `screen:attach` is public read-only by pin: the projector laptop is not logged in.
- On `disconnect`: `disconnectPlayer` only if no other socket of that player remains in the room.

## Snapshots

Every `apply` broadcasts: `game:host` to the host and screen rooms, and one `game:player` per connected player socket (snapshots differ per player). Build them with the engine's snapshot functions; never hand-assemble.

A freshly attached socket receives its snapshot in the ack path immediately after joining the room, so reconnection needs no extra event.

## Payload validation

Every incoming event body is parsed with the shared Zod schema first. Parse failures ack `{ error: 'errors.invalidInput' }`. `EngineError` acks `{ error: code }`. Anything else is logged and acked `{ error: 'errors.internal' }`. Handlers never throw into Socket.IO.

Rate limit: a player socket may send at most 10 events per second; beyond that, events are dropped and the socket is disconnected after a warning log.

## Web client (`apps/web/src/lib/socket.ts`)

- One `io()` instance per page, `autoConnect: false`, `transports: ['websocket', 'polling']`, reconnection on with `reconnectionDelayMax: 3000`.
- A small store (`useSyncExternalStore`) holds `{ status: 'connecting' | 'connected' | 'reconnecting' | 'closed', snapshot, clockOffset }`.
- On every `connect` (first and re-connects alike) the client re-sends its join or attach with the stored token and swaps in the acked snapshot.
- `clockOffset = snapshot.serverNow - Date.now()` is updated on every snapshot; countdowns use `questionEndsAt - (Date.now() + clockOffset)`.
- Player tokens are kept in `localStorage` under `ash-quiz.player.<pin>` as `{ token, name }`. Storage access is wrapped in try/catch.
- Answer submission uses the ack. The UI shows "sent" only after `{ ok: true }`; a failed ack shows the translated error and re-enables the buttons unless the error is `errors.questionClosed`.
