import type { GameSettings } from '@quizmoo/shared'
import { CheckIcon, PencilIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/cn'
import {
  GameSettingsForm,
  allSections,
  sectionChanged,
  sectionSummary,
  settingsError,
  withSection,
  type SettingsSection,
} from './game-settings-form'

/**
 * Starts a game with the quiz's settings, shown in three groups (game flow, look, scoring) with
 * their summary. "Change" opens one group's settings for this game only; a changed group says so
 * and can be reset to the quiz's own settings.
 */
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
  const [open, setOpen] = useState<SettingsSection | null>(null)
  const invalid = settingsError(settings) !== null

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!invalid) onCreate(settings)
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t('host.create.title')}</DialogTitle>
            <DialogDescription className="wrap-break-word">{quizTitle}</DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">{t('host.create.groupsHelp')}</p>
          <div className="flex flex-col gap-3">
            {allSections.map((section) => {
              const isOpen = open === section
              const changed = sectionChanged(settings, quizSettings, section)
              const summary = sectionSummary(settings, section, t)
              const headingId = `create-${section}`
              return (
                <section
                  key={section}
                  aria-labelledby={headingId}
                  className={cn('flex flex-col gap-3 rounded-2xl border-2 p-4 transition-colors', isOpen && 'border-primary')}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 id={headingId} className="flex-1 font-extrabold">
                      {t(`host.batch.groups.${section}`)}
                    </h3>
                    {changed && <Badge variant="secondary">{t('host.create.changedForGame')}</Badge>}
                    {changed && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSettings((current) => withSection(current, quizSettings, section))}
                      >
                        <RotateCcwIcon aria-hidden="true" />
                        {t('host.create.reset')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={isOpen ? 'default' : 'outline'}
                      size="sm"
                      aria-expanded={isOpen}
                      aria-controls={`${headingId}-form`}
                      onClick={() => setOpen(isOpen ? null : section)}
                    >
                      {isOpen ? <CheckIcon aria-hidden="true" /> : <PencilIcon aria-hidden="true" />}
                      {isOpen ? t('host.create.done') : t('host.create.change')}
                    </Button>
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {(summary.length > 0 ? summary : [t('host.create.noBonuses')]).map((item) => (
                      <li key={item} className="rounded-full bg-muted px-2.5 py-1 text-sm font-semibold">
                        {item}
                      </li>
                    ))}
                  </ul>
                  {isOpen && (
                    <div id={`${headingId}-form`} className="animate-fade-up border-t pt-4">
                      <GameSettingsForm value={settings} onChange={setSettings} sections={[section]} />
                    </div>
                  )}
                </section>
              )
            })}
          </div>

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
