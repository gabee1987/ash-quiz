import type { HostSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { CheckIcon, CrossIcon } from '../../components/icons'
import { formatAnswer } from '../questions/format-answer'

/** Mid-game review: who is leading, how each question went, and the answers to the current one. */
export function ReviewPanel({ host }: { host: HostSnapshot }) {
  const { t, i18n } = useTranslation()
  const teamName = (teamId: string | null) => host.teams.find((team) => team.id === teamId)?.name ?? ''
  const seconds = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 })
  const percent = new Intl.NumberFormat(i18n.language, { style: 'percent' })
  const question = host.reveal?.question ?? host.question

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('host.review.title')}</h2>

      <details open className="rounded-lg bg-white/5 p-3">
        <summary className="cursor-pointer font-semibold">{t('host.review.standings')}</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/60">
              <tr>
                <th className="py-1 pr-2">#</th>
                <th className="py-1 pr-2">{t('host.review.name')}</th>
                {host.mode === 'team' && <th className="py-1 pr-2">{t('join.team')}</th>}
                <th className="py-1 pr-2 text-right">{t('host.review.correct')}</th>
                <th className="py-1 text-right">{t('host.review.score')}</th>
              </tr>
            </thead>
            <tbody>
              {host.players.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="py-1 pr-2 tabular-nums">{p.rank}.</td>
                  <td className="max-w-40 truncate py-1 pr-2">{p.name}</td>
                  {host.mode === 'team' && <td className="py-1 pr-2">{teamName(p.teamId)}</td>}
                  <td className="py-1 pr-2 text-right tabular-nums">{p.correctCount}</td>
                  <td className="py-1 text-right tabular-nums">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="rounded-lg bg-white/5 p-3">
        <summary className="cursor-pointer font-semibold">{t('host.review.questions')}</summary>
        {host.questionStats.length === 0 ? (
          <p className="mt-2 text-sm text-white/60">{t('host.review.noQuestionsYet')}</p>
        ) : (
          <ol className="mt-2 flex flex-col gap-2 text-sm">
            {host.questionStats.map((stat) => (
              <li key={stat.questionId} className="flex flex-col gap-1 border-t border-white/10 pt-2">
                <span className="font-semibold wrap-break-word">
                  {stat.index + 1}. {stat.text}
                </span>
                <span className="text-white/70">
                  {stat.type === 'poll'
                    ? t('host.review.pollAnswers', { count: stat.answeredCount })
                    : t('host.review.correctOf', {
                        correct: stat.correctCount,
                        count: stat.answeredCount,
                        percent: percent.format(stat.answeredCount ? stat.correctCount / stat.answeredCount : 0),
                      })}
                  {stat.averageTimeMs !== null &&
                    ` · ${t('host.review.averageTime', { seconds: seconds.format(stat.averageTimeMs / 1000) })}`}
                </span>
              </li>
            ))}
          </ol>
        )}
      </details>

      {host.currentAnswers && host.phase !== 'lobby' && host.phase !== 'finished' && (
        <details className="rounded-lg bg-white/5 p-3">
          <summary className="cursor-pointer font-semibold">
            {t('host.review.currentAnswers', { count: host.currentAnswers.length })}
          </summary>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {host.currentAnswers.map((a) => (
              <li key={a.playerId} className="flex items-center gap-2 border-t border-white/10 pt-1">
                {a.correct === true && <CheckIcon className="size-4 text-green-400" />}
                {a.correct === false && <CrossIcon className="size-4 text-red-400" />}
                <span className="w-28 truncate">{a.name}</span>
                <span className="flex-1 truncate">{formatAnswer(a.answer, question, t, i18n.language)}</span>
                <span className="text-white/60 tabular-nums">{seconds.format(a.timeMs / 1000)} s</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
