import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { MIN_PASSWORD_LENGTH, dummyHashPromise, hashPassword, verifyPassword } from '../auth/password.js'
import { requireSession } from '../auth/require-session.js'
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  destroyOtherSessions,
  destroySession,
  setSessionCookie,
} from '../auth/session.js'
import type { Db } from '../db/index.js'
import { localCredentials, users } from '../db/schema.js'
import { parseOr400 } from './http.js'

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(200),
})

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
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
          mustChangePassword: users.mustChangePassword,
          passwordHash: localCredentials.passwordHash,
        })
        .from(users)
        .innerJoin(localCredentials, eq(localCredentials.userId, users.id))
        .where(eq(users.username, body.username))
      const row = rows[0]
      // Same work and same answer whether or not the user exists.
      const ok = await verifyPassword(row?.passwordHash ?? (await dummyHashPromise), body.password)
      if (!row || !ok) return reply.code(401).send({ error: 'errors.invalidCredentials' })

      const token = await createSession(db, row.id)
      setSessionCookie(reply, token, secureCookies)
      return {
        user: { id: row.id, username: row.username, role: row.role, mustChangePassword: row.mustChangePassword },
      }
    },
  )

  const pendingOk = { preHandler: requireSession(db, { allowPendingPasswordChange: true }) }

  app.post('/api/auth/logout', pendingOk, async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE]
    if (token) await destroySession(db, token)
    clearSessionCookie(reply, secureCookies)
    return reply.code(204).send()
  })

  app.get('/api/auth/me', pendingOk, async (request) => ({ user: request.user }))

  // Change own password. Clears the forced-change flag and signs out every other session.
  app.post(
    '/api/auth/password',
    { ...pendingOk, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const body = parseOr400(passwordChangeSchema, request.body, reply)
      if (!body) return reply
      const user = request.user!
      const current = (
        await db.select({ hash: localCredentials.passwordHash }).from(localCredentials).where(eq(localCredentials.userId, user.id))
      )[0]
      if (!current || !(await verifyPassword(current.hash, body.currentPassword))) {
        return reply.code(400).send({ error: 'errors.wrongCurrentPassword' })
      }
      if (body.newPassword === body.currentPassword) return reply.code(400).send({ error: 'errors.samePassword' })

      await db.transaction(async (tx) => {
        await tx
          .update(localCredentials)
          .set({ passwordHash: await hashPassword(body.newPassword), updatedAt: new Date() })
          .where(eq(localCredentials.userId, user.id))
        await tx.update(users).set({ mustChangePassword: false }).where(eq(users.id, user.id))
      })
      await destroyOtherSessions(db, user.id, request.cookies[SESSION_COOKIE]!)
      return { user: { ...user, mustChangePassword: false } }
    },
  )
}
