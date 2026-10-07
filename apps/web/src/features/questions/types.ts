import type { Answer, PublicQuestion } from '@ash-quiz/shared'

export type QuestionMode = 'answer' | 'display'

/** Props shared by every question type component. `display` is the read-only projector rendering. */
export interface QuestionProps<Q extends PublicQuestion['type']> {
  question: Extract<PublicQuestion, { type: Q }>
  mode: QuestionMode
  disabled?: boolean
  onSubmit?: (answer: Answer) => void
}
