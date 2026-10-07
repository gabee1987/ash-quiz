import { z } from 'zod'
import { answerSchema } from './game.js'
import type { HostSnapshot, PlayerSnapshot } from './game.js'

// ---- Client -> server payloads (validated with zod on the server) --------

export const pinSchema = z.string().regex(/^[0-9]{6}$/)
export const playerNameSchema = z.string().trim().min(1).max(24)

export const playerJoinSchema = z.object({
  pin: pinSchema,
  name: playerNameSchema,
  teamId: z.string().min(1).optional(),
  /** Token from a previous join, used to reclaim the same player after a reconnect. */
  token: z.string().min(1).optional(),
})
export type PlayerJoin = z.infer<typeof playerJoinSchema>

export const playerAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: answerSchema,
})
export type PlayerAnswer = z.infer<typeof playerAnswerSchema>

export const hostCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start') }),
  z.object({ type: z.literal('next') }),
  z.object({ type: z.literal('skip') }),
  z.object({ type: z.literal('extendTime'), seconds: z.number().int().min(1).max(120) }),
  z.object({ type: z.literal('endQuestion') }),
  z.object({ type: z.literal('kick'), playerId: z.string().min(1) }),
  z.object({ type: z.literal('end') }),
])
export type HostCommand = z.infer<typeof hostCommandSchema>

// ---- Typed Socket.IO event maps -------------------------------------------

export interface ErrorPayload {
  /** i18n key, e.g. 'errors.gameNotFound'. Never a human-readable string. */
  error: string
}

export interface ClientToServerEvents {
  'player:join': (data: PlayerJoin, ack: (res: { token: string } | ErrorPayload) => void) => void
  'player:answer': (data: PlayerAnswer, ack: (res: { ok: true } | ErrorPayload) => void) => void
  'host:attach': (data: { pin: string }, ack: (res: { ok: true } | ErrorPayload) => void) => void
  'host:command': (data: HostCommand, ack: (res: { ok: true } | ErrorPayload) => void) => void
}

export interface ServerToClientEvents {
  'game:player': (snapshot: PlayerSnapshot) => void
  'game:host': (snapshot: HostSnapshot) => void
  'game:closed': (reason: ErrorPayload) => void
}
