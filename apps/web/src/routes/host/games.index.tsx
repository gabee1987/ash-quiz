import type { GameHistoryItem } from '@ash-quiz/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { ConfirmDialog } from '../../components/dialog'
import { ApiError, apiFetch } from '../../lib/api'

export const Route = createFileRoute('/host/games/')({
  component: GameHistory,
})

const link = 'flex min-h-12 items-center rounded-lg px-4 text-lg font-semibold'

/** The host's games, newest first: open the results, or delete a finished game. */
function GameHistory() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const games = useQuery({
    queryKey: ['games'],
    queryFn: async () => (await apiFetch<{ games: GameHistoryItem[] }>('/api/games')).games,
  })
  const [deleting, setDeleting] = useState<GameHistoryItem | null>(null)
  const remove = useMutation({
    mutationFn: (game: GameHistoryItem) => apiFetch(`/api/games/${game.gameId}`, { method: 'DELETE' }),
    onSuccess: (_data, game) => {
      setDeleting(null)
      queryClient.removeQueries({ queryKey: ['results', game.gameId] })
      void queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('history.title')}</h1>

      {games.isPending && <p className="text-white/70">{t('common.loading')}</p>}
      {games.isError && <p role="alert">{t('errors.internal')}</p>}
      {games.data?.length === 0 && <p className="text-white/70">{t('history.empty')}</p>}

      <ul className="flex flex-col gap-2">
        {games.data?.map((game) => (
          <li key={game.gameId} className="flex flex-col gap-3 rounded-lg bg-white/10 px-4 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold wrap-break-word">{game.quizTitle}</p>
              <p className="text-sm text-white/70">
                {dateFormat.format(new Date(game.createdAt))}
                {' · '}
                {t(`host.create.modes.${game.mode}`)}
                {' · '}
                {t('history.players', { count: game.playerCount })}
                {' · '}
                {t(`host.game.phase.${game.phase}`)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {game.phase !== 'finished' && (
                <Link to="/host/games/$pin" params={{ pin: game.pin }} className={`${link} bg-white/10`}>
                  {t('history.control')}
                </Link>
              )}
              <Link to="/host/results/$gameId" params={{ gameId: game.gameId }} className={`${link} bg-white/10`}>
                {t('history.results')}
              </Link>
              {game.phase === 'finished' && (
                <Button variant="secondary" onClick={() => setDeleting(game)}>
                  {t('common.delete')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {deleting && (
        <ConfirmDialog
          title={t('history.deleteTitle')}
          confirmLabel={t('common.delete')}
          danger
          pending={remove.isPending}
          onConfirm={() => remove.mutate(deleting)}
          onCancel={() => {
            setDeleting(null)
            remove.reset()
          }}
        >
          {t('history.deleteBody', { title: deleting.quizTitle, date: dateFormat.format(new Date(deleting.createdAt)) })}
          {remove.error && (
            <span role="alert" className="mt-2 block text-red-200">
              {t(remove.error instanceof ApiError ? remove.error.code : 'errors.internal')}
            </span>
          )}
        </ConfirmDialog>
      )}
    </div>
  )
}
