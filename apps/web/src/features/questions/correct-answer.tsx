import type { Question } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'

/** Human-readable correct answer for the reveal; null for polls and host-graded text. */
export function CorrectAnswer({ question }: { question: Question }) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language)
  let text: string | null
  switch (question.type) {
    case 'single':
      text = question.options.find((o) => o.id === question.correctOptionId)?.text ?? null
      break
    case 'multiple':
      text = question.options
        .filter((o) => question.correctOptionIds.includes(o.id))
        .map((o) => o.text)
        .join(', ')
      break
    case 'truefalse':
      text = question.correct ? t('play.true') : t('play.false')
      break
    case 'text':
      text = question.acceptedAnswers.length > 0 ? question.acceptedAnswers.join(' / ') : null
      break
    case 'number':
      text =
        question.tolerance > 0
          ? `${number.format(question.correct)} ± ${number.format(question.tolerance)}`
          : number.format(question.correct)
      break
    case 'poll':
      text = null
  }
  if (text === null) return null
  return (
    <p className="text-center text-white/80">
      {t('play.correctAnswer')}: <span className="font-semibold text-white">{text}</span>
    </p>
  )
}
