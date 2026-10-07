import { and, eq, lt } from 'drizzle-orm'
import type { Db } from './db/index.js'
import { games } from './db/schema.js'

export const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Data minimisation: deletes finished games (with their players' nicknames and answers)
 * that finished more than `days` days ago. Running games are never touched.
 * Returns the ids of the deleted games.
 */
export async function deleteExpiredGames(db: Db, days: number, now: number): Promise<string[]> {
  const cutoff = new Date(now - days * DAY_MS)
  const deleted = await db
    .delete(games)
    .where(and(eq(games.phase, 'finished'), lt(games.finishedAt, cutoff)))
    .returning({ id: games.id })
  return deleted.map((row) => row.id)
}

interface RetentionOptions {
  days: number
  /** Called with the deleted game ids, e.g. to drop them from memory. */
  onDeleted: (ids: string[]) => Promise<void>
  log: { info(obj: unknown, msg?: string): void; error(obj: unknown, msg?: string): void }
  now?: () => number
}

/** Runs the cleanup once now and then daily. Returns a stop function. */
export function scheduleRetention(db: Db, { days, onDeleted, log, now = Date.now }: RetentionOptions): () => void {
  const run = async () => {
    try {
      const ids = await deleteExpiredGames(db, days, now())
      await onDeleted(ids)
      if (ids.length > 0) log.info({ deleted: ids.length, days }, 'deleted expired games')
    } catch (error) {
      log.error(error, 'deleting expired games failed')
    }
  }
  void run()
  const timer = setInterval(() => void run(), DAY_MS)
  timer.unref()
  return () => clearInterval(timer)
}
