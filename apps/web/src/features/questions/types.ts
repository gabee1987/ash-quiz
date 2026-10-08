import type { Answer, AnswerSymbols, PublicQuestion } from '@ash-quiz/shared'

export type QuestionMode = 'answer' | 'display'

/** Props shared by every question type component. `display` is the read-only projector rendering. */
export interface QuestionProps<Q extends PublicQuestion['type']> {
  question: Extract<PublicQuestion, { type: Q }>
  mode: QuestionMode
  disabled?: boolean
  /** The player's answer is on its way to the server: the chosen option shows a spinner. */
  pending?: boolean
  /** Projector size (display mode on the screen). */
  large?: boolean
  /** Coloured option buttons; the projector (`large`) always has them. */
  colourful?: boolean
  /** Symbol set of the options (game setting). */
  symbols?: AnswerSymbols | undefined
  onSubmit?: (answer: Answer) => void
}
