import type {
  Answer,
  CurrentAnswer,
  GameSnapshotBase,
  HostSnapshot,
  PlayerPublic,
  PlayerQuestionResult,
  PlayerSnapshot,
  PublicQuestion,
  Question,
  QuestionStat,
  RevealInfo,
  TeamPublic,
} from '@ash-quiz/shared'
import { normalise } from './normalise.js'
import { answersHidden } from './engine.js'
import { denseRank } from './scoring.js'
import { EngineError, type GameState, type Player } from './types.js'

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

/**
 * Snapshot for the host control and the projector. `includeAnswers` adds the live
 * answer list; only the host room gets it, the public screen never does. Without it,
 * results held back until the end are concealed as for players.
 */
export function toHostSnapshot(state: GameState, now: number, { includeAnswers = false } = {}): HostSnapshot {
  const base = baseSnapshot(state, now)
  return {
    ...(includeAnswers ? base : conceal(state, base)),
    currentAnswers: includeAnswers ? currentAnswers(state) : null,
  }
}

export function toPlayerSnapshot(state: GameState, playerId: string, now: number): PlayerSnapshot {
  const base = conceal(state, baseSnapshot(state, now))
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
    lastCorrect: base.reveal ? (record?.correct ?? null) : null,
    myResults: state.phase === 'finished' ? playerResults(state, player) : null,
  }
}

/**
 * While results are held back until the end, strips everything that tells who was right:
 * the reveal (correct answer, distribution), points, scores, ranks and correct counts.
 * The question itself stays visible during its reveal.
 */
function conceal(state: GameState, base: GameSnapshotBase): GameSnapshotBase {
  if (!base.answersHidden) return base
  const question = state.quiz.questions[state.questionIndex]
  return {
    ...base,
    question: base.reveal && question ? toPublicQuestion(question) : base.question,
    reveal: null,
    players: base.players.map((p) => ({ ...p, score: 0, rank: 1, correctCount: 0, roundPoints: 0 })),
    teams: base.teams.map((t) => ({ ...t, score: 0, rank: 1 })),
    questionStats: base.questionStats.map((q) => ({ ...q, correctCount: 0 })),
  }
}

/** Questions actually asked (a game ended early stops at the current one). */
function playerResults(state: GameState, player: Player): PlayerQuestionResult[] {
  return state.quiz.questions.slice(0, state.questionIndex + 1).map((question) => {
    const record = player.answers[question.id]
    return { question, answer: record?.answer ?? null, correct: record?.correct ?? null, points: record?.points ?? 0 }
  })
}

/** Distribution bucket of an answer: option id, 'true'/'false', normalised text, or the number. */
export function distributionKeys(answer: Answer): string[] {
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

function isRevealed(state: GameState): boolean {
  return state.phase === 'reveal' || state.phase === 'scoreboard' || state.phase === 'finished'
}

function baseSnapshot(state: GameState, now: number): GameSnapshotBase {
  const question = state.quiz.questions[state.questionIndex] ?? null
  const inQuestion = state.phase === 'question' && question !== null
  const revealed = question !== null && isRevealed(state)
  const players = Object.values(state.players)

  const rankedPlayers: PlayerPublic[] = denseRank(players).map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.teamId,
    connected: p.connected,
    score: p.score,
    rank: p.rank,
    correctCount: Object.values(p.answers).filter((a) => a.correct === true).length,
    roundPoints: revealed && question ? (p.answers[question.id]?.points ?? 0) : 0,
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
    awaitingGrading: state.awaitingGrading,
    questionStats: questionStats(state, players),
    settings: state.settings,
    answersHidden: answersHidden(state),
  }
}

function revealInfo(state: GameState, question: Question): RevealInfo {
  const distribution: Record<string, number> = {}
  if ('options' in question) for (const option of question.options) distribution[option.id] = 0
  if (question.type === 'truefalse') Object.assign(distribution, { true: 0, false: 0 })

  let correctCount = 0
  let answeredCount = 0
  const correctKeys = new Set<string>(staticCorrectKeys(question))
  for (const player of Object.values(state.players)) {
    const record = player.answers[question.id]
    if (!record) continue
    answeredCount += 1
    if (record.correct === true) correctCount += 1
    const keys = distributionKeys(record.answer)
    for (const key of keys) distribution[key] = (distribution[key] ?? 0) + 1
    // Number answers within tolerance and host-graded text are correct per answer, not per key list.
    if (record.correct === true && (question.type === 'number' || question.type === 'text')) {
      for (const key of keys) correctKeys.add(key)
    }
  }
  return { question, distribution, correctCount, answeredCount, correctKeys: [...correctKeys] }
}

function staticCorrectKeys(question: Question): string[] {
  switch (question.type) {
    case 'single':
      return [question.correctOptionId]
    case 'multiple':
      return question.correctOptionIds
    case 'truefalse':
      return [String(question.correct)]
    case 'text':
      return question.acceptedAnswers.map(normalise)
    case 'number':
    case 'poll':
      return []
  }
}

/** Stats for every question revealed so far (the current one once it is revealed). */
function questionStats(state: GameState, players: Player[]): QuestionStat[] {
  const lastRevealed = isRevealed(state) ? state.questionIndex : state.questionIndex - 1
  return state.quiz.questions.slice(0, Math.max(0, lastRevealed + 1)).map((question, index) => {
    const records = players.flatMap((p) => (p.answers[question.id] ? [p.answers[question.id]!] : []))
    const totalTime = records.reduce((sum, r) => sum + r.timeMs, 0)
    return {
      questionId: question.id,
      index,
      text: question.text,
      type: question.type,
      answeredCount: records.length,
      correctCount: records.filter((r) => r.correct === true).length,
      averageTimeMs: records.length > 0 ? Math.round(totalTime / records.length) : null,
    }
  })
}

function currentAnswers(state: GameState): CurrentAnswer[] {
  const question = state.quiz.questions[state.questionIndex]
  if (!question) return []
  return Object.values(state.players)
    .flatMap((player) => {
      const record = player.answers[question.id]
      if (!record) return []
      return [
        {
          playerId: player.id,
          name: player.name,
          teamId: player.teamId,
          answer: record.answer,
          key: distributionKeys(record.answer).join(','),
          correct: record.correct,
          points: record.points,
          timeMs: record.timeMs,
        },
      ]
    })
    .sort((a, b) => a.timeMs - b.timeMs)
}
