import { Settings2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { languages, setLanguage, type Language } from '@/i18n'
import { modes, setMode, useMode, type Mode } from '@/lib/mode'

/**
 * Phones in a game have no header: the screen belongs to the game. Language and colour mode sit
 * behind this small round button in the top right corner instead.
 */
export function GameMenu() {
  const { t, i18n } = useTranslation()
  const { mode } = useMode()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t('app.settings')}
          title={t('app.settings')}
          className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-40 size-10 rounded-full bg-card/90 shadow-soft backdrop-blur"
        >
          <Settings2Icon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel>{t('app.language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={i18n.language} onValueChange={(lang) => setLanguage(lang as Language)}>
          {languages.map((lang) => (
            <DropdownMenuRadioItem key={lang} value={lang} lang={lang}>
              {t(`app.languages.${lang}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('app.mode')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => setMode(value as Mode)}>
          {modes.map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {t(`app.modes.${value}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
