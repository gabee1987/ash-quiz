import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { TextField } from '../../components/text-field'
import { ApiError, apiFetch } from '../../lib/api'

interface UserRow {
  id: string
  username: string
  role: 'admin' | 'editor'
  mustChangePassword: boolean
  createdAt: string
}

export const Route = createFileRoute('/host/users')({
  component: UsersPage,
})

/** Admin only (the API enforces it): list host users and add new ones with an initial password. */
function UsersPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const users = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await apiFetch<{ users: UserRow[] }>('/api/users')).users,
    retry: false,
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'editor' | 'admin'>('editor')
  const [submitted, setSubmitted] = useState(false)
  const [created, setCreated] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => apiFetch('/api/users', { method: 'POST', body: JSON.stringify({ username: username.trim(), password, role }) }),
    onSuccess: () => {
      setCreated(username.trim())
      setUsername('')
      setPassword('')
      setSubmitted(false)
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const usernameValid = /^[a-zA-Z0-9._-]{3,40}$/.test(username.trim())
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setCreated(null)
    if (!usernameValid || password.length < 10) return
    create.mutate()
  }

  if (users.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p role="alert">{t(users.error instanceof ApiError ? users.error.code : 'errors.internal')}</p>
        <Link to="/host" className="underline">
          {t('host.game.backToQuizzes')}
        </Link>
      </div>
    )
  }

  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('users.title')}</h1>
        <Link to="/host" className="underline">
          {t('host.game.backToQuizzes')}
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {users.data?.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
            <span className="flex-1 font-semibold">{user.username}</span>
            <span className="text-sm text-white/70">{t(`users.roles.${user.role}`)}</span>
            {user.mustChangePassword && <span className="rounded bg-yellow-400 px-2 text-xs text-black">{t('users.pendingPassword')}</span>}
            <span className="text-sm text-white/60">{date.format(new Date(user.createdAt))}</span>
          </li>
        ))}
      </ul>

      <form className="flex flex-col gap-3 rounded-xl bg-white/5 p-4" onSubmit={onSubmit} noValidate>
        <h2 className="text-lg font-semibold">{t('users.add')}</h2>
        <TextField
          label={t('auth.username')}
          autoComplete="off"
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={submitted && !usernameValid ? t('users.usernameRules') : undefined}
        />
        <TextField
          label={t('users.initialPassword')}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={submitted && password.length < 10 ? t('auth.passwordChange.tooShort', { count: 10 }) : undefined}
        />
        <label className="flex flex-col gap-1 text-sm">
          {t('users.role')}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'editor' | 'admin')}
            className="min-h-12 rounded-lg bg-white px-3 text-black"
          >
            <option value="editor">{t('users.roles.editor')}</option>
            <option value="admin">{t('users.roles.admin')}</option>
          </select>
        </label>
        <p className="text-sm text-white/60">{t('users.initialPasswordHint')}</p>
        {create.error && (
          <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
            {t(create.error instanceof ApiError ? create.error.code : 'errors.internal')}
          </p>
        )}
        {created && <p role="status" className="rounded-lg bg-green-700 px-4 py-3">{t('users.created', { name: created })}</p>}
        <Button type="submit" disabled={create.isPending}>
          {t('users.add')}
        </Button>
      </form>
    </div>
  )
}
