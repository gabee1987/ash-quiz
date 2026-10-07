import type { GameSettings, HostSnapshot } from '@ash-quiz/shared'
import { describe, expect, it } from 'vitest'
import { alternativeAction, primaryAction } from './primary-action'

function reveal(settings: Partial<GameSettings>, questionIndex = 0): HostSnapshot {
  return {
    phase: 'reveal',
    awaitingGrading: false,
    questionIndex,
    questionCount: 3,
    players: [],
    settings: {
      mode: 'classic',
      speedBonus: true,
      shuffleOptions: false,
      teamNames: [],
      revealAnswers: 'afterQuestion',
      scoreboard: 'afterQuestion',
      answerStyle: 'plain',
      finalResults: 'immediately',
      ...settings,
    },
  } as unknown as HostSnapshot
}

const labels = (host: HostSnapshot) => [primaryAction(host)?.label ?? null, alternativeAction(host)?.label ?? null]

describe('host actions after a question', () => {
  it('scoreboard after each question: scoreboard first, next question as the alternative', () => {
    expect(labels(reveal({}))).toEqual(['host.game.showScoreboard', 'host.game.nextQuestion'])
  })

  it('scoreboard on demand: next question first, scoreboard as the alternative', () => {
    expect(labels(reveal({ scoreboard: 'onDemand' }))).toEqual(['host.game.nextQuestion', 'host.game.showScoreboard'])
  })

  it('results at the end: only next question, no scoreboard', () => {
    expect(labels(reveal({ revealAnswers: 'atEnd' }))).toEqual(['host.game.nextQuestion', null])
  })

  it('finishes after the last question', () => {
    expect(labels(reveal({}, 2))).toEqual(['host.game.showScoreboard', 'host.game.finish'])
    expect(primaryAction(reveal({ scoreboard: 'onDemand' }, 2))?.command).toEqual({ type: 'next' })
  })

  it('nothing while a text question waits for grading', () => {
    expect(labels({ ...reveal({}), awaitingGrading: true })).toEqual([null, null])
  })
})

describe('host action after the game', () => {
  const finished = (resultsPending: boolean, playersWaiting: boolean) =>
    ({ ...reveal({ finalResults: 'onRelease' }), phase: 'finished', resultsPending, playersWaiting }) as HostSnapshot

  it('both held: the podium first, the phones as the alternative', () => {
    expect(primaryAction(finished(true, true))?.command).toEqual({ type: 'releaseResults', audience: 'screen' })
    expect(labels(finished(true, true))).toEqual(['host.game.showPodium', 'host.game.releaseToPlayers'])
  })

  it('podium shown: the phones become the main action; phones released first: the podium remains', () => {
    expect(labels(finished(false, true))).toEqual(['host.game.releaseToPlayers', null])
    expect(primaryAction(finished(false, true))?.command).toEqual({ type: 'releaseResults', audience: 'players' })
    expect(labels(finished(true, false))).toEqual(['host.game.showPodium', null])
  })

  it('nothing held: no action', () => {
    expect(labels(finished(false, false))).toEqual([null, null])
  })
})
