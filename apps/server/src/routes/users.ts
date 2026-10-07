import { asc } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { MIN_PASSWORD_LENGTH } from '../auth/password.js'
import { requireSession } from '../auth/require-session.js'
import { createUser } from '../auth/users.js'
import type { Db } from '../db/index.js'
import { users } from '../db/schema.js'
import { parseOr400 } from './http.js'

// Login names only: no e-mail addresses or other personal data in usernames.
const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
  role: z.enum(['admin', 'editor']).default('editor'),
})

export async function userRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const adminOnly = { preHandler: requireSession(db, { admin: true }) }

  app.get('/api/users', adminOnly, async () => {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        mustChangePassword: users.mustChangePassword,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.username))
    return { users: rows }
  })

  app.post('/api/users', adminOnly, async (request, reply) => {
    const body = parseOr400(createUserSchema, request.body, reply)
    if (!body) return reply
    try {
      // The initial password is known to the admin, so the new user must replace it.
      const user = await createUser(db, body.username, body.password, body.role, { mustChangePassword: true })
      return reply.code(201).send({ user: { ...user, mustChangePassword: true } })
    } catch (error) {
      if (isUniqueViolation(error)) return reply.code(409).send({ error: 'errors.usernameTaken' })
      throw error
    }
  })
}

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: unknown; cause?: { code?: unknown } }).code ?? (error as { cause?: { code?: unknown } }).cause?.code
  return code === '23505'
}
