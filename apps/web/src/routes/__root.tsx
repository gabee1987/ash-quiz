import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { languages, setLanguage, type Language } from '../i18n'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
})

function RootLayout() {
  const { i18n, t } = useTranslation()
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="font-semibold tracking-wide">{t('app.name')}</span>
        <select
          aria-label={t('app.language')}
          className="rounded bg-white/10 px-2 py-1 text-sm"
          value={i18n.language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          {languages.map((lang) => (
            <option key={lang} value={lang} className="text-black">
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </header>
      <main className="flex flex-1 flex-col px-4 pb-6">
        <Outlet />
      </main>
    </div>
  )
}
