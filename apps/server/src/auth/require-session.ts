import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Db } from '../db/index.js'
import { SESSION_COOKIE, verifySession, type SessionUser } from './session.js'

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser | null
  }
}

/** preHandler: loads the session user onto `request.user` or answers 401. */
export function requireSession(db: Db) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[SESSION_COOKIE]
    const user = token ? await verifySession(db, token) : null
    if (!user) return reply.code(401).send({ error: 'errors.unauthorized' })
    request.user = user
  }
}
