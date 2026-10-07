import { useTranslation } from 'react-i18next'
import { useCountdown } from '../lib/clock'

/** Shrinking bar plus seconds, counting down to the server's `questionEndsAt`. */
export function Timer({ endsAt, totalMs, clockOffset }: { endsAt: number; totalMs: number; clockOffset: number }) {
  const { t } = useTranslation()
  const remaining = useCountdown(endsAt, clockOffset)
  const seconds = Math.ceil(remaining / 1000)
  const fraction = totalMs > 0 ? Math.min(1, remaining / totalMs) : 0
  return (
    <div className="flex items-center gap-3" role="timer" aria-label={t('play.secondsLeft', { count: seconds })}>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/15">
        <div
          className={`h-full rounded-full ${seconds <= 5 ? 'bg-red-500' : 'bg-white'}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span className="w-10 text-right text-xl font-bold tabular-nums">{seconds}</span>
    </div>
  )
}
