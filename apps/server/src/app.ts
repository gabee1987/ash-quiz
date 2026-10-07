import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { Server as SocketServer } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@ash-quiz/shared'
import type { Config } from './config.js'

export type AppSocketServer = SocketServer<ClientToServerEvents, ServerToClientEvents>

export async function buildApp(config: Config) {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'development'
        ? { level: 'info', transport: { target: 'pino-pretty' } }
        : { level: config.NODE_ENV === 'test' ? 'silent' : 'info' },
    trustProxy: true,
  })

  await app.register(cookie, { secret: config.SESSION_SECRET })
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' })

  app.get('/api/health', async () => ({ ok: true }))

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
