import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { TextField } from '../../components/text-field'
import { apiFetch, errorCode } from '../../lib/api'
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
      <h1 className="text-center text-3xl font-black tracking-tight">{t('auth.passwordChange.title')}</h1>
      {user.mustChangePassword && (
        <p className="rounded-xl bg-warning px-4 py-3 text-sm font-semibold text-warning-foreground">
          {t('auth.passwordChange.mustChange')}
        </p>
      )}
      <form className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft" onSubmit={onSubmit} noValidate>
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
        {change.error && <FormAlert>{t(errorCode(change.error))}</FormAlert>}
        <Button type="submit" size="lg" className="mt-2" disabled={change.isPending}>
          {t('auth.passwordChange.submit')}
        </Button>
      </form>
      {!user.mustChangePassword && (
        <Link
          to="/host"
          className="self-center rounded-md font-semibold text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {t('host.game.backToQuizzes')}
        </Link>
      )}
    </div>
  )
}
