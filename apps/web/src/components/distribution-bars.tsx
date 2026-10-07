import type { RevealInfo } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { toBuckets } from '../features/screen/buckets'
import { CheckIcon, ShapeIcon } from './icons'
import { optionColour } from './option-colours'

/** Horizontal answer bars for the reveal; correct buckets are highlighted, the rest dimmed. */
export function DistributionBars({ reveal, large = false }: { reveal: RevealInfo; large?: boolean }) {
  const { t } = useTranslation()
  const buckets = toBuckets(reveal.question, reveal.distribution, reveal.correctKeys, {
    true: t('play.true'),
    false: t('play.false'),
    other: t('screen.other'),
  })
  const max = Math.max(1, ...buckets.map((b) => b.count))
  const hasCorrect = buckets.some((b) => b.correct)

  return (
    <ul className={`flex w-full flex-col ${large ? 'gap-4 text-3xl' : 'gap-2 text-base'}`}>
      {buckets.map((bucket) => (
        <li
          key={bucket.key}
          className={`flex items-center gap-3 ${hasCorrect && !bucket.correct ? 'opacity-50' : ''}`}
        >
          <span className={`flex min-w-0 items-center gap-2 ${large ? 'w-2/5' : 'w-1/3'}`}>
            {bucket.index !== null && <ShapeIcon index={bucket.index} className="size-[1em] shrink-0" />}
            <span className="truncate">{bucket.label}</span>
          </span>
          <span className="flex flex-1 items-center gap-3">
            <span
              className={`rounded-md ${large ? 'h-12' : 'h-6'} ${bucket.index !== null ? optionColour(bucket.index) : 'bg-muted-foreground'} ${bucket.correct ? 'ring-4 ring-success' : ''}`}
              style={{ width: `${Math.max(2, (bucket.count / max) * 100)}%` }}
            />
            <span className="font-bold tabular-nums">{bucket.count}</span>
            {bucket.correct && (
              <CheckIcon className={`${large ? 'size-10' : 'size-5'} text-success`} aria-label={t('play.correct')} />
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
