import type { Answer, AnswerSymbols, PublicQuestion } from '@ash-quiz/shared'
import { MultipleChoice } from './multiple-choice'
import { NumberAnswer } from './number-answer'
import { OrderAnswer } from './order-answer'
import { Poll } from './poll'
import { SingleChoice } from './single-choice'
import { TextAnswer } from './text-answer'
import { TrueFalse } from './true-false'
import type { QuestionMode } from './types'

/** One component per question type, shared by the phone (answer) and the projector (display). */
export function QuestionInput(props: {
  question: PublicQuestion
  mode: QuestionMode
  disabled?: boolean
  pending?: boolean
  large?: boolean
  colourful?: boolean
  symbols?: AnswerSymbols | undefined
  onSubmit?: (answer: Answer) => void
}) {
  const { question, ...rest } = props
  switch (question.type) {
    case 'single':
      return <SingleChoice question={question} {...rest} />
    case 'multiple':
      return <MultipleChoice question={question} {...rest} />
    case 'truefalse':
      return <TrueFalse question={question} {...rest} />
    case 'text':
      return <TextAnswer question={question} {...rest} />
    case 'number':
      return <NumberAnswer question={question} {...rest} />
    case 'poll':
      return <Poll question={question} {...rest} />
    case 'order':
      return <OrderAnswer question={question} {...rest} />
  }
}
