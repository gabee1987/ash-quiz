import type { HostSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { DistributionBars } from '../../components/distribution-bars'
import { CorrectAnswer } from '../questions/correct-answer'

export function ScreenReveal({ host }: { host: HostSnapshot }) {
  const { t } = useTranslation()
  if (host.answersHidden) return <AnswersHidden host={host} />
  const reveal = host.reveal
  if (!reveal) return null
  const isPoll = reveal.question.type === 'poll'
  return (
    <div className="flex flex-1 flex-col gap-8">
      <p className="text-3xl text-muted-foreground">
        {t('play.questionOf', { index: host.questionIndex + 1, count: host.questionCount })}
      </p>
      <h1 className="text-5xl leading-tight font-bold wrap-break-word">{reveal.question.text}</h1>
      <div className="text-4xl">
        {host.awaitingGrading ? (
          <p className="text-foreground">{t('play.awaitingGrading')}</p>
        ) : (
          <CorrectAnswer question={reveal.question} />
        )}
      </div>
      <DistributionBars reveal={reveal} large />
      {!isPoll && !host.awaitingGrading && (
        <p className="text-3xl text-foreground">
          {t('screen.correctCount', { correct: reveal.correctCount, count: reveal.answeredCount })}
        </p>
      )}
    </div>
  )
}

/**
 * Results are held back until the end. A host-attached projector still receives the
 * full reveal, so this view must render nothing from `host.reveal` but the question text.
 */
function AnswersHidden({ host }: { host: HostSnapshot }) {
  const { t } = useTranslation()
  const text = host.question?.text ?? host.reveal?.question.text ?? ''
  return (
    <div className="flex flex-1 flex-col gap-8">
      <p className="text-3xl text-muted-foreground">
        {t('play.questionOf', { index: host.questionIndex + 1, count: host.questionCount })}
      </p>
      <h1 className="text-5xl leading-tight font-bold wrap-break-word">{text}</h1>
      <p className="text-4xl text-foreground">
        {t('play.answeredSoFar', { answered: host.answeredCount, count: host.players.length })}
      </p>
      <p className="text-3xl text-muted-foreground">{t('play.resultsAtEnd')}</p>
    </div>
  )
}
