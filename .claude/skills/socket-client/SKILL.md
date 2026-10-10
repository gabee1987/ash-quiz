---
name: socket-client
description: The Quizmoo web socket client in apps/web/src/lib/socket.ts: connection store and statuses, rejoin on reconnect, seq ordering, clock offset, player tokens, answer retries and connection toasts. Load when touching the web side of sockets, reconnection, countdowns or sending answers.
---

# Web socket client (`apps/web/src/lib/socket.ts`)

The server side (rooms, snapshots, timers) is in the `realtime` skill.

- One `io()` instance per page, `autoConnect: false`, `transports: ['websocket', 'polling']`, reconnection on with `reconnectionDelayMax: 3000`.
- A small store (`useSyncExternalStore`) holds `{ status, since, attempts, player, host, clockOffset, closed }`. `status` is `idle` (no session) | `connecting` | `connected` | `reconnecting` | `offline` (from `navigator.onLine` and the `offline`/`online` events) | `closed` (session ended for good, `closed` holds the i18n key). `since` is when the status last changed; the connection bar shows the time since.
- `online` and `visibilitychange` (page visible) restart the connection at once instead of waiting for the backoff.
- On every `connect` (first and re-connects alike) the client re-sends its join or attach with the stored token. The session is "live" again once a snapshot arrives on the new connection.
- Every other emit in a session waits for that (up to 5 s, then `errors.connectionLost`): Socket.IO flushes events buffered while disconnected before the rejoin, and the server would reject them from an unknown socket.
- Snapshots with a lower `seq` than the held one are ignored.
- `lib/socket-toasts.ts` turns transitions into toasts: "Reconnected" after a drop, nothing on the first connect.
- `clockOffset = snapshot.serverNow - Date.now()` is updated on every snapshot; countdowns use `questionEndsAt - (Date.now() + clockOffset)`.
- Player tokens are kept in `localStorage` under `quizmoo.player.<pin>` as `{ token, name }`. Storage access is wrapped in try/catch.
- Answers go through `sendAnswer`: the option stays pending until `{ ok: true }` or a definitive error. A lost ack (or `errors.playerNotFound` from a socket that has not rejoined yet) is retried once while the question is still open; `errors.alreadyAnswered` on the retry counts as sent. When both fail the player gets `errors.answerNotSent` ("tap again") as a toast; never a silent loss.

## Open issue

A phone was once seen stuck on "Reconnecting" (reported during phase 14 testing). The details are not known yet; ask the user for steps, device and browser before changing reconnection code.
