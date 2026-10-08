import type { PlayerSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { CheckIcon } from '../../components/icons'
import { WaitingDots } from '../../components/waiting-dots'
import { stagger } from '../../lib/motion'

export function Answered({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <span className="grid size-28 animate-pop place-items-center rounded-full bg-success text-success-foreground shadow-soft">
        <CheckIcon className="size-16" drawn />
      </span>
      <h1 className="animate-fade-up text-3xl font-black" style={stagger(1, 0, 200)}>
        {t('play.answerSent')}
      </h1>
      <p className="animate-fade-up font-semibold text-muted-foreground" style={stagger(1, 0, 320)}>
        {t('play.answeredSoFar', { answered: snapshot.answeredCount, count: snapshot.players.length })}
      </p>
      <WaitingDots className="text-muted-foreground" />
    </div>
  )
}
