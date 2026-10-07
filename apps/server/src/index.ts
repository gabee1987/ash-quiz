import { buildApp } from './app.js'
import { loadConfig } from './config.js'
import { createDb } from './db/index.js'
import { runMigrations } from './migrate.js'
import { GameManager } from './realtime/game-manager.js'
import { createGameStore } from './realtime/persist.js'
import { scheduleRetention } from './retention.js'
import { closeResources, shutdownHandler } from './shutdown.js'

const config = loadConfig()
const { db, close } = createDb(config.DATABASE_URL)
// Production deploys (Railway, Render, Docker) migrate on start; development uses `pnpm db:migrate`.
if (config.NODE_ENV === 'production') await runMigrations(db)

// Structured logs through the app's logger (called only once the app exists).
const manager = new GameManager(createGameStore(db), { error: (obj, msg) => app.log.error(obj, msg) })
const { app } = await buildApp(config, { db, manager })
const restored = await manager.restore()
if (restored > 0) app.log.info({ restored }, 'restored running games')
const stopRetention = scheduleRetention(db, {
  days: config.RESULTS_RETENTION_DAYS,
  onDeleted: async (ids) => {
    for (const id of ids) await manager.discard(id)
  },
  log: app.log,
})
app.addHook('onClose', () => closeResources({ stopJobs: stopRetention, manager, closeDb: close }))
const shutdown = shutdownHandler(app, { log: app.log })
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.once(signal, () => void shutdown(signal))

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
