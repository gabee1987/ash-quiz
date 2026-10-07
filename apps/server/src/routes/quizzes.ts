import { quizInputSchema, type QuizInput } from '@ash-quiz/shared'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { nanoid } from 'nanoid'
import { requireSession } from '../auth/require-session.js'
import type { Db } from '../db/index.js'
import { quizzes } from '../db/schema.js'
import { parseOr400 } from './http.js'

/** Gives every question and option without an id a fresh `nanoid(8)`, so the editor can send new items without ids. */
export function assignIds(body: unknown): unknown {
  if (typeof body !== 'object' || body === null || !Array.isArray((body as { questions?: unknown }).questions)) {
    return body
  }
  const withId = (item: unknown) =>
    typeof item === 'object' && item !== null && !(item as { id?: unknown }).id ? { ...item, id: nanoid(8) } : item
  const questions = (body as { questions: unknown[] }).questions.map((q) => {
    const question = withId(q)
    if (typeof question !== 'object' || question === null) return question
    const options = (question as { options?: unknown }).options
    return Array.isArray(options) ? { ...question, options: options.map(withId) } : question
  })
  return { ...body, questions }
}

type QuizRow = typeof quizzes.$inferSelect

function toQuiz(row: QuizRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    questions: row.questions,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function quizRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const auth = { preHandler: requireSession(db) }

  /** Loads a quiz the current user owns, or answers 404 / 403 and returns null. */
  async function ownQuiz(id: string, userId: string, reply: FastifyReply): Promise<QuizRow | null> {
    const row = (await db.select().from(quizzes).where(eq(quizzes.id, id)))[0]
    if (!row) {
      void reply.code(404).send({ error: 'errors.notFound' })
      return null
    }
    if (row.ownerId !== userId) {
      void reply.code(403).send({ error: 'errors.forbidden' })
      return null
    }
    return row
  }

  function parseQuiz(body: unknown, reply: FastifyReply): QuizInput | null {
    return parseOr400(quizInputSchema, assignIds(body), reply)
  }

  app.get('/api/quizzes', auth, async (request) => {
    const rows = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        questionCount: sql<number>`jsonb_array_length(${quizzes.questions})`.mapWith(Number),
        updatedAt: quizzes.updatedAt,
      })
      .from(quizzes)
      .where(eq(quizzes.ownerId, request.user!.id))
      .orderBy(desc(quizzes.updatedAt))
    return { quizzes: rows }
  })

  app.post('/api/quizzes', auth, async (request, reply) => {
    const input = parseQuiz(request.body, reply)
    if (!input) return reply
    const [row] = await db
      .insert(quizzes)
      .values({ id: nanoid(12), ownerId: request.user!.id, ...input })
      .returning()
    return reply.code(201).send({ quiz: toQuiz(row!) })
  })

  app.get<{ Params: { id: string } }>('/api/quizzes/:id', auth, async (request, reply) => {
    const row = await ownQuiz(request.params.id, request.user!.id, reply)
    if (!row) return reply
    return { quiz: toQuiz(row) }
  })

  app.put<{ Params: { id: string } }>('/api/quizzes/:id', auth, async (request, reply) => {
    const row = await ownQuiz(request.params.id, request.user!.id, reply)
    if (!row) return reply
    const input = parseQuiz(request.body, reply)
    if (!input) return reply
    const [updated] = await db
      .update(quizzes)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(quizzes.id, row.id), eq(quizzes.ownerId, request.user!.id)))
      .returning()
    return { quiz: toQuiz(updated!) }
  })

  app.delete<{ Params: { id: string } }>('/api/quizzes/:id', auth, async (request, reply) => {
    const row = await ownQuiz(request.params.id, request.user!.id, reply)
    if (!row) return reply
    await db.delete(quizzes).where(eq(quizzes.id, row.id))
    return reply.code(204).send()
  })
}
