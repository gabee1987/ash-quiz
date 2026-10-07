import type { GameResults } from '@ash-quiz/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DownloadIcon, MonitorIcon } from 'lucide-react'
import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { toastError } from '@/lib/toast'
import { Spinner } from '../../components/spinner'
import { PlayerTable, TeamTable } from '../../features/results/player-table'
import { QuestionStats } from '../../features/results/question-stats'
import { ResultsPodium } from '../../features/results/results-podium'
import { apiFetch, errorCode } from '../../lib/api'

export const Route = createFileRoute('/host/results/$gameId')({
  component: ResultsPage,
})

type Audience = 'screen' | 'players'

/** Held final results, released from here as from the host control (projector podium, players' phones). */
function ReleaseButtons({ gameId, pending }: { gameId: string; pending: GameResults['pendingRelease'] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const release = useMutation({
    mutationFn: (audience: Audience) =>
      apiFetch(`/api/games/${gameId}/release`, { method: 'POST', body: JSON.stringify({ audience }) }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['results', gameId] }),
    onError: toastError,
  })
  if (!pending.screen && !pending.players) return null
  const hint =
    pending.screen && pending.players
      ? 'host.game.resultsPendingHint'
      : pending.players
        ? 'host.game.playersWaitingHint'
        : 'host.game.podiumPendingHint'
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-warning px-4 py-3 text-warning-foreground">
      <p className="font-semibold">{t(hint)}</p>
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
        <FormAlert>{t(errorCode(results.error))}</FormAlert>
        <Button asChild variant="secondary" className="self-start">
          <Link to="/host/games">{t('results.backToGames')}</Link>
        </Button>
      </div>
    )
  }

  const data = results.data
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(data.createdAt)
  const lang = i18n.language.startsWith('en') ? 'en' : 'hu'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link
          to="/host/games"
          className="self-start rounded-md text-sm font-semibold text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {t('results.backToGames')}
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight wrap-break-word">{data.quizTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {t('results.title')} · {date} · {t('screen.pin')} {data.pin} · {t(`host.create.modes.${data.mode}`)}
          </p>
        </div>
        {data.phase !== 'finished' && (
          <p className="rounded-2xl bg-warning px-4 py-3 font-semibold text-warning-foreground">{t('results.running')}</p>
        )}
        <ReleaseButtons gameId={gameId} pending={data.pendingRelease} />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={`/api/games/${gameId}/results.csv?lang=${lang}`} download>
              <DownloadIcon aria-hidden="true" />
              {t('results.exportCsv')}
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href={`/screen/results/${gameId}`} target="_blank" rel="noreferrer">
              <MonitorIcon aria-hidden="true" />
              {t('results.showOnScreen')}
            </a>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {data.podium.length > 0 && <ResultsPodium places={data.podium} />}
          {data.mode === 'team' && <TeamTable teams={data.teams} />}
          <PlayerTable players={data.players} teams={data.mode === 'team' ? data.teams : []} />
        </div>
        <section className="flex min-w-0 flex-col gap-2">
          <h2 className="text-xl font-extrabold">{t('results.questions')}</h2>
          {data.questions.length === 0 ? (
            <p className="text-muted-foreground">{t('results.noQuestions')}</p>
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
