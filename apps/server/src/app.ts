import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { Server as SocketServer } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@ash-quiz/shared'
import type { Config } from './config.js'
import type { Db } from './db/index.js'
import { authRoutes } from './routes/auth.js'
import { quizRoutes } from './routes/quizzes.js'

export type AppSocketServer = SocketServer<ClientToServerEvents, ServerToClientEvents>

export interface AppDeps {
  db: Db
}

export async function buildApp(config: Config, { db }: AppDeps) {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'development'
        ? { level: 'info', transport: { target: 'pino-pretty' } }
        : { level: config.NODE_ENV === 'test' ? 'silent' : 'info' },
    trustProxy: true,
  })

  await app.register(cookie, { secret: config.SESSION_SECRET })
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({ statusCode: 429, error: 'errors.rateLimited' }),
  })

  // Every error body is an i18n key; internals never reach the client.
  app.setErrorHandler((error: { statusCode?: number }, request, reply) => {
    const status = error.statusCode ?? 500
    if (status === 429) return reply.code(429).send({ error: 'errors.rateLimited' })
    if (status >= 400 && status < 500) return reply.code(status).send({ error: 'errors.invalidInput' })
    request.log.error(error)
    return reply.code(500).send({ error: 'errors.internal' })
  })

  app.decorateRequest('user', null)

  // Secure cookies need HTTPS; a laptop on the venue LAN serves plain http://<ip>:3000.
  const secureCookies = config.APP_ORIGIN.startsWith('https://')

  app.get('/api/health', async () => ({ ok: true }))
  await app.register(authRoutes, { db, secureCookies })
  await app.register(quizRoutes, { db })

  if (config.NODE_ENV === 'production') {
    const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist')
    await app.register(fastifyStatic, { root: webDist, wildcard: false })
    // SPA fallback: every non-API route serves index.html.
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/') || req.url.startsWith('/socket.io/')) {
        return reply.code(404).send({ error: 'notFound' })
      }
      return reply.sendFile('index.html')
    })
  }

  const io: AppSocketServer = new SocketServer(app.server, {
    // Always same-origin: Vite proxies /socket.io in development, Fastify serves the SPA in production.
    pingInterval: 10_000,
    pingTimeout: 20_000,
  })
  app.addHook('onClose', async () => {
    io.close()
  })

  return { app, io }
}
