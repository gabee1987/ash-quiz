import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Db } from '../db/index.js'
import { SESSION_COOKIE, verifySession, type SessionUser } from './session.js'

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser | null
  }
}

interface Options {
  /** Allow users who still have to change their initial password (me, logout, password change). */
  allowPendingPasswordChange?: boolean
  /** Only admins. */
  admin?: boolean
}

/** preHandler: loads the session user onto `request.user`, or answers 401 / 403. */
export function requireSession(db: Db, { allowPendingPasswordChange = false, admin = false }: Options = {}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[SESSION_COOKIE]
    const user = token ? await verifySession(db, token) : null
    if (!user) return reply.code(401).send({ error: 'errors.unauthorized' })
    // Enforced here, not only in the UI: an initial password must be replaced before anything else.
    if (user.mustChangePassword && !allowPendingPasswordChange) {
      return reply.code(403).send({ error: 'errors.passwordChangeRequired' })
    }
    if (admin && user.role !== 'admin') return reply.code(403).send({ error: 'errors.forbidden' })
    request.user = user
  }
}
