import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { ApiError } from '../../lib/api'
import { meQueryOptions } from '../../lib/auth'

// Guard for every /host/* page: no session means back to /login.
export const Route = createFileRoute('/host')({
  beforeLoad: async ({ context }) => {
    try {
      return { user: await context.queryClient.ensureQueryData(meQueryOptions) }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw redirect({ to: '/login' })
      throw error
    }
  },
  component: Outlet,
})
