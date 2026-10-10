import type { GameResults, ResultQuestion } from '@quizmoo/shared'
import { ClockIcon, ListChecksIcon, TargetIcon, ThumbsDownIcon, ThumbsUpIcon, UsersIcon, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ResultsPodium } from './results-podium'
import { correctShare, summariseResults } from './summary'

/** What a host wants to see first after a game: the figures, the podium, the easiest and hardest question. */
export function ResultsSummary({ results }: { results: GameResults }) {
  const { t, i18n } = useTranslation()
  const summary = summariseResults(results)
  const percent = new Intl.NumberFormat(i18n.language, { style: 'percent' })
  const seconds = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 })

  const figures: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: UsersIcon, label: t('results.summary.players'), value: String(summary.playerCount) },
    { icon: ListChecksIcon, label: t('results.summary.questions'), value: String(summary.questionCount) },
    {
      icon: TargetIcon,
      label: t('results.summary.averageCorrect'),
      value: summary.averageCorrect === null ? '–' : percent.format(summary.averageCorrect),
    },
    {
      icon: ClockIcon,
      label: t('results.summary.averageTime'),
      value: summary.averageTimeMs === null ? '–' : t('results.summary.seconds', { seconds: seconds.format(summary.averageTimeMs / 1000) }),
    },
  ]

  return (
    <section aria-labelledby="results-summary" className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <h2 id="results-summary" className="sr-only">
        {t('results.summary.title')}
      </h2>
      <div className="flex min-w-0 flex-col gap-2">
        {results.podium.length > 0 ? (
          <ResultsPodium places={results.podium} />
        ) : (
          <p className="rounded-2xl border bg-card p-4 text-muted-foreground shadow-soft">{t('results.noQuestions')}</p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <dl className="grid grid-cols-2 gap-3">
          {figures.map(({ icon: Icon, label, value }, i) => (
            <div key={label} className="flex animate-pop flex-col gap-1 rounded-2xl border bg-card p-4 shadow-soft" style={{ animationDelay: `${i * 60}ms` }}>
              <dt className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </dt>
              <dd className="text-3xl font-black tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {summary.easiest && summary.hardest && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Highlight
              icon={ThumbsUpIcon}
              tone="success"
              label={t('results.summary.easiest')}
              question={summary.easiest}
              share={percent.format(correctShare(summary.easiest, summary.playerCount))}
            />
            <Highlight
              icon={ThumbsDownIcon}
              tone="destructive"
              label={t('results.summary.hardest')}
              question={summary.hardest}
              share={percent.format(correctShare(summary.hardest, summary.playerCount))}
            />
          </div>
        )}
      </div>
    </section>
  )
}

function Highlight({
  icon: Icon,
  tone,
  label,
  question,
  share,
}: {
  icon: LucideIcon
  tone: 'success' | 'destructive'
  label: string
  question: ResultQuestion
  share: string
}) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border border-l-8 bg-card p-4 shadow-soft ${tone === 'success' ? 'border-l-success' : 'border-l-destructive'}`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </p>
      <p className="font-extrabold wrap-break-word">
        {question.index + 1}. {question.question.text}
      </p>
      <p className="text-sm font-semibold">{t('results.correctPercentText', { share })}</p>
    </div>
  )
}
