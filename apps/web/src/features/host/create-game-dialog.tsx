import type { GameSettings } from '@ash-quiz/shared'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'

/** Game settings before creating the lobby: mode, team names, speed bonus, shuffle. */
export function CreateGameDialog({
  quizTitle,
  pending,
  error,
  onCreate,
  onCancel,
}: {
  quizTitle: string
  pending: boolean
  error: string | null
  onCreate: (settings: GameSettings) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<GameSettings['mode']>('classic')
  const [teamNames, setTeamNames] = useState<string[]>(() => [
    t('host.create.defaultTeam', { n: 1 }),
    t('host.create.defaultTeam', { n: 2 }),
  ])
  const [newTeam, setNewTeam] = useState('')
  const [speedBonus, setSpeedBonus] = useState(true)
  const [shuffleOptions, setShuffleOptions] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const names = teamNames.map((n) => n.trim()).filter(Boolean)
  const duplicate = new Set(names.map((n) => n.toLowerCase())).size !== names.length
  const teamsInvalid = mode === 'team' && (names.length < 2 || duplicate)

  function addTeam() {
    const name = newTeam.trim()
    if (!name || teamNames.length >= 20) return
    setTeamNames([...teamNames, name])
    setNewTeam('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (teamsInvalid) return
    onCreate({ mode, speedBonus, shuffleOptions, teamNames: mode === 'team' ? names : [] })
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

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-semibold">{t('host.create.mode')}</legend>
          {(['classic', 'team'] as const).map((value) => (
            <label key={value} className={`flex min-h-12 items-center gap-3 rounded-lg px-3 ${mode === value ? 'bg-brand' : 'bg-white/10'}`}>
              <input type="radio" name="mode" className="size-5" checked={mode === value} onChange={() => setMode(value)} />
              <span>
                <span className="block">{t(`host.create.modes.${value}`)}</span>
                <span className="block text-xs text-white/70">{t(`host.create.modes.${value}Help`)}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {mode === 'team' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-semibold">{t('host.create.teams')}</legend>
            <ul className="flex flex-wrap gap-2">
              {teamNames.map((name, i) => (
                <li key={`${name}-${i}`} className="flex items-center gap-1 rounded-full bg-white/15 py-1 pr-1 pl-3">
                  <span>{name}</span>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full hover:bg-white/20"
                    aria-label={t('host.create.removeTeam', { name })}
                    onClick={() => setTeamNames(teamNames.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTeam()
                  }
                }}
                maxLength={40}
                aria-label={t('host.create.teamName')}
                placeholder={t('host.create.teamName')}
                className="min-h-12 min-w-0 flex-1 rounded-lg bg-white px-3 text-black"
              />
              <Button type="button" variant="secondary" onClick={addTeam}>
                {t('host.create.addTeam')}
              </Button>
            </div>
            {teamsInvalid && (
              <p className="text-sm text-red-300">{duplicate ? t('host.create.duplicateTeams') : t('host.create.needTwoTeams')}</p>
            )}
          </fieldset>
        )}

        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="size-5" checked={speedBonus} onChange={(e) => setSpeedBonus(e.target.checked)} />
          <span>
            <span className="block">{t('host.create.speedBonus')}</span>
            <span className="block text-xs text-white/70">{t('host.create.speedBonusHelp')}</span>
          </span>
        </label>
        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="size-5" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
          <span>{t('host.create.shuffle')}</span>
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-3 text-red-200">
            {t(error)}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1" disabled={pending || teamsInvalid}>
            {t('host.create.submit')}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
