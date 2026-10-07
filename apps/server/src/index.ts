import { buildApp } from './app.js'
import { loadConfig } from './config.js'
import { createDb } from './db/index.js'
import { runMigrations } from './migrate.js'
import { GameManager } from './realtime/game-manager.js'
import { createGameStore } from './realtime/persist.js'

const config = loadConfig()
const { db, close } = createDb(config.DATABASE_URL)
// Production deploys (Railway, Render, Docker) migrate on start; development uses `pnpm db:migrate`.
if (config.NODE_ENV === 'production') await runMigrations(db)

const manager = new GameManager(createGameStore(db), console)
const { app } = await buildApp(config, { db, manager })
const restored = await manager.restore()
if (restored > 0) app.log.info({ restored }, 'restored running games')
app.addHook('onClose', async () => {
  manager.close()
  await manager.flush()
  await close()
})

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
