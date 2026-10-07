import type { HostSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { DistributionBars } from '../../components/distribution-bars'
import { CorrectAnswer } from '../questions/correct-answer'

export function ScreenReveal({ host }: { host: HostSnapshot }) {
  const { t } = useTranslation()
  const reveal = host.reveal
  if (!reveal) return null
  const isPoll = reveal.question.type === 'poll'
  return (
    <div className="flex flex-1 flex-col gap-8">
      <p className="text-3xl text-white/70">
        {t('play.questionOf', { index: host.questionIndex + 1, count: host.questionCount })}
      </p>
      <h1 className="text-5xl leading-tight font-bold wrap-break-word">{reveal.question.text}</h1>
      <div className="text-4xl">
        {host.awaitingGrading ? (
          <p className="text-white/80">{t('play.awaitingGrading')}</p>
        ) : (
          <CorrectAnswer question={reveal.question} />
        )}
      </div>
      <DistributionBars reveal={reveal} large />
      {!isPoll && !host.awaitingGrading && (
        <p className="text-3xl text-white/80">
          {t('screen.correctCount', { correct: reveal.correctCount, count: reveal.answeredCount })}
        </p>
      )}
    </div>
  )
}
