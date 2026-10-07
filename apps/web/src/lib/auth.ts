import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from './api'

export interface User {
  id: string
  username: string
  role: 'admin' | 'editor'
}

export const meQueryOptions = queryOptions({
  queryKey: ['me'],
  queryFn: async () => (await apiFetch<{ user: User }>('/api/auth/me')).user,
  retry: false,
  staleTime: 5 * 60 * 1000,
})
