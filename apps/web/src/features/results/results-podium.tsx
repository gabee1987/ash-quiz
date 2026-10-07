import type { PodiumPlace } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'

const medal = ['bg-yellow-400 text-black', 'bg-slate-300 text-black', 'bg-orange-400 text-black']

/** Top three places (players, or teams in team mode) as a compact list. */
export function ResultsPodium({ places }: { places: PodiumPlace[] }) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-extrabold">{t('results.podium')}</h2>
      <ol className="flex flex-col gap-2">
        {places.map((place) => (
          <li key={place.id} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-full font-black ${medal[place.rank - 1]}`}>
              {place.rank}
            </span>
            <span className="min-w-0 flex-1 text-lg font-bold wrap-break-word">{place.name}</span>
            <span className="text-lg font-extrabold tabular-nums">{place.score}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
