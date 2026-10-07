import { gameSettingsSchema } from '@ash-quiz/shared'
import { describe, expect, it } from 'vitest'

describe('gameSettingsSchema', () => {
  it('gives settings saved before the theme existed the classic theme', () => {
    const saved = {
      mode: 'classic',
      speedBonus: true,
      shuffleOptions: false,
      teamNames: [],
      revealAnswers: 'afterQuestion',
      scoreboard: 'afterQuestion',
      answerStyle: 'plain',
      finalResults: 'immediately',
    }
    expect(gameSettingsSchema.parse(saved).theme).toBe('classic')
  })

  it('rejects an unknown theme', () => {
    expect(gameSettingsSchema.safeParse({ theme: 'neon' }).success).toBe(false)
  })
})
