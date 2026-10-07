import type { HostSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { Timer } from '../../components/timer'
import { QuestionInput } from '../questions/question-input'

export function ScreenQuestion({ host, clockOffset }: { host: HostSnapshot; clockOffset: number }) {
  const { t } = useTranslation()
  const question = host.question
  if (!question) return null
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between text-3xl text-muted-foreground">
        <span>{t('play.questionOf', { index: host.questionIndex + 1, count: host.questionCount })}</span>
        <span className="font-semibold text-foreground">
          {t('host.game.answered', { answered: host.answeredCount, count: host.players.length })}
        </span>
      </div>
      {host.questionEndsAt !== null && (
        <Timer endsAt={host.questionEndsAt} totalMs={question.timeLimitSec * 1000} clockOffset={clockOffset} large />
      )}
      <h1 className="text-6xl leading-tight font-bold wrap-break-word">{question.text}</h1>
      {question.imageId && (
        <img src={`/api/images/${question.imageId}`} alt="" className="max-h-[35vh] self-center rounded-xl object-contain" />
      )}
      <QuestionInput question={question} mode="display" large />
    </div>
  )
}
