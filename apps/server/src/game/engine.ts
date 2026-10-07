import type { Answer, GameSettings, Question, Quiz } from '@ash-quiz/shared'
import { isCorrect, pointsFor } from './scoring.js'
import { EngineError, MAX_PLAYERS, type GameState, type Player, type Team } from './types.js'

// Pure commands: (state, input, now) => new state. No I/O, no timers, no clock.

/**
 * New lobby. With `settings.shuffleOptions` the option order of choice questions is
 * shuffled once here and frozen into the game's quiz copy; correctness is id-based,
 * so nothing else changes. `random` is injectable for tests.
 */
export function createGame(
  quiz: Quiz,
  settings: GameSettings,
  pin: string,
  id: string,
  now: number,
  random: () => number = Math.random,
): GameState {
  const teams: Record<string, Team> = {}
  if (settings.mode === 'team') {
    settings.teamNames.forEach((name, i) => {
      const teamId = `team-${i + 1}`
      teams[teamId] = { id: teamId, name, score: 0 }
    })
  }
  return {
    id,
    pin,
    quiz: settings.shuffleOptions ? shuffleOptions(quiz, random) : quiz,
    settings,
    phase: 'lobby',
    questionIndex: -1,
    players: {},
    teams,
    questionStartedAt: null,
    questionEndsAt: null,
    awaitingGrading: false,
    createdAt: now,
    finishedAt: null,
  }
}

export interface JoinInput {
  id: string
  name: string
  teamId?: string | null | undefined
  token: string
}

/** Adds a player in the lobby. A known token reclaims that player in any phase instead. */
export function joinPlayer(state: GameState, input: JoinInput): GameState {
  const existing = findByToken(state, input.token)
  if (existing) return withPlayer(state, { ...existing, connected: true })

  if (state.phase !== 'lobby') throw new EngineError('errors.gameAlreadyStarted')
  const name = input.name.trim()
  const key = nameKey(name)
  if (Object.values(state.players).some((p) => nameKey(p.name) === key)) throw new EngineError('errors.nameTaken')
  if (Object.keys(state.players).length >= MAX_PLAYERS) throw new EngineError('errors.gameFull')

  let teamId: string | null = null
  if (state.settings.mode === 'team') {
    if (!input.teamId || !state.teams[input.teamId]) throw new EngineError('errors.unknownTeam')
    teamId = input.teamId
  }
  return withPlayer(state, {
    id: input.id,
    name,
    teamId,
    token: input.token,
    connected: true,
    score: 0,
    answers: {},
  })
}

export function reconnectPlayer(state: GameState, token: string): GameState {
  const player = findByToken(state, token)
  if (!player) throw new EngineError('errors.playerNotFound')
  return withPlayer(state, { ...player, connected: true })
}

/** Unknown ids are ignored: a kicked player's socket may still disconnect afterwards. */
export function disconnectPlayer(state: GameState, playerId: string): GameState {
  const player = state.players[playerId]
  if (!player) return state
  return withPlayer(state, { ...player, connected: false })
}

/** Removes the player. Team scores already earned are kept; the player stops counting from the next question. */
export function kickPlayer(state: GameState, playerId: string): GameState {
  if (state.phase === 'finished') throw new EngineError('errors.invalidTransition')
  if (!state.players[playerId]) throw new EngineError('errors.playerNotFound')
  const { [playerId]: _removed, ...players } = state.players
  return { ...state, players }
}

export function startGame(state: GameState, now: number): GameState {
  if (state.phase !== 'lobby') throw new EngineError('errors.gameAlreadyStarted')
  if (Object.keys(state.players).length === 0 || state.quiz.questions.length === 0) {
    throw new EngineError('errors.invalidTransition')
  }
  return openQuestion(state, 0, now)
}

export interface SubmitInput {
  playerId: string
  questionId: string
  answer: Answer
}

export function submitAnswer(state: GameState, input: SubmitInput, now: number): GameState {
  const player = state.players[input.playerId]
  if (!player) throw new EngineError('errors.playerNotFound')
  if (state.phase !== 'question' || state.questionEndsAt === null || now > state.questionEndsAt) {
    throw new EngineError('errors.questionClosed')
  }
  const question = currentQuestion(state)
  if (question.id !== input.questionId) throw new EngineError('errors.questionClosed')
  if (player.answers[question.id]) throw new EngineError('errors.alreadyAnswered')
  if (!answerFits(question, input.answer)) throw new EngineError('errors.invalidAnswer')

  return withPlayer(state, {
    ...player,
    answers: {
      ...player.answers,
      [question.id]: {
        answer: input.answer,
        at: now,
        timeMs: Math.max(0, now - (state.questionStartedAt ?? now)),
        points: 0,
        correct: null,
      },
    },
  })
}

/** Scores the current question and reveals it. Host-graded text waits for `gradeText`. */
export function endQuestion(state: GameState): GameState {
  if (state.phase !== 'question') throw new EngineError('errors.invalidTransition')
  const question = currentQuestion(state)
  const awaitingGrading = question.type === 'text' && question.acceptedAnswers.length === 0
  const players = scorePlayers(state, question, (answer) => isCorrect(question, answer))
  const teams = awaitingGrading ? state.teams : addTeamGains(state.teams, players, question.id)
  return { ...state, phase: 'reveal', players, teams, awaitingGrading }
}

