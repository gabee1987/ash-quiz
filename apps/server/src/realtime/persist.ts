import { and, gt, lte, ne, sql } from 'drizzle-orm'
import type { Db } from '../db/index.js'
import { games } from '../db/schema.js'
import type { GameStore, ManagedGame } from './game-manager.js'

/** Unfinished games older than this are not restored on boot but closed. */
export const RESTORE_WINDOW_MS = 12 * 60 * 60 * 1000

export function createGameStore(db: Db): GameStore {
  return {
    async save({ state, hostId, quizId }: ManagedGame) {
      const finishedAt = state.finishedAt === null ? null : new Date(state.finishedAt)
      await db
        .insert(games)
        .values({
          id: state.id,
          pin: state.pin,
          quizId,
          hostId,
          settings: state.settings,
          state,
          phase: state.phase,
          createdAt: new Date(state.createdAt),
          finishedAt,
        })
        .onConflictDoUpdate({ target: games.id, set: { state, phase: state.phase, finishedAt } })
    },

    async loadActive(now: number) {
      const cutoff = new Date(now - RESTORE_WINDOW_MS)
      // Too old to resume: close them, keeping the JSON state consistent with the columns.
      await db
        .update(games)
        .set({
          phase: 'finished',
          finishedAt: new Date(now),
          state: sql`jsonb_set(jsonb_set(${games.state}, '{phase}', '"finished"'), '{finishedAt}', to_jsonb(${now}::bigint))`,
        })
        .where(and(ne(games.phase, 'finished'), lte(games.createdAt, cutoff)))

      const rows = await db
        .select({ state: games.state, hostId: games.hostId, quizId: games.quizId })
        .from(games)
        .where(and(ne(games.phase, 'finished'), gt(games.createdAt, cutoff)))
      return rows
    },
  }
}
