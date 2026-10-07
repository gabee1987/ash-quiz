import { z } from 'zod'

// ---- Question types -------------------------------------------------------

export const questionTypes = ['single', 'multiple', 'truefalse', 'text', 'number', 'poll'] as const
export type QuestionType = (typeof questionTypes)[number]

export const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1).max(200),
  imageId: z.string().optional(),
})
export type Option = z.infer<typeof optionSchema>

const baseQuestion = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1).max(500),
  imageId: z.string().optional(),
  timeLimitSec: z.number().int().min(5).max(180).default(20),
  points: z.number().int().min(0).max(5000).default(1000),
})

export const singleChoiceQuestionSchema = baseQuestion.extend({
  type: z.literal('single'),
  options: z.array(optionSchema).min(2).max(6),
  correctOptionId: z.string().min(1),
})

export const multipleChoiceQuestionSchema = baseQuestion.extend({
  type: z.literal('multiple'),
  options: z.array(optionSchema).min(2).max(6),
  correctOptionIds: z.array(z.string().min(1)).min(1),
})

export const trueFalseQuestionSchema = baseQuestion.extend({
  type: z.literal('truefalse'),
  correct: z.boolean(),
})

export const textQuestionSchema = baseQuestion.extend({
  type: z.literal('text'),
  /** Accepted answers, compared case- and accent-insensitively. Empty list means the host grades manually. */
  acceptedAnswers: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
})

export const numberQuestionSchema = baseQuestion.extend({
  type: z.literal('number'),
  correct: z.number(),
  /** Answers within +/- tolerance count as correct. 0 means exact. */
  tolerance: z.number().min(0).default(0),
})

export const pollQuestionSchema = baseQuestion.extend({
  type: z.literal('poll'),
  options: z.array(optionSchema).min(2).max(6),
})

export const questionSchema = z.discriminatedUnion('type', [
  singleChoiceQuestionSchema,
  multipleChoiceQuestionSchema,
  trueFalseQuestionSchema,
  textQuestionSchema,
  numberQuestionSchema,
  pollQuestionSchema,
])
export type Question = z.infer<typeof questionSchema>

// ---- Quiz -----------------------------------------------------------------

export const quizSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(''),
  questions: z.array(questionSchema).max(100),
})
export type Quiz = z.infer<typeof quizSchema>

/** Payload accepted by the editor when creating or updating a quiz (id assigned server-side). */
export const quizInputSchema = quizSchema.omit({ id: true })
export type QuizInput = z.infer<typeof quizInputSchema>

// ---- Game settings --------------------------------------------------------

export const gameModes = ['classic', 'team'] as const
export type GameMode = (typeof gameModes)[number]

export const gameSettingsSchema = z.object({
  mode: z.enum(gameModes).default('classic'),
  /** Faster correct answers earn more points (Kahoot style). */
  speedBonus: z.boolean().default(true),
  /** Shuffle answer options per game. */
  shuffleOptions: z.boolean().default(false),
  /** Team names prepared by the host (team mode only). Players pick one when joining. */
  teamNames: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
})
export type GameSettings = z.infer<typeof gameSettingsSchema>
