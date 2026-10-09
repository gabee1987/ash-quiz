import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import { AppHeader } from '@/components/app-header'
import { Backdrop } from '@/components/backdrop'
import { GameMenu } from '@/components/game-menu'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/cn'
import { installSocketToasts } from '@/lib/socket-toasts'
import { installSquish } from '@/lib/squish'
import { useEffect } from 'react'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
})

function RootLayout() {
  useEffect(() => installSquish(), [])
  useEffect(() => installSocketToasts(), [])
  // A phone in a game gets the whole screen: no header, its settings behind a floating button.
  const inGame = useRouterState({ select: (state) => state.location.pathname.startsWith('/play/') })
  return (
    <>
      <Backdrop />
      <div className="flex min-h-full flex-col">
        {inGame ? <GameMenu /> : <AppHeader />}
        <main className={cn('flex flex-1 flex-col px-4 pb-6', inGame && 'pt-[max(0.75rem,env(safe-area-inset-top))]')}>
          <Outlet />
        </main>
      </div>
      <Toaster position="top-center" />
    </>
  )
}