/** Host grading of a text question without accepted answers. Listed players are correct, every other answer wrong. */
export function gradeText(state: GameState, correctPlayerIds: readonly string[]): GameState {
  if (state.phase !== 'reveal' || !state.awaitingGrading) throw new EngineError('errors.invalidTransition')
  const question = currentQuestion(state)
  const correctIds = new Set(correctPlayerIds)
  const players = scorePlayers(state, question, (_answer, playerId) => correctIds.has(playerId))
  return {
    ...state,
    players,
    teams: addTeamGains(state.teams, players, question.id),
    awaitingGrading: false,
  }
}

export function next(state: GameState, now: number): GameState {
  if (state.phase === 'reveal' && !state.awaitingGrading) return { ...state, phase: 'scoreboard' }
  if (state.phase === 'scoreboard') {
    const index = state.questionIndex + 1
    if (index >= state.quiz.questions.length) return { ...state, phase: 'finished', finishedAt: now }
    return openQuestion(state, index, now)
  }
  throw new EngineError('errors.invalidTransition')
}

/** Discards all answers to the current question and shows the scoreboard. Nobody scores. */
export function skipQuestion(state: GameState): GameState {
  if (state.phase !== 'question') throw new EngineError('errors.invalidTransition')
  const questionId = currentQuestion(state).id
  const players: Record<string, Player> = {}
  for (const player of Object.values(state.players)) {
    const { [questionId]: _discarded, ...answers } = player.answers
    players[player.id] = { ...player, answers }
  }
  return { ...state, phase: 'scoreboard', players }
}

export function extendTime(state: GameState, seconds: number): GameState {
  if (state.phase !== 'question' || state.questionEndsAt === null) throw new EngineError('errors.invalidTransition')
  return { ...state, questionEndsAt: state.questionEndsAt + seconds * 1000 }
}

export function endGame(state: GameState, now: number): GameState {
  if (state.phase === 'finished') return state
  return { ...state, phase: 'finished', finishedAt: now, awaitingGrading: false }
}

// ---- helpers ---------------------------------------------------------------

function shuffleOptions(quiz: Quiz, random: () => number): Quiz {
  const questions = quiz.questions.map((question) => {
    if (question.type !== 'single' && question.type !== 'multiple' && question.type !== 'poll') return question
    // Fisher-Yates on a copy.
    const options = [...question.options]
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[options[i], options[j]] = [options[j]!, options[i]!]
    }
    return { ...question, options }
  })
  return { ...quiz, questions }
}

export function currentQuestion(state: GameState): Question {
  const question = state.quiz.questions[state.questionIndex]
  if (!question) throw new EngineError('errors.invalidTransition')
  return question
}

function openQuestion(state: GameState, index: number, now: number): GameState {
  const question = state.quiz.questions[index]
  if (!question) throw new EngineError('errors.invalidTransition')
  return {
    ...state,
    phase: 'question',
    questionIndex: index,
    questionStartedAt: now,
    questionEndsAt: now + question.timeLimitSec * 1000,
    awaitingGrading: false,
  }
}

function withPlayer(state: GameState, player: Player): GameState {
  return { ...state, players: { ...state.players, [player.id]: player } }
}

function findByToken(state: GameState, token: string): Player | undefined {
  return Object.values(state.players).find((p) => p.token === token)
}

function nameKey(name: string): string {
  return name.trim().toLowerCase()
}

/** Answer type matches the question and every referenced option exists. */
function answerFits(question: Question, answer: Answer): boolean {
  if (answer.type !== question.type) return false
  const optionIds = new Set('options' in question ? question.options.map((o) => o.id) : [])
  switch (answer.type) {
    case 'single':
    case 'poll':
      return optionIds.has(answer.optionId)
    case 'multiple':
      return (
        new Set(answer.optionIds).size === answer.optionIds.length && answer.optionIds.every((id) => optionIds.has(id))
      )
    default:
      return true
  }
}

/** Sets correctness and points on every answer to `question` and adds the points to player scores. */
function scorePlayers(
  state: GameState,
  question: Question,
  decide: (answer: Answer, playerId: string) => boolean | null,
): Record<string, Player> {
  const players: Record<string, Player> = {}
  for (const player of Object.values(state.players)) {
    const record = player.answers[question.id]
    if (!record) {
      players[player.id] = player
      continue
    }
    const correct = question.type === 'poll' ? null : decide(record.answer, player.id)
    const points = pointsFor(
      question.points,
      correct,
      record.at - (state.questionStartedAt ?? record.at),
      question.timeLimitSec * 1000,
      state.settings.speedBonus,
    )
    players[player.id] = {
      ...player,
      score: player.score + points,
      answers: { ...player.answers, [question.id]: { ...record, correct, points } },
    }
  }
  return players
}

/** Each team gains the rounded mean of its current members' points; members without an answer count as 0. */
function addTeamGains(
  teams: Record<string, Team>,
  players: Record<string, Player>,
  questionId: string,
): Record<string, Team> {
  const result: Record<string, Team> = {}
  for (const team of Object.values(teams)) {
    const members = Object.values(players).filter((p) => p.teamId === team.id)
    const total = members.reduce((sum, p) => sum + (p.answers[questionId]?.points ?? 0), 0)
    const gain = members.length === 0 ? 0 : Math.round(total / members.length)
    result[team.id] = { ...team, score: team.score + gain }
  }
  return result
}
