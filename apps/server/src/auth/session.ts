import { createHash, randomBytes } from 'node:crypto'
import { and, eq, ne } from 'drizzle-orm'
import type { FastifyReply } from 'fastify'
import type { Db } from '../db/index.js'
import { sessions, users } from '../db/schema.js'

export const SESSION_COOKIE = 'ash_session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface SessionUser {
  id: string
  username: string
  role: 'admin' | 'editor'
  mustChangePassword: boolean
}

/** The database only stores the SHA-256 of the cookie token. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(db: Db, userId: string, now = Date.now()): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt: new Date(now + SESSION_TTL_MS) })
  return token
}

/** Returns the user for a valid token; deletes the session if it has expired. */
export async function verifySession(db: Db, token: string, now = Date.now()): Promise<SessionUser | null> {
  const id = hashToken(token)
  const rows = await db
    .select({
      expiresAt: sessions.expiresAt,
      id: users.id,
      username: users.username,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
  const row = rows[0]
  if (!row) return null
  if (row.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, id))
    return null
  }
  return { id: row.id, username: row.username, role: row.role, mustChangePassword: row.mustChangePassword }
}

/** Ends every session of a user except `keepToken` (after a password change). */
export async function destroyOtherSessions(db: Db, userId: string, keepToken: string): Promise<void> {
  await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, hashToken(keepToken))))
}

export async function destroySession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)))
}

export function setSessionCookie(reply: FastifyReply, token: string, secure: boolean) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearSessionCookie(reply: FastifyReply, secure: boolean) {
  reply.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure, path: '/' })
}
