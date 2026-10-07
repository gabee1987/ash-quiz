import { useTranslation } from 'react-i18next'
import { languages, setLanguage } from '@/i18n'
import { cn } from '@/lib/cn'
import { ModeToggle } from './mode-toggle'

/** Compact header on every screen: logo mark, language and colour mode. */
export function AppHeader() {
  const { t } = useTranslation()
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex items-center gap-2.5">
        <LogoMark />
        <span className="text-lg font-black tracking-tight">{t('app.name')}</span>
      </span>
      <span className="flex items-center gap-1">
        <LanguageSwitch />
        <ModeToggle />
      </span>
    </header>
  )
}

export function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 -rotate-6 place-items-center rounded-xl bg-primary text-xl font-black text-primary-foreground shadow-[0_3px_0_0_var(--primary-edge)]"
    >
      ?
    </span>
  )
}

/** Two-way HU / EN switch. */
function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <div role="group" aria-label={t('app.language')} className="flex rounded-lg bg-muted p-0.5">
      {languages.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-pressed={i18n.language === lang}
          aria-label={t(`app.languages.${lang}`)}
          onClick={() => setLanguage(lang)}
          className={cn(
            'h-9 min-w-10 rounded-md px-2 text-sm font-bold uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
            i18n.language === lang ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
