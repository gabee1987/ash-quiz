import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import type { Db } from '../src/db/index.js'

const config = loadConfig({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  SESSION_SECRET: 'x'.repeat(32),
})

describe('app', () => {
  let built: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    // The health check and config tests never query, so a stub db is enough.
    built = await buildApp(config, { db: {} as Db })
  })
  afterAll(async () => {
    await built.app.close()
  })

  it('answers the health check', async () => {
    const res = await built.app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
  })

  it('treats empty seed variables as unset', () => {
    const parsed = loadConfig({
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      SESSION_SECRET: 'x'.repeat(32),
      SEED_ADMIN_USERNAME: '',
      SEED_ADMIN_PASSWORD: '',
    })
    expect(parsed.SEED_ADMIN_USERNAME).toBeUndefined()
    expect(parsed.SEED_ADMIN_PASSWORD).toBeUndefined()
    expect(parsed.RESULTS_RETENTION_DAYS).toBe(90)
  })

  it('rejects an invalid environment', () => {
    expect(() => loadConfig({ NODE_ENV: 'test' })).toThrow(/DATABASE_URL/)
  })
})
