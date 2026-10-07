import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/button'
import { TextField } from '../components/text-field'
import { ApiError, apiFetch } from '../lib/api'
import { meQueryOptions, type User } from '../lib/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const login = useMutation({
    mutationFn: () =>
      apiFetch<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(meQueryOptions.queryKey, user)
      void navigate({ to: '/host' })
    },
  })

  const usernameError = submitted && !username.trim() ? t('auth.required') : undefined
  const passwordError = submitted && !password ? t('auth.required') : undefined

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!username.trim() || !password) return
    login.mutate()
  }

  const errorCode = login.error instanceof ApiError ? login.error.code : login.error ? 'errors.internal' : null

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4">
      <h1 className="text-center text-2xl font-bold">{t('auth.title')}</h1>
      <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
        <TextField
          label={t('auth.username')}
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          enterKeyHint="next"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={usernameError}
        />
        <TextField
          label={t('auth.password')}
          name="password"
          type="password"
          autoComplete="current-password"
          enterKeyHint="go"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
        />
        {errorCode && (
          <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
            {t(errorCode)}
          </p>
        )}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? t('common.loading') : t('auth.submit')}
        </Button>
      </form>
    </div>
  )
}
