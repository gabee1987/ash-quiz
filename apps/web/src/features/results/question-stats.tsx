import type { ResultQuestion } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { DistributionBars } from '../../components/distribution-bars'
import { CorrectAnswer } from '../questions/correct-answer'

/** Polls and ungraded text have no right answer, so no correct percentage either. */
export function hasCorrectAnswer(question: ResultQuestion): boolean {
  return question.question.type !== 'poll' && question.correctKeys.length > 0
}

/** Figures for one question: share of all players who were right, answer count, mean answer time. */
export function useQuestionFigures(question: ResultQuestion, playerCount: number): string[] {
  const { t, i18n } = useTranslation()
  const seconds = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 })
  return [
    hasCorrectAnswer(question) && playerCount > 0
      ? t('results.correctPercent', { percent: Math.round((question.correctCount / playerCount) * 100) })
      : null,
    t('results.answered', { answered: question.answeredCount, count: playerCount }),
    question.averageTimeMs === null
      ? t('results.noAnswers')
      : t('results.averageTime', { seconds: seconds.format(question.averageTimeMs / 1000) }),
  ].filter((figure): figure is string => figure !== null)
}

export function QuestionStats({ question, playerCount }: { question: ResultQuestion; playerCount: number }) {
  const { t } = useTranslation()
  const figures = useQuestionFigures(question, playerCount)
  return (
    <li className="flex flex-col gap-3 rounded-lg bg-white/10 px-4 py-3">
      <div>
        <p className="text-sm text-white/60">
          {t('results.questionNumber', { index: question.index + 1 })} · {t(`questionTypes.${question.question.type}`)}
        </p>
        <p className="text-lg font-semibold wrap-break-word">{question.question.text}</p>
        <div className="[&>p]:text-left">
          <CorrectAnswer question={question.question} />
        </div>
      </div>
      <DistributionBars reveal={question} />
      <p className="text-sm text-white/70">{figures.join(' · ')}</p>
    </li>
  )
}
