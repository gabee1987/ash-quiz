import type {
  Answer,
  GameSnapshotBase,
  HostSnapshot,
  PlayerPublic,
  PlayerSnapshot,
  PublicQuestion,
  Question,
  RevealInfo,
  TeamPublic,
} from '@ash-quiz/shared'
import { normalise } from './normalise.js'
import { denseRank } from './scoring.js'
import { EngineError, type GameState } from './types.js'

/** Strips every correct-answer field. Built per type so a new field is never leaked by accident. */
export function toPublicQuestion(question: Question): PublicQuestion {
  switch (question.type) {
    case 'single': {
      const { correctOptionId: _, ...rest } = question
      return rest
    }
    case 'multiple': {
      const { correctOptionIds: _, ...rest } = question
      return rest
    }
    case 'truefalse': {
      const { correct: _, ...rest } = question
      return rest
    }
    case 'text': {
      const { acceptedAnswers: _, ...rest } = question
      return rest
    }
    case 'number': {
      const { correct: _, tolerance: _t, ...rest } = question
      return rest
    }
    case 'poll':
      return { ...question }
  }
}

export function toHostSnapshot(state: GameState, now: number): HostSnapshot {
  return baseSnapshot(state, now)
}

export function toPlayerSnapshot(state: GameState, playerId: string, now: number): PlayerSnapshot {
  const base = baseSnapshot(state, now)
  const me = base.players.find((p) => p.id === playerId)
  const player = state.players[playerId]
  if (!me || !player) throw new EngineError('errors.playerNotFound')
  const question = state.quiz.questions[state.questionIndex]
  const record = question ? player.answers[question.id] : undefined
  return {
    ...base,
    me,
    myAnswer: record?.answer ?? null,
    lastPoints: base.reveal ? (record?.points ?? 0) : null,
  }
}

function baseSnapshot(state: GameState, now: number): GameSnapshotBase {
  const question = state.quiz.questions[state.questionIndex] ?? null
  const inQuestion = state.phase === 'question' && question !== null
  const revealed = question !== null && (state.phase === 'reveal' || state.phase === 'scoreboard' || state.phase === 'finished')
  const players = Object.values(state.players)

  const rankedPlayers: PlayerPublic[] = denseRank(players).map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.teamId,
    connected: p.connected,
    score: p.score,
    rank: p.rank,
  }))
  const rankedTeams: TeamPublic[] = denseRank(Object.values(state.teams)).map((t) => ({
    id: t.id,
    name: t.name,
    score: t.score,
    rank: t.rank,
    memberCount: players.filter((p) => p.teamId === t.id).length,
  }))

  return {
    pin: state.pin,
    phase: state.phase,
    mode: state.settings.mode,
    quizTitle: state.quiz.title,
    questionIndex: state.questionIndex,
    questionCount: state.quiz.questions.length,
    question: inQuestion ? toPublicQuestion(question) : null,
    questionEndsAt: inQuestion ? state.questionEndsAt : null,
    serverNow: now,
    answeredCount: question ? players.filter((p) => p.answers[question.id]).length : 0,
    players: rankedPlayers,
    teams: rankedTeams,
    reveal: revealed ? revealInfo(state, question) : null,
  }
}

function revealInfo(state: GameState, question: Question): RevealInfo {
  const distribution: Record<string, number> = {}
  if ('options' in question) for (const option of question.options) distribution[option.id] = 0
  if (question.type === 'truefalse') Object.assign(distribution, { true: 0, false: 0 })

  let correctCount = 0
  let answeredCount = 0
  for (const player of Object.values(state.players)) {
    const record = player.answers[question.id]
    if (!record) continue
    answeredCount += 1
    if (record.correct === true) correctCount += 1
    for (const key of distributionKeys(record.answer)) distribution[key] = (distribution[key] ?? 0) + 1
  }
  return { question, distribution, correctCount, answeredCount }
}

function distributionKeys(answer: Answer): string[] {
  switch (answer.type) {
    case 'single':
    case 'poll':
      return [answer.optionId]
    case 'multiple':
      return answer.optionIds
    case 'truefalse':
      return [String(answer.value)]
    case 'text':
      return [normalise(answer.value)]
    case 'number':
      return [String(answer.value)]
  }
}
