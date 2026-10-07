import type { CurrentAnswer, HostSnapshot } from '@ash-quiz/shared'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'

interface Group {
  key: string
  /** The first player's spelling, shown as the group label. */
  label: string
  answers: CurrentAnswer[]
}

/**
 * Grading of a text question without accepted answers. Answers are grouped by their
 * normalised text, so "Győr", "gyor" and " GYŐR" are one toggle.
 */
export function GradingPanel({ host, onGrade }: { host: HostSnapshot; onGrade: (correctPlayerIds: string[]) => void }) {
  const { t } = useTranslation()
  const [correct, setCorrect] = useState<Set<string>>(new Set())
  const groups = useMemo(() => {
    const byKey = new Map<string, Group>()
    for (const answer of host.currentAnswers ?? []) {
      const group = byKey.get(answer.key)
      if (group) group.answers.push(answer)
      else byKey.set(answer.key, { key: answer.key, label: answer.answer.type === 'text' ? answer.answer.value : answer.key, answers: [answer] })
    }
    return [...byKey.values()].sort((a, b) => b.answers.length - a.answers.length)
  }, [host.currentAnswers])

  const toggle = (key: string) =>
    setCorrect((current) => {
      const nextSet = new Set(current)
      if (nextSet.has(key)) nextSet.delete(key)
      else nextSet.add(key)
      return nextSet
    })

  const apply = () =>
    onGrade(groups.filter((g) => correct.has(g.key)).flatMap((g) => g.answers.map((a) => a.playerId)))

  return (
    <section className="flex flex-col gap-3 rounded-xl border-2 border-yellow-300/60 p-3">
      <h2 className="text-lg font-semibold">{t('host.grading.title')}</h2>
      <p className="text-sm text-white/70">{t('host.grading.help')}</p>
      {groups.length === 0 && <p className="text-white/60">{t('host.grading.noAnswers')}</p>}
      <ul className="flex flex-col gap-2">
        {groups.map((group) => (
          <li key={group.key}>
            <label
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${correct.has(group.key) ? 'bg-green-700' : 'bg-white/10'}`}
            >
              <input type="checkbox" className="size-5" checked={correct.has(group.key)} onChange={() => toggle(group.key)} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold wrap-break-word">{group.label}</span>
                <span className="block truncate text-xs text-white/70">{group.answers.map((a) => a.name).join(', ')}</span>
              </span>
              <span className="tabular-nums">×{group.answers.length}</span>
            </label>
          </li>
        ))}
      </ul>
      <Button onClick={apply}>{t('host.grading.apply')}</Button>
    </section>
  )
}
