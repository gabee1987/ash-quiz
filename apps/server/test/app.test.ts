import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'

const config = loadConfig({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  SESSION_SECRET: 'x'.repeat(32),
})

describe('app', () => {
  let built: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    built = await buildApp(config)
  })
  afterAll(async () => {
    await built.app.close()
  })

  it('answers the health check', async () => {
    const res = await built.app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
  })

  it('rejects an invalid environment', () => {
    expect(() => loadConfig({ NODE_ENV: 'test' })).toThrow(/DATABASE_URL/)
  })
})
