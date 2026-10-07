import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ApiError, apiFetch } from '../../lib/api'
import { meQueryOptions, type User } from '../../lib/auth'

// Guard for every /host/* page: no session means back to /login.
export const Route = createFileRoute('/host')({
  beforeLoad: async ({ context, location }) => {
    let user
    try {
      user = await context.queryClient.ensureQueryData(meQueryOptions)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw redirect({ to: '/login' })
      throw error
    }
    // The server enforces this too; the redirect just takes the user where they can act.
    if (user.mustChangePassword && location.pathname !== '/host/password') throw redirect({ to: '/host/password' })
    return { user }
  },
  component: HostLayout,
})

/** Sidebar on laptops, a compact row of links on phones. Hidden until a forced password change is done. */
function HostLayout() {
  const { user } = Route.useRouteContext()
  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-8">
      {!user.mustChangePassword && <HostNav user={user} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}

function HostNav({ user }: { user: User }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useMutation({
    mutationFn: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.clear()
      void navigate({ to: '/login' })
    },
  })
  const item = 'flex min-h-11 items-center rounded-lg px-3 hover:bg-white/10'
  const active = { className: 'bg-white/15 font-semibold' }

  return (
    <nav
      aria-label={t('nav.label')}
      className="flex flex-wrap items-center gap-1 border-b border-white/10 pb-2 text-sm lg:sticky lg:top-4 lg:w-56 lg:shrink-0 lg:flex-col lg:items-stretch lg:self-start lg:border-r lg:border-b-0 lg:pr-4 lg:pb-0 lg:text-base"
    >
      <Link to="/host" activeOptions={{ exact: true }} activeProps={active} className={item}>
        {t('nav.quizzes')}
      </Link>
      <Link to="/host/games" activeOptions={{ exact: true }} activeProps={active} className={item}>
        {t('nav.games')}
      </Link>
      {user.role === 'admin' && (
        <Link to="/host/users" activeProps={active} className={item}>
          {t('users.title')}
        </Link>
      )}
      <Link to="/host/password" activeProps={active} className={item}>
        {t('auth.passwordChange.link')}
      </Link>
      <div className="ml-auto flex items-center gap-1 lg:mt-4 lg:ml-0 lg:flex-col lg:items-stretch lg:border-t lg:border-white/10 lg:pt-4">
        <span className="px-3 text-white/60" title={t('nav.signedInAs')}>
          {user.username}
        </span>
        <button type="button" className={`${item} text-left`} onClick={() => logout.mutate()} disabled={logout.isPending}>
          {t('auth.logout')}
        </button>
      </div>
    </nav>
  )
}
