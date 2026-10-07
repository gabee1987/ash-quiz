import type { Answer, GamePhase, GameSettings, Quiz } from '@ash-quiz/shared'

export const MAX_PLAYERS = 50

export interface PlayerAnswerRecord {
  answer: Answer
  /** Unix ms when the answer was received. */
  at: number
  /** Milliseconds from question start to the answer. */
  timeMs: number
  points: number
  /** null for polls and for host-graded text until `gradeText`. */
  correct: boolean | null
}

export interface Player {
  id: string
  name: string
  teamId: string | null
  /** Secret used to reclaim the player after a reconnect. Never sent in snapshots. */
  token: string
  connected: boolean
  score: number
  answers: Record<string, PlayerAnswerRecord>
}

export interface Team {
  id: string
  name: string
  score: number
}

/** Plain JSON-serialisable value: persisted on every transition and restored on boot. */
export interface GameState {
  id: string
  pin: string
  /** Frozen copy taken when the game was created. */
  quiz: Quiz
  settings: GameSettings
  phase: GamePhase
  /** -1 in lobby. */
  questionIndex: number
  players: Record<string, Player>
  /** Empty in classic mode. */
  teams: Record<string, Team>
  questionStartedAt: number | null
  questionEndsAt: number | null
  /** Text question without accepted answers: the host must grade before moving on. */
  awaitingGrading: boolean
  createdAt: number
  finishedAt: number | null
}

/** Invalid command. `code` is an i18n key sent to the client as is. */
export class EngineError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'EngineError'
    this.code = code
  }
}
