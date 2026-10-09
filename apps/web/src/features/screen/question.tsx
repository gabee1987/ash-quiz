import type { HostSnapshot } from '@quizmoo/shared'
import { useTranslation } from 'react-i18next'
import { PausedNote } from '../../components/paused-note'
import { Timer } from '../../components/timer'
import { stagger } from '../../lib/motion'
import { QuestionInput } from '../questions/question-input'

export function ScreenQuestion({ host, clockOffset }: { host: HostSnapshot; clockOffset: number }) {
  const { t } = useTranslation()
  const question = host.question
  if (!question) return null
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between text-3xl font-semibold text-muted-foreground">
        <span>{t('play.questionOf', { index: host.questionIndex + 1, count: host.questionCount })}</span>
        {/* Keyed by the count so it pops with every answer. */}
        <span key={host.answeredCount} className="animate-pop rounded-full bg-secondary px-5 py-1 text-secondary-foreground">
          {t('host.game.answered', { answered: host.answeredCount, count: host.players.length })}
        </span>
      </div>
      {host.questionEndsAt !== null && (
        <Timer
          endsAt={host.questionEndsAt}
          totalMs={question.timeLimitSec * 1000}
          clockOffset={clockOffset}
          pausedAt={host.pausedAt}
          large
        />
      )}
      {host.pausedAt !== null && <PausedNote size="screen" />}
      <h1 className="animate-fade-up text-6xl leading-tight font-black wrap-break-word">{question.text}</h1>
      {question.imageId && (
        <img
          src={`/api/images/${question.imageId}`}
          alt=""
          className="max-h-[35vh] animate-pop self-center rounded-2xl object-contain shadow-soft"
          style={stagger(1, 0, 120)}
        />
      )}
      <QuestionInput question={question} mode="display" large symbols={host.settings.answerSymbols} />
    </div>
  )
}
