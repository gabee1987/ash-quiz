import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dummyHashPromise, verifyPassword } from '../auth/password.js'
import { requireSession } from '../auth/require-session.js'
import { SESSION_COOKIE, clearSessionCookie, createSession, destroySession, setSessionCookie } from '../auth/session.js'
import type { Db } from '../db/index.js'
import { localCredentials, users } from '../db/schema.js'
import { parseOr400 } from './http.js'

const loginSchema = z.object({
  username: z.string().trim().min(1).max(40),
  password: z.string().min(1).max(200),
})

export interface AuthRouteOptions {
  db: Db
  secureCookies: boolean
}

export async function authRoutes(app: FastifyInstance, { db, secureCookies }: AuthRouteOptions) {
  app.post(
    '/api/auth/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const body = parseOr400(loginSchema, request.body, reply)
      if (!body) return reply

      const rows = await db
        .select({ id: users.id, username: users.username, role: users.role, passwordHash: localCredentials.passwordHash })
        .from(users)
        .innerJoin(localCredentials, eq(localCredentials.userId, users.id))
        .where(eq(users.username, body.username))
      const row = rows[0]
      // Same work and same answer whether or not the user exists.
      const ok = await verifyPassword(row?.passwordHash ?? (await dummyHashPromise), body.password)
      if (!row || !ok) return reply.code(401).send({ error: 'errors.invalidCredentials' })

      const token = await createSession(db, row.id)
      setSessionCookie(reply, token, secureCookies)
      return { user: { id: row.id, username: row.username, role: row.role } }
    },
  )

  app.post('/api/auth/logout', { preHandler: requireSession(db) }, async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE]
    if (token) await destroySession(db, token)
    clearSessionCookie(reply, secureCookies)
    return reply.code(204).send()
  })

  app.get('/api/auth/me', { preHandler: requireSession(db) }, async (request) => ({ user: request.user }))
}
