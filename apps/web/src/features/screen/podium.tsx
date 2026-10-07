import type { HostSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'

interface Place {
  id: string
  name: string
  score: number
  rank: number
}

const heights = ['h-[40vh]', 'h-[30vh]', 'h-[22vh]']
const colours = ['bg-yellow-400 text-black', 'bg-slate-300 text-black', 'bg-orange-400 text-black']

/** Top 3 (players, or teams in team mode), rising one after another: 3rd, 2nd, then 1st. */
export function ScreenPodium({ host }: { host: HostSnapshot }) {
  const { t } = useTranslation()
  const places: Place[] = (host.mode === 'team' ? host.teams : host.players).filter((p) => p.rank <= 3).slice(0, 3)
  // Display order 2nd, 1st, 3rd so the winner stands in the middle.
  const order = [places[1], places[0], places[2]].filter((p): p is Place => p !== undefined)

  return (
    <div className="flex flex-1 flex-col gap-8">
      <h1 className="text-center text-6xl font-bold">{t('play.gameOver')}</h1>
      <div className="flex flex-1 items-end justify-center gap-6">
        {order.map((place) => {
          const position = places.indexOf(place)
          return (
            <div
              key={place.id}
              className="flex w-1/4 animate-rise flex-col items-center gap-3"
              style={{ animationDelay: `${(2 - position) * 0.8}s` }}
            >
              <p className="text-center text-4xl font-bold wrap-break-word">{place.name}</p>
              <p className="text-3xl tabular-nums">{place.score}</p>
              <div className={`flex w-full items-start justify-center rounded-t-2xl pt-4 ${heights[position]} ${colours[position]}`}>
                <span className="text-7xl font-bold">{place.rank}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
