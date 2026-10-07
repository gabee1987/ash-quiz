import { describe, expect, it } from 'vitest'
import { createGame, endGame, endQuestion, joinPlayer, next, skipQuestion, startGame, submitAnswer } from './engine.js'
import { fixtureQuiz, fixtureSettings } from './fixtures.js'
import { toHostSnapshot, toPlayerSnapshot, toPublicQuestion } from './snapshots.js'
import { EngineError, type GameState } from './types.js'

const T0 = 1_000_000

function lobby(): GameState {
  let state = createGame(fixtureQuiz(), fixtureSettings(), '123456', 'game-1', T0)
  state = joinPlayer(state, { id: 'p1', name: 'Anna', token: 'tok-1' })
  state = joinPlayer(state, { id: 'p2', name: 'Bela', token: 'tok-2' })
  state = joinPlayer(state, { id: 'p3', name: 'Cecil', token: 'tok-3' })
  return state
}

/** Advances a started game to question `index` without answers. */
function atQuestion(index: number): GameState {
  let state = startGame(lobby(), T0)
  for (let i = 0; i < index; i++) state = next(skipQuestion(state), T0)
  return state
}

describe('toPublicQuestion', () => {
  const stripped = ['correctOptionId', 'correctOptionIds', 'correct', 'acceptedAnswers', 'tolerance']

  it.each(fixtureQuiz().questions.map((q) => [q.type, q] as const))('strips correct-answer fields from %s', (_type, question) => {
    const pub = toPublicQuestion(question)
    for (const key of stripped) expect(pub).not.toHaveProperty(key)
    expect(pub).toMatchObject({ id: question.id, type: question.type, text: question.text })
  })

  it('keeps the options of choice questions', () => {
    const single = fixtureQuiz().questions[0]!
    expect(toPublicQuestion(single)).toHaveProperty('options', 'options' in single ? single.options : undefined)
  })
})

