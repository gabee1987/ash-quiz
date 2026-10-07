import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { TextField } from '../../components/text-field'
import { ApiError, apiFetch } from '../../lib/api'
import { meQueryOptions, type User } from '../../lib/auth'

const MIN_LENGTH = 10

export const Route = createFileRoute('/host/password')({
  component: PasswordPage,
})

function PasswordPage() {
  const { t } = useTranslation()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const change = useMutation({
    mutationFn: () =>
      apiFetch<{ user: User }>('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      }),
    onSuccess: ({ user: updated }) => {
      queryClient.setQueryData(meQueryOptions.queryKey, updated)
      void navigate({ to: '/host' })
    },
  })

  const nextError = submitted && next.length < MIN_LENGTH ? t('auth.passwordChange.tooShort', { count: MIN_LENGTH }) : undefined
  const repeatError = submitted && repeat !== next ? t('auth.passwordChange.mismatch') : undefined

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!current || next.length < MIN_LENGTH || repeat !== next) return
    change.mutate()
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4">
      <h1 className="text-center text-2xl font-bold">{t('auth.passwordChange.title')}</h1>
      {user.mustChangePassword && <p className="rounded-lg bg-white/10 px-4 py-3 text-sm">{t('auth.passwordChange.mustChange')}</p>}
      <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
        <TextField
          label={t('auth.passwordChange.current')}
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={submitted && !current ? t('auth.required') : undefined}
        />
        <TextField
          label={t('auth.passwordChange.new')}
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={nextError}
        />
        <TextField
          label={t('auth.passwordChange.repeat')}
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          error={repeatError}
        />
        {change.error && (
          <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
            {t(change.error instanceof ApiError ? change.error.code : 'errors.internal')}
          </p>
        )}
        <Button type="submit" disabled={change.isPending}>
          {t('auth.passwordChange.submit')}
        </Button>
      </form>
      {!user.mustChangePassword && (
        <Link to="/host" className="text-center underline">
          {t('host.game.backToQuizzes')}
        </Link>
      )}
    </div>
  )
}
