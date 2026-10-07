import type { GameSettings, Quiz } from '@ash-quiz/shared'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { ConfirmDialog } from '../../components/dialog'
import { CreateGameDialog } from '../../features/host/create-game-dialog'
import { ApiError, apiFetch } from '../../lib/api'

interface QuizSummary {
  id: string
  title: string
  questionCount: number
  updatedAt: string
  settings: GameSettings
}

const quizzesQueryOptions = queryOptions({
  queryKey: ['quizzes'],
  queryFn: async () => (await apiFetch<{ quizzes: QuizSummary[] }>('/api/quizzes')).quizzes,
})

export const Route = createFileRoute('/host/')({
  component: HostHome,
})

const errorCode = (error: unknown) => (error instanceof ApiError ? error.code : 'errors.internal')

function HostHome() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const quizzes = useQuery(quizzesQueryOptions)
  const [creating, setCreating] = useState<QuizSummary | null>(null)
  const [deleting, setDeleting] = useState<QuizSummary | null>(null)
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['quizzes'] })

  const play = useMutation({
    mutationFn: ({ quizId, settings }: { quizId: string; settings: GameSettings }) =>
      apiFetch<{ pin: string }>('/api/games', { method: 'POST', body: JSON.stringify({ quizId, settings }) }),
    onSuccess: ({ pin }) => void navigate({ to: '/host/games/$pin', params: { pin } }),
  })
  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ quiz: Quiz }>('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify({ title: t('editor.untitledQuiz'), questions: [] }),
      }),
    onSuccess: ({ quiz }) => {
      refresh()
      void navigate({ to: '/host/quizzes/$quizId', params: { quizId: quiz.id } })
    },
  })
  const duplicate = useMutation({
    mutationFn: (quiz: QuizSummary) =>
      apiFetch(`/api/quizzes/${quiz.id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ title: t('host.copyTitle', { title: quiz.title }).slice(0, 120) }),
      }),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (quiz: QuizSummary) => apiFetch(`/api/quizzes/${quiz.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setDeleting(null)
      refresh()
    },
  })

  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })
  const actionError = create.error ?? duplicate.error ?? remove.error

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('host.title')}</h1>

      <Button onClick={() => create.mutate()} disabled={create.isPending}>
        {t('host.newQuiz')}
      </Button>

      {quizzes.isPending && <p className="text-white/70">{t('common.loading')}</p>}
      {quizzes.isError && <p role="alert">{t('errors.internal')}</p>}
      {quizzes.data?.length === 0 && <p className="text-white/70">{t('host.empty')}</p>}
      {actionError && (
        <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
          {t(errorCode(actionError))}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {quizzes.data?.map((quiz) => (
          <li key={quiz.id} className="flex flex-col gap-3 rounded-lg bg-white/10 px-4 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold wrap-break-word">{quiz.title}</p>
              <p className="text-sm text-white/70">
                {t('host.questionCount', { count: quiz.questionCount })}
                {' · '}
                {t('host.updated', { date: dateFormat.format(new Date(quiz.updatedAt)) })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/host/quizzes/$quizId"
                params={{ quizId: quiz.id }}
                className="flex min-h-12 items-center rounded-lg bg-white/10 px-4 font-semibold"
              >
                {t('host.edit')}
              </Link>
              <Button variant="secondary" disabled={duplicate.isPending} onClick={() => duplicate.mutate(quiz)}>
                {t('host.duplicate')}
              </Button>
              <Button variant="secondary" onClick={() => setDeleting(quiz)}>
                {t('common.delete')}
              </Button>
              <Button disabled={quiz.questionCount === 0} onClick={() => setCreating(quiz)}>
                {t('host.play')}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {creating && (
        <CreateGameDialog
          quizTitle={creating.title}
          quizSettings={creating.settings}
          pending={play.isPending}
          error={play.error ? errorCode(play.error) : null}
          onCreate={(settings) => play.mutate({ quizId: creating.id, settings })}
          onCancel={() => {
            setCreating(null)
            play.reset()
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={t('host.deleteTitle')}
          confirmLabel={t('common.delete')}
          danger
          pending={remove.isPending}
          onConfirm={() => remove.mutate(deleting)}
          onCancel={() => setDeleting(null)}
        >
          {t('host.deleteBody', { title: deleting.title })}
        </ConfirmDialog>
      )}
    </div>
  )
}
