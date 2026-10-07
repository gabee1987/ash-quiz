import { useTranslation } from 'react-i18next'
import { useCountdown } from '../lib/clock'

/** Shrinking bar plus seconds, counting down to the server's `questionEndsAt`. */
export function Timer({
  endsAt,
  totalMs,
  clockOffset,
  large = false,
}: {
  endsAt: number
  totalMs: number
  clockOffset: number
  /** Projector size. */
  large?: boolean
}) {
  const { t } = useTranslation()
  const remaining = useCountdown(endsAt, clockOffset)
  const seconds = Math.ceil(remaining / 1000)
  const fraction = totalMs > 0 ? Math.min(1, remaining / totalMs) : 0
  return (
    <div className="flex items-center gap-3" role="timer" aria-label={t('play.secondsLeft', { count: seconds })}>
      <div className={`flex-1 overflow-hidden rounded-full bg-muted ${large ? 'h-6' : 'h-3'}`}>
        <div
          className={`h-full rounded-full ${seconds <= 5 ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span className={`text-right font-bold tabular-nums ${large ? 'w-24 text-6xl' : 'w-10 text-xl'}`}>{seconds}</span>
    </div>
  )
}