describe('toHostSnapshot', () => {
  it('never contains a token', () => {
    expect(JSON.stringify(toHostSnapshot(lobby(), T0))).not.toContain('tok-')
  })

  it('shows the public question and deadline only in the question phase', () => {
    const state = atQuestion(0)
    const snap = toHostSnapshot(state, T0 + 1)
    expect(snap.question).not.toHaveProperty('correctOptionId')
    expect(snap.questionEndsAt).toBe(T0 + 20_000)
    expect(snap.serverNow).toBe(T0 + 1)
    expect(snap.reveal).toBeNull()

    const revealed = toHostSnapshot(endQuestion(state), T0)
    expect(revealed.question).toBeNull()
    expect(revealed.questionEndsAt).toBeNull()
    expect(revealed.reveal?.question).toHaveProperty('correctOptionId', 'a')
  })

  it('ranks players densely with ties', () => {
    let state = atQuestion(0)
    state = submitAnswer(state, { playerId: 'p3', questionId: 'q-single', answer: { type: 'single', optionId: 'a' } }, T0)
    state = submitAnswer(state, { playerId: 'p2', questionId: 'q-single', answer: { type: 'single', optionId: 'a' } }, T0)
    const snap = toHostSnapshot(endQuestion(state), T0)
    expect(snap.players.map((p) => [p.name, p.rank])).toEqual([
      ['Bela', 1],
      ['Cecil', 1],
      ['Anna', 2],
    ])
  })

  it('counts the distribution per option id with zeroes for unpicked options', () => {
    let state = atQuestion(1)
    state = submitAnswer(state, { playerId: 'p1', questionId: 'q-multiple', answer: { type: 'multiple', optionIds: ['a', 'c'] } }, T0)
    state = submitAnswer(state, { playerId: 'p2', questionId: 'q-multiple', answer: { type: 'multiple', optionIds: ['a'] } }, T0)
    const reveal = toHostSnapshot(endQuestion(state), T0).reveal!
    expect(reveal.distribution).toEqual({ a: 2, b: 0, c: 1 })
    expect(reveal.correctCount).toBe(1)
    expect(reveal.answeredCount).toBe(2)
  })

  it('uses true/false, normalised text and number keys', () => {
    let tf = atQuestion(2)
    tf = submitAnswer(tf, { playerId: 'p1', questionId: 'q-truefalse', answer: { type: 'truefalse', value: false } }, T0)
    expect(toHostSnapshot(endQuestion(tf), T0).reveal!.distribution).toEqual({ true: 0, false: 1 })

    let text = atQuestion(3)
    text = submitAnswer(text, { playerId: 'p1', questionId: 'q-text', answer: { type: 'text', value: 'GYŐR' } }, T0)
    text = submitAnswer(text, { playerId: 'p2', questionId: 'q-text', answer: { type: 'text', value: ' gyor' } }, T0)
    expect(toHostSnapshot(endQuestion(text), T0).reveal!.distribution).toEqual({ gyor: 2 })

    let num = atQuestion(4)
    num = submitAnswer(num, { playerId: 'p1', questionId: 'q-number', answer: { type: 'number', value: 1849 } }, T0)
    expect(toHostSnapshot(endQuestion(num), T0).reveal!.distribution).toEqual({ '1849': 1 })
  })

  it('keeps the reveal on the scoreboard and when finished, none when finished from the lobby', () => {
    const scoreboard = next(endQuestion(atQuestion(0)), T0)
    expect(toHostSnapshot(scoreboard, T0).reveal).not.toBeNull()
    expect(toHostSnapshot(endGame(scoreboard, T0), T0).reveal).not.toBeNull()
    expect(toHostSnapshot(endGame(lobby(), T0), T0).reveal).toBeNull()
  })

  it('reports team member counts in team mode', () => {
    let state = createGame(fixtureQuiz(), fixtureSettings({ mode: 'team', teamNames: ['Red', 'Blue'] }), '123456', 'g', T0)
    state = joinPlayer(state, { id: 'p1', name: 'Anna', teamId: 'team-1', token: 't1' })
    state = joinPlayer(state, { id: 'p2', name: 'Bela', teamId: 'team-1', token: 't2' })
    const snap = toHostSnapshot(state, T0)
    expect(snap.mode).toBe('team')
    expect(snap.teams.map((t) => [t.name, t.memberCount, t.rank])).toEqual([
      ['Blue', 0, 1],
      ['Red', 2, 1],
    ])
  })
})

describe('toPlayerSnapshot', () => {
  it('has me, myAnswer and lastPoints', () => {
    let state = atQuestion(0)
    const before = toPlayerSnapshot(state, 'p1', T0)
    expect(before.me).toMatchObject({ id: 'p1', name: 'Anna', score: 0 })
    expect(before.myAnswer).toBeNull()
    expect(before.lastPoints).toBeNull()

    state = submitAnswer(state, { playerId: 'p1', questionId: 'q-single', answer: { type: 'single', optionId: 'a' } }, T0)
    expect(toPlayerSnapshot(state, 'p1', T0).myAnswer).toEqual({ type: 'single', optionId: 'a' })
    expect(toPlayerSnapshot(state, 'p1', T0).question).not.toHaveProperty('correctOptionId')

    state = endQuestion(state)
    expect(toPlayerSnapshot(state, 'p1', T0).lastPoints).toBe(1000)
    expect(toPlayerSnapshot(state, 'p1', T0).lastCorrect).toBe(true)
    expect(toPlayerSnapshot(state, 'p2', T0).lastPoints).toBe(0)
    expect(toPlayerSnapshot(state, 'p2', T0).lastCorrect).toBeNull()
  })

  it('never contains a token', () => {
    expect(JSON.stringify(toPlayerSnapshot(lobby(), 'p1', T0))).not.toContain('tok-')
  })

  it('throws playerNotFound for an unknown player', () => {
    expect(() => toPlayerSnapshot(lobby(), 'ghost', T0)).toThrow(EngineError)
  })
})
