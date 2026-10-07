import type { GameResults } from '@ash-quiz/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { Spinner } from '../../components/spinner'
import { PlayerTable, TeamTable } from '../../features/results/player-table'
import { QuestionStats } from '../../features/results/question-stats'
import { ResultsPodium } from '../../features/results/results-podium'
import { ApiError, apiFetch } from '../../lib/api'

export const Route = createFileRoute('/host/results/$gameId')({
  component: ResultsPage,
})

const link = 'flex min-h-12 items-center rounded-lg px-4 font-semibold'

type Audience = 'screen' | 'players'

/** Held final results, released from here as from the host control (projector podium, players' phones). */
function ReleaseButtons({ gameId, pending }: { gameId: string; pending: GameResults['pendingRelease'] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const release = useMutation({
    mutationFn: (audience: Audience) =>
      apiFetch(`/api/games/${gameId}/release`, { method: 'POST', body: JSON.stringify({ audience }) }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['results', gameId] }),
  })
  if (!pending.screen && !pending.players) return null
  const hint =
    pending.screen && pending.players
      ? 'host.game.resultsPendingHint'
      : pending.players
        ? 'host.game.playersWaitingHint'
        : 'host.game.podiumPendingHint'
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-yellow-400/10 px-4 py-3">
      <p className="text-yellow-200">{t(hint)}</p>
      <div className="flex flex-wrap gap-2">
        {pending.screen && (
          <Button disabled={release.isPending} onClick={() => release.mutate('screen')}>
            {t('host.game.showPodium')}
          </Button>
        )}
        {pending.players && (
          <Button disabled={release.isPending} onClick={() => release.mutate('players')}>
            {t('host.game.releaseToPlayers')}
          </Button>
        )}
      </div>
      {release.error && (
        <p role="alert" className="text-red-200">
          {t(release.error instanceof ApiError ? release.error.code : 'errors.internal')}
        </p>
      )}
    </div>
  )
}

function ResultsPage() {
  const { t, i18n } = useTranslation()
  const { gameId } = Route.useParams()
  const results = useQuery({
    queryKey: ['results', gameId],
    queryFn: () => apiFetch<GameResults>(`/api/games/${gameId}/results`),
    retry: false,
  })

  if (results.isPending) return <Spinner />
  if (results.isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <p role="alert">{t(results.error instanceof ApiError ? results.error.code : 'errors.internal')}</p>
        <Link to="/host/games" className="underline">
          {t('results.backToGames')}
        </Link>
      </div>
    )
  }

  const data = results.data
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(data.createdAt)
  const lang = i18n.language.startsWith('en') ? 'en' : 'hu'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link to="/host/games" className="text-sm text-white/70 underline">
          {t('results.backToGames')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold wrap-break-word">{data.quizTitle}</h1>
          <p className="text-sm text-white/70">
            {t('results.title')} · {date} · {t('screen.pin')} {data.pin} · {t(`host.create.modes.${data.mode}`)}
          </p>
        </div>
        {data.phase !== 'finished' && (
          <p className="rounded-lg bg-yellow-400/15 px-4 py-3 text-yellow-100">{t('results.running')}</p>
        )}
        <ReleaseButtons gameId={gameId} pending={data.pendingRelease} />
        <div className="flex flex-wrap gap-2">
          <a href={`/api/games/${gameId}/results.csv?lang=${lang}`} download className={`${link} bg-brand text-white`}>
            {t('results.exportCsv')}
          </a>
          <a href={`/screen/results/${gameId}`} target="_blank" rel="noreferrer" className={`${link} bg-white/10`}>
            {t('results.showOnScreen')}
          </a>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {data.podium.length > 0 && <ResultsPodium places={data.podium} />}
          {data.mode === 'team' && <TeamTable teams={data.teams} />}
          <PlayerTable players={data.players} teams={data.mode === 'team' ? data.teams : []} />
        </div>
        <section className="flex min-w-0 flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('results.questions')}</h2>
          {data.questions.length === 0 ? (
            <p className="text-white/70">{t('results.noQuestions')}</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {data.questions.map((question) => (
                <QuestionStats key={question.question.id} question={question} playerCount={data.players.length} />
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
