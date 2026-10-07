import { gameSettingsSchema, pinSchema, type GameHostInfo, type GamePublicInfo } from '@ash-quiz/shared'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { requireSession } from '../auth/require-session.js'
import type { Db } from '../db/index.js'
import { quizzes } from '../db/schema.js'
import type { GameManager } from '../realtime/game-manager.js'
import { parseOr400 } from './http.js'

const createGameSchema = z.object({
  quizId: z.string().min(1),
  settings: gameSettingsSchema.default(gameSettingsSchema.parse({})),
})

export interface GameRouteOptions {
  db: Db
  manager: GameManager
  appOrigin: string
}

export async function gameRoutes(app: FastifyInstance, { db, manager, appOrigin }: GameRouteOptions) {
  const auth = { preHandler: requireSession(db) }

  app.post('/api/games', auth, async (request, reply) => {
    const body = parseOr400(createGameSchema, request.body, reply)
    if (!body) return reply
    // Team mode needs at least one team to pick when joining.
    if (body.settings.mode === 'team' && body.settings.teamNames.length === 0) {
      return reply.code(400).send({ error: 'errors.invalidInput' })
    }
    const quiz = (await db.select().from(quizzes).where(eq(quizzes.id, body.quizId)))[0]
    if (!quiz) return reply.code(404).send({ error: 'errors.notFound' })
    if (quiz.ownerId !== request.user!.id) return reply.code(403).send({ error: 'errors.forbidden' })

    const game = await manager.create({
      id: nanoid(12),
      // Frozen copy: later quiz edits do not affect a running game.
      quiz: { id: quiz.id, title: quiz.title, description: quiz.description, questions: quiz.questions },
      settings: body.settings,
      hostId: request.user!.id,
      quizId: quiz.id,
    })
    return reply.code(201).send({ pin: game.state.pin })
  })

  app.get<{ Params: { pin: string } }>('/api/games/:pin', auth, async (request, reply) => {
    const game = pinSchema.safeParse(request.params.pin).success ? manager.get(request.params.pin) : undefined
    if (!game) return reply.code(404).send({ error: 'errors.gameNotFound' })
    if (game.hostId !== request.user!.id) return reply.code(403).send({ error: 'errors.forbidden' })
    const { state } = game
    const info: GameHostInfo = {
      pin: state.pin,
      quizTitle: state.quiz.title,
      mode: state.settings.mode,
      phase: state.phase,
      joinUrl: `${appOrigin}/?pin=${state.pin}`,
    }
    return info
  })

  // Public: what the join page needs before a player picks a name. Nothing else leaks.
  app.get<{ Params: { pin: string } }>('/api/games/:pin/public', async (request, reply) => {
    const game = pinSchema.safeParse(request.params.pin).success ? manager.get(request.params.pin) : undefined
    if (!game) return reply.code(404).send({ error: 'errors.gameNotFound' })
    const { state } = game
    const info: GamePublicInfo = {
      quizTitle: state.quiz.title,
      mode: state.settings.mode,
      phase: state.phase,
      teams: Object.values(state.teams).map((t) => ({ id: t.id, name: t.name })),
    }
    return info
  })
}
