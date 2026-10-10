import type { GameSettings, PlayerSnapshot } from '@quizmoo/shared'
import { describe, expect, it } from 'vitest'
import { changeWindow } from './change-window'

const NOW = 1_000_000

function answered(settings: Partial<GameSettings>, patch: Partial<PlayerSnapshot> = {}): PlayerSnapshot {
  return {
    phase: 'question',
    questionEndsAt: NOW + 20_000,
    pausedAt: null,
    myAnswer: { type: 'single', optionId: 'a' },
    settings: { answerChanges: true, answerLockSec: 0, ...settings },
    ...patch,
  } as unknown as PlayerSnapshot
}

describe('changeWindow', () => {
  it('is closed when changes are off or nothing is answered yet', () => {
    expect(changeWindow(answered({ answerChanges: false }), NOW)).toBeNull()
    expect(changeWindow(answered({}, { myAnswer: null }), NOW)).toBeNull()
    expect(changeWindow(answered({}, { phase: 'reveal' }), NOW)).toBeNull()
  })

  it('counts the seconds until the end, or until the lock-in starts', () => {
    expect(changeWindow(answered({}), NOW)).toEqual({ secondsLeft: 20, paused: false })
    expect(changeWindow(answered({ answerLockSec: 5 }), NOW + 500)).toEqual({ secondsLeft: 15, paused: false })
  })

  it('closes once the lock-in starts', () => {
    expect(changeWindow(answered({ answerLockSec: 5 }), NOW + 15_000)).toEqual({ secondsLeft: 0, paused: false })
    expect(changeWindow(answered({ answerLockSec: 5 }), NOW + 15_001)).toBeNull()
  })

  it('stands still while paused', () => {
    expect(changeWindow(answered({}, { pausedAt: NOW + 5_000 }), NOW + 60_000)).toEqual({ secondsLeft: 15, paused: true })
  })
})
