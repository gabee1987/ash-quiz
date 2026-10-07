import type { Answer, PublicQuestion } from '@ash-quiz/shared'

export type QuestionMode = 'answer' | 'display'

/** Props shared by every question type component. `display` is the read-only projector rendering. */
export interface QuestionProps<Q extends PublicQuestion['type']> {
  question: Extract<PublicQuestion, { type: Q }>
  mode: QuestionMode
  disabled?: boolean
  /** Projector size (display mode on the screen). */
  large?: boolean
  /** Coloured option buttons with shapes; the projector (`large`) always has them. */
  colourful?: boolean
  onSubmit?: (answer: Answer) => void
}
