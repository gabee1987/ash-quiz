import type { GameSettings } from '@ash-quiz/shared'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'
import { GameSettingsForm, settingsError, settingsSummary } from './game-settings-form'

/** Starts a game with the quiz's settings; they can be changed for this game only in a collapsible section. */
export function CreateGameDialog({
  quizTitle,
  quizSettings,
  pending,
  error,
  onCreate,
  onCancel,
}: {
  quizTitle: string
  quizSettings: GameSettings
  pending: boolean
  error: string | null
  onCreate: (settings: GameSettings) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState(quizSettings)
  const dialog = useRef<HTMLDialogElement>(null)
  const invalid = settingsError(settings) !== null

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!invalid) onCreate(settings)
  }

  return (
    <dialog
      ref={dialog}
      onCancel={onCancel}
      aria-labelledby="create-game-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-brand-dark p-0 text-white backdrop:bg-black/70"
    >
      <form className="flex flex-col gap-4 p-5" onSubmit={submit}>
        <div>
          <h2 id="create-game-title" className="text-xl font-bold">
            {t('host.create.title')}
          </h2>
          <p className="text-sm text-white/70 wrap-break-word">{quizTitle}</p>
        </div>

        <p className="rounded-lg bg-white/10 px-3 py-2 text-sm">{settingsSummary(settings, t)}</p>
        <details className="rounded-lg bg-white/5 px-3 py-2">
          <summary className="flex min-h-10 cursor-pointer items-center font-semibold">{t('host.create.changeForGame')}</summary>
          <div className="pt-3">
            <GameSettingsForm value={settings} onChange={setSettings} />
          </div>
        </details>

        {error && (
          <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
            {t(error)}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1" disabled={pending || invalid}>
            {t('host.create.submit')}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
