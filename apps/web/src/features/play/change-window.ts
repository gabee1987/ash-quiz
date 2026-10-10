import type { PlayerSnapshot } from '@quizmoo/shared'

/**
 * Whether the player may still change their answer, and for how many seconds (server time `now`).
 * Null when changes are off, nothing is answered yet, or the lock-in has started. While paused the
 * seconds stand still and changing waits for the resume, like the server.
 */
export function changeWindow(snapshot: PlayerSnapshot, now: number): { secondsLeft: number; paused: boolean } | null {
  const { settings, questionEndsAt, pausedAt } = snapshot
  if (!settings.answerChanges || snapshot.phase !== 'question' || !snapshot.myAnswer || questionEndsAt === null) return null
  const left = questionEndsAt - settings.answerLockSec * 1000 - (pausedAt ?? now)
  if (left < 0) return null
  return { secondsLeft: Math.ceil(left / 1000), paused: pausedAt !== null }
}
