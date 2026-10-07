import { z } from 'zod'
import { gameModes, type GameMode, type Question } from './quiz.js'

export const gamePhases = ['lobby', 'question', 'reveal', 'scoreboard', 'finished'] as const
export type GamePhase = (typeof gamePhases)[number]

// ---- Answers --------------------------------------------------------------

export const answerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('single'), optionId: z.string().min(1) }),
  z.object({ type: z.literal('multiple'), optionIds: z.array(z.string().min(1)).min(1) }),
  z.object({ type: z.literal('truefalse'), value: z.boolean() }),
  z.object({ type: z.literal('text'), value: z.string().trim().min(1).max(100) }),
  z.object({ type: z.literal('number'), value: z.number().finite() }),
  z.object({ type: z.literal('poll'), optionId: z.string().min(1) }),
])
export type Answer = z.infer<typeof answerSchema>

// ---- Snapshots sent to clients -------------------------------------------
// The server broadcasts full snapshots on every state change. Clients render
// whatever snapshot they last received; reconnecting just means receiving one.

export interface PlayerPublic {
  id: string
  name: string
  teamId: string | null
  connected: boolean
  score: number
  rank: number
}

export interface TeamPublic {
  id: string
  name: string
  score: number
  rank: number
  memberCount: number
}

/** Omit applied to each member of a union separately (plain Omit keeps only the shared keys). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** Question as shown while answering: never contains the correct answer. */
export type PublicQuestion = DistributiveOmit<
  Question,
  'correctOptionId' | 'correctOptionIds' | 'correct' | 'acceptedAnswers' | 'tolerance'
>

export interface RevealInfo {
  /** The full question including the correct answer. */
  question: Question
  /** Answer bucket (option id, 'true'/'false', normalised text, or number) to count. */
  distribution: Record<string, number>
  correctCount: number
  answeredCount: number
}

export interface GameSnapshotBase {
  pin: string
  phase: GamePhase
  mode: GameMode
  quizTitle: string
  questionIndex: number
  questionCount: number
  /** Present in the 'question' phase. */
  question: PublicQuestion | null
  /** Unix ms when the current question closes. Present in the 'question' phase. */
  questionEndsAt: number | null
  /** Server time at snapshot creation, lets clients compute their clock offset. */
  serverNow: number
  answeredCount: number
  players: PlayerPublic[]
  teams: TeamPublic[]
  /** Present in 'reveal', 'scoreboard' and 'finished'. */
  reveal: RevealInfo | null
}

/** What the host control and projector screens receive. */
export type HostSnapshot = GameSnapshotBase

/** What a player's phone receives. */
export interface PlayerSnapshot extends GameSnapshotBase {
  me: PlayerPublic
  /** Answer the player submitted for the current question, if any. */
  myAnswer: Answer | null
  /** Points earned on the last revealed question. */
  lastPoints: number | null
  /** Whether that answer was correct; null for polls, ungraded text, or no answer. */
  lastCorrect: boolean | null
}

// ---- HTTP payloads about a running game ------------------------------------

/** `GET /api/games/:pin/public`: what the join page needs, no auth. */
export const gamePublicInfoSchema = z.object({
  quizTitle: z.string(),
  mode: z.enum(gameModes),
  phase: z.enum(gamePhases),
  teams: z.array(z.object({ id: z.string(), name: z.string() })),
})
export type GamePublicInfo = z.infer<typeof gamePublicInfoSchema>

/** `GET /api/games/:pin`: host control metadata. */
export interface GameHostInfo {
  pin: string
  quizTitle: string
  mode: GameMode
  phase: GamePhase
  /** Link players open (also encoded in the QR code). */
  joinUrl: string
}
