import { buildApp } from '../../src/app.js'
import { loadConfig } from '../../src/config.js'
import type { Db } from '../../src/db/index.js'

export const testConfig = loadConfig({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://unused:unused@localhost:5432/unused',
  SESSION_SECRET: 'x'.repeat(32),
})

export function buildTestApp(db: Db) {
  return buildApp(testConfig, { db })
}

type InjectResponse = { cookies: { name: string; value: string }[] }

/** `cookie` header value carrying the session cookie from a login response. */
export function sessionCookie(res: InjectResponse): string {
  const cookie = res.cookies.find((c) => c.name === 'ash_session')
  if (!cookie) throw new Error('no session cookie in response')
  return `ash_session=${cookie.value}`
}
