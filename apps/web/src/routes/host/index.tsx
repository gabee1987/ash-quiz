import type { GameSettings, Quiz } from '@ash-quiz/shared'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyIcon, EllipsisVerticalIcon, PencilIcon, PlayIcon, PlusIcon, SparklesIcon, Trash2Icon } from 'lucide-react'
import { FormAlert } from '@/components/form-alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { themeSwatches } from '@/lib/themes'
import { toastError } from '@/lib/toast'
import { ConfirmDialog } from '../../components/dialog'
import { CreateGameDialog } from '../../features/host/create-game-dialog'
import { apiFetch } from '../../lib/api'

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
    onError: toastError,
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
    onError: toastError,
  })
  const duplicate = useMutation({
    mutationFn: (quiz: QuizSummary) =>
      apiFetch(`/api/quizzes/${quiz.id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ title: t('host.copyTitle', { title: quiz.title }).slice(0, 120) }),
      }),
    onSuccess: refresh,
    onError: toastError,
  })
  const remove = useMutation({
    mutationFn: (quiz: QuizSummary) => apiFetch(`/api/quizzes/${quiz.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setDeleting(null)
      refresh()
    },
    onError: toastError,
  })

  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black tracking-tight">{t('host.title')}</h1>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          <PlusIcon aria-hidden="true" />
          {t('host.newQuiz')}
        </Button>
      </div>

      {quizzes.isPending && (
        <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label={t('common.loading')}>
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      )}
      {quizzes.isError && <FormAlert>{t('errors.internal')}</FormAlert>}
      {quizzes.data?.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center text-muted-foreground">
          <SparklesIcon className="size-8 text-primary" aria-hidden="true" />
          <p className="font-semibold">{t('host.empty')}</p>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {quizzes.data?.map((quiz) => (
          <li key={quiz.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-snug font-extrabold wrap-break-word">{quiz.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('host.updated', { date: dateFormat.format(new Date(quiz.updatedAt)) })}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={t('host.moreActions', { title: quiz.title })}>
                    <EllipsisVerticalIcon aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuItem className="min-h-11" disabled={duplicate.isPending} onSelect={() => duplicate.mutate(quiz)}>
                    <CopyIcon aria-hidden="true" />
                    {t('host.duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="min-h-11" variant="destructive" onSelect={() => setDeleting(quiz)}>
                    <Trash2Icon aria-hidden="true" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{t('host.questionCount', { count: quiz.questionCount })}</Badge>
              <Badge variant="outline">{t(`host.create.modes.${quiz.settings.mode}`)}</Badge>
              <Badge variant="outline">
                <span className="size-2.5 rounded-full" style={{ background: themeSwatches(quiz.settings.theme)[0] }} />
                {t(`host.create.themeOptions.${quiz.settings.theme}`)}
              </Badge>
            </div>
            <div className="mt-auto flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/host/quizzes/$quizId" params={{ quizId: quiz.id }}>
                  <PencilIcon aria-hidden="true" />
                  {t('host.edit')}
                </Link>
              </Button>
              <Button className="flex-1" disabled={quiz.questionCount === 0} onClick={() => setCreating(quiz)}>
                <PlayIcon aria-hidden="true" />
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
