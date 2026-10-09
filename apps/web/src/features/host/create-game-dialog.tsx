import type { GameSettings } from '@quizmoo/shared'
import { ChevronDownIcon, PlayIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GameSettingsForm, settingsError, settingsSummary } from './game-settings-form'

/** Starts a game with the quiz's settings; they can be changed for this game only in a collapsible section. */
export function CreateGameDialog({
  quizTitle,
  quizSettings,
  pending,
  onCreate,
  onCancel,
}: {
  quizTitle: string
  quizSettings: GameSettings
  pending: boolean
  onCreate: (settings: GameSettings) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState(quizSettings)
  const invalid = settingsError(settings) !== null

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!invalid) onCreate(settings)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('host.create.title')}</DialogTitle>
            <DialogDescription className="wrap-break-word">{quizTitle}</DialogDescription>
          </DialogHeader>

          <p className="rounded-xl bg-muted px-4 py-3 text-sm">{settingsSummary(settings, t)}</p>
          <details className="group rounded-xl border-2">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              {t('host.create.changeForGame')}
              <ChevronDownIcon className="size-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pt-2 pb-4">
              <GameSettingsForm value={settings} onChange={setSettings} />
            </div>
          </details>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={pending || invalid}>
              <PlayIcon aria-hidden="true" />
              {t('host.create.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
