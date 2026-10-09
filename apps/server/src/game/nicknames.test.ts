import { nicknameListSchema } from '@quizmoo/shared'
import { describe, expect, it } from 'vitest'
import { isNameAllowed } from './names.js'
import { defaultNicknames, pickNickname } from './nicknames.js'

describe('nicknames', () => {
  it('ships built-in lists that are valid player names and pass the filter', () => {
    for (const names of Object.values(defaultNicknames)) {
      expect(nicknameListSchema.parse({ names }).names).toEqual(names)
      expect(names.filter((name) => !isNameAllowed(name))).toEqual([])
      expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(names.length)
    }
  })

  it('picks a name nobody has, ignoring case', () => {
    const names = ['Disco Potato', 'Turbo Snail', 'Sir Waffles']
    for (const r of [0, 0.5, 0.99]) {
      expect(pickNickname(names, ['disco potato', 'SIR WAFFLES'], () => r)).toBe('Turbo Snail')
    }
  })

  it('falls back to any name once all are taken, and to null for an empty list', () => {
    expect(pickNickname(['Disco Potato'], ['Disco Potato'], () => 0)).toBe('Disco Potato')
    expect(pickNickname([], [], () => 0)).toBeNull()
  })
})
