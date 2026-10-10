import type { PlayerSnapshot } from '@quizmoo/shared'
import { PencilIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useNow } from '@/lib/clock'
import { CheckIcon } from '../../components/icons'
import { WaitingDots } from '../../components/waiting-dots'
import { stagger } from '../../lib/motion'
import { changeWindow } from './change-window'

export function Answered({
  snapshot,
  clockOffset,
  onChange,
}: {
  snapshot: PlayerSnapshot
  clockOffset: number
  onChange: () => void
}) {
  const { t } = useTranslation()
  // Ticks only in games that allow changes. Server time, like the timer.
  const now = useNow(snapshot.settings.answerChanges) + clockOffset
  const change = changeWindow(snapshot, now)
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
      {change && (
        <div className="flex animate-fade-up flex-col items-center gap-2" style={stagger(1, 0, 440)}>
          <Button variant="secondary" size="lg" disabled={change.paused} onClick={onChange}>
            <PencilIcon aria-hidden="true" />
            {t('play.changeAnswer')}
          </Button>
          <p className="text-sm font-semibold text-muted-foreground tabular-nums">
            {t('play.changeSecondsLeft', { count: change.secondsLeft })}
          </p>
        </div>
      )}
    </div>
  )
}
