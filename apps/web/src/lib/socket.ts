import type { ClientToServerEvents, HostSnapshot, PlayerSnapshot, ServerToClientEvents } from '@ash-quiz/shared'
import { useSyncExternalStore } from 'react'
import { io, type Socket } from 'socket.io-client'

// One socket per page. Game screens render the latest snapshot from this store
// and never keep their own copy of game state.

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting'

export interface GameStoreState {
  status: ConnectionStatus
  player: PlayerSnapshot | null
  host: HostSnapshot | null
  /** serverNow - Date.now(), refreshed on every snapshot. */
  clockOffset: number
  /** i18n key when the session ended for good (kicked, game gone). */
  closed: string | null
}

const initial: GameStoreState = { status: 'idle', player: null, host: null, clockOffset: 0, closed: null }

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelayMax: 3000,
})

let state = initial
const listeners = new Set<() => void>()
/** Re-sent on every (re)connect: join with the stored token, or host/screen attach. */
let attach: (() => Promise<void>) | null = null

function set(patch: Partial<GameStoreState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

socket.on('connect', () => {
  set({ status: 'connected' })
  void attach?.()
})
socket.on('disconnect', (reason) => {
  if (!attach) return set({ status: 'idle' })
  set({ status: 'reconnecting' })
  // The client does not retry by itself after a server-side disconnect.
  if (reason === 'io server disconnect') socket.connect()
})
socket.io.on('reconnect_attempt', () => {
  if (attach) set({ status: 'reconnecting' })
})
socket.on('game:player', (snapshot) => set({ player: snapshot, clockOffset: snapshot.serverNow - Date.now() }))
socket.on('game:host', (snapshot) => set({ host: snapshot, clockOffset: snapshot.serverNow - Date.now() }))
socket.on('game:closed', ({ error }) => closeSession(error))

// A locked phone may have dropped the connection silently; reconnect as soon as it is visible again.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && attach && !socket.connected) socket.connect()
  })
}

/** Starts a game session; returns the cleanup for useEffect. */
export function startSession(attachFn: () => Promise<void>): () => void {
  attach = attachFn
  set({ ...initial, status: socket.connected ? 'connected' : 'connecting' })
  if (socket.connected) void attachFn()
  else socket.connect()
  return () => {
    if (attach !== attachFn) return
    attach = null
    socket.disconnect()
    set(initial)
  }
}

/** Ends the session for good with a reason (i18n key); no automatic rejoin afterwards. */
export function closeSession(reason: string) {
  attach = null
  socket.disconnect()
  set({ closed: reason, status: 'idle' })
}

/** Connects if needed; resolves once connected or rejects with an i18n key. */
export function ensureConnected(timeoutMs = 5000): Promise<void> {
  if (socket.connected) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => done(new Error('errors.connectionLost')), timeoutMs)
    function done(error?: Error) {
      clearTimeout(timer)
      socket.off('connect', onConnect)
      if (error) reject(error)
      else resolve()
    }
    const onConnect = () => done()
    socket.on('connect', onConnect)
    socket.connect()
  })
}

type AckOf<E extends keyof ClientToServerEvents> = Parameters<Parameters<ClientToServerEvents[E]>[1]>[0]

/** Emits with an acknowledgement; a timeout resolves to `{ error: 'errors.connectionLost' }`. */
export async function emitAck<E extends keyof ClientToServerEvents>(
  event: E,
  data: Parameters<ClientToServerEvents[E]>[0],
): Promise<AckOf<E> | { error: string }> {
  try {
    const timed = socket.timeout(5000)
    // Socket.IO's typed overloads do not resolve through a generic event name. Keep `this` bound.
    const emit = (timed.emitWithAck as (event: string, data: unknown) => Promise<AckOf<E>>).bind(timed)
    return await emit(event, data)
  } catch {
    return { error: 'errors.connectionLost' }
  }
}

export function useGameStore(): GameStoreState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}
