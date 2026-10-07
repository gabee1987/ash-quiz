import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { AppHeader } from '@/components/app-header'
import { Backdrop } from '@/components/backdrop'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <Backdrop />
      <div className="flex min-h-full flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col px-4 pb-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-center" />
    </>
  )
}
