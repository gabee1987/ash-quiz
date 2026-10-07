import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { ApiError, apiFetch } from '../../lib/api'

interface QuizSummary {
  id: string
  title: string
  questionCount: number
  updatedAt: string
}

const quizzesQueryOptions = queryOptions({
  queryKey: ['quizzes'],
  queryFn: async () => (await apiFetch<{ quizzes: QuizSummary[] }>('/api/quizzes')).quizzes,
})

export const Route = createFileRoute('/host/')({
  component: HostHome,
})

function HostHome() {
  const { t, i18n } = useTranslation()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const quizzes = useQuery(quizzesQueryOptions)

  const play = useMutation({
    mutationFn: (quizId: string) =>
      apiFetch<{ pin: string }>('/api/games', { method: 'POST', body: JSON.stringify({ quizId }) }),
    onSuccess: ({ pin }) => void navigate({ to: '/host/games/$pin', params: { pin } }),
  })

  const logout = useMutation({
    mutationFn: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.clear()
      void navigate({ to: '/login' })
    },
  })

  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('host.title')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/70">{user.username}</span>
          <Button variant="secondary" onClick={() => logout.mutate()} disabled={logout.isPending}>
            {t('auth.logout')}
          </Button>
        </div>
      </div>

      {quizzes.isPending && <p className="text-white/70">{t('common.loading')}</p>}
      {quizzes.isError && <p role="alert">{t('errors.internal')}</p>}
      {quizzes.data?.length === 0 && <p className="text-white/70">{t('host.empty')}</p>}
      {play.error && (
        <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
          {t(play.error instanceof ApiError ? play.error.code : 'errors.internal')}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {quizzes.data?.map((quiz) => (
          <li key={quiz.id} className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold break-words">{quiz.title}</p>
              <p className="text-sm text-white/70">
                {t('host.questionCount', { count: quiz.questionCount })}
                {' · '}
                {t('host.updated', { date: dateFormat.format(new Date(quiz.updatedAt)) })}
              </p>
            </div>
            <Button disabled={play.isPending || quiz.questionCount === 0} onClick={() => play.mutate(quiz.id)}>
              {t('host.play')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
