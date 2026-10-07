import { gameSettingsSchema, type GameSettings } from '@ash-quiz/shared'
import type { TFunction } from 'i18next'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button'

/** i18n key of the first settings problem (team names), or null when the settings are valid. */
export function settingsError(settings: GameSettings): string | null {
  const result = gameSettingsSchema.safeParse(settings)
  return result.success ? null : (result.error.issues[0]?.message ?? 'errors.invalidInput')
}

/** One line describing the settings, e.g. "Classic · After each question · Plain · Speed bonus". */
export function settingsSummary(settings: GameSettings, t: TFunction): string {
  return [
    t(`host.create.modes.${settings.mode}`),
    settings.mode === 'team' ? settings.teamNames.join(', ') : null,
    `${t('host.create.revealAnswers')}: ${t(`host.create.revealAnswersOptions.${settings.revealAnswers}`)}`,
    settings.revealAnswers === 'afterQuestion'
      ? `${t('host.create.scoreboard')}: ${t(`host.create.scoreboardOptions.${settings.scoreboard}`)}`
      : null,
    t(`host.create.answerStyleOptions.${settings.answerStyle}`),
    settings.speedBonus ? t('host.create.speedBonus') : null,
    settings.shuffleOptions ? t('host.create.shuffle') : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Every game setting. Used in the quiz editor (the quiz's defaults) and when starting a game (overrides). */
export function GameSettingsForm({ value, onChange }: { value: GameSettings; onChange: (settings: GameSettings) => void }) {
  const { t } = useTranslation()
  const id = useId()
  const [newTeam, setNewTeam] = useState('')
  const set = (patch: Partial<GameSettings>) => onChange({ ...value, ...patch })
  const error = settingsError(value)

  function addTeam() {
    const name = newTeam.trim()
    if (!name || value.teamNames.length >= 20) return
    set({ teamNames: [...value.teamNames, name] })
    setNewTeam('')
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">{t('host.create.mode')}</legend>
        {(['classic', 'team'] as const).map((mode) => (
          <label key={mode} className={`flex min-h-12 items-center gap-3 rounded-lg px-3 ${value.mode === mode ? 'bg-brand' : 'bg-white/10'}`}>
            <input
              type="radio"
              name={`${id}-mode`}
              className="size-5"
              checked={value.mode === mode}
              onChange={() =>
                set(
                  mode === 'team' && value.teamNames.length === 0
                    ? { mode, teamNames: [t('host.create.defaultTeam', { n: 1 }), t('host.create.defaultTeam', { n: 2 })] }
                    : { mode },
                )
              }
            />
            <span>
              <span className="block">{t(`host.create.modes.${mode}`)}</span>
              <span className="block text-xs text-white/70">{t(`host.create.modes.${mode}Help`)}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {value.mode === 'team' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-semibold">{t('host.create.teams')}</legend>
          <ul className="flex flex-wrap gap-2">
            {value.teamNames.map((name, i) => (
              <li key={`${name}-${i}`} className="flex items-center gap-1 rounded-full bg-white/15 py-1 pr-1 pl-3">
                <span>{name}</span>
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full hover:bg-white/20"
                  aria-label={t('host.create.removeTeam', { name })}
                  onClick={() => set({ teamNames: value.teamNames.filter((_, j) => j !== i) })}
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
          {error && <p className="text-sm text-red-300">{t(error)}</p>}
        </fieldset>
      )}

      <RadioGroup
        legend={t('host.create.revealAnswers')}
        name={`${id}-reveal`}
        value={value.revealAnswers}
        options={['afterQuestion', 'atEnd'] as const}
        labelKey={(v) => `host.create.revealAnswersOptions.${v}`}
        // Scores would give the answers away, so results at the end means no scoreboard until then.
        onChange={(revealAnswers) => set(revealAnswers === 'atEnd' ? { revealAnswers, scoreboard: 'onDemand' } : { revealAnswers })}
      />
      <RadioGroup
        legend={t('host.create.scoreboard')}
        name={`${id}-scoreboard`}
        value={value.scoreboard}
        options={['afterQuestion', 'onDemand'] as const}
        labelKey={(v) => `host.create.scoreboardOptions.${v}`}
        onChange={(scoreboard) => set({ scoreboard })}
        disabled={value.revealAnswers === 'atEnd'}
        help={value.revealAnswers === 'atEnd' ? t('host.create.scoreboardAtEnd') : undefined}
      />
      <RadioGroup
        legend={t('host.create.answerStyle')}
        name={`${id}-answer-style`}
        value={value.answerStyle}
        options={['plain', 'colourful'] as const}
        labelKey={(v) => `host.create.answerStyleOptions.${v}`}
        onChange={(answerStyle) => set({ answerStyle })}
        help={t('host.create.answerStyleHelp')}
      />

      <label className="flex min-h-12 items-center gap-3">
        <input type="checkbox" className="size-5" checked={value.speedBonus} onChange={(e) => set({ speedBonus: e.target.checked })} />
        <span>
          <span className="block">{t('host.create.speedBonus')}</span>
          <span className="block text-xs text-white/70">{t('host.create.speedBonusHelp')}</span>
        </span>
      </label>
      <label className="flex min-h-12 items-center gap-3">
        <input
          type="checkbox"
          className="size-5"
          checked={value.shuffleOptions}
          onChange={(e) => set({ shuffleOptions: e.target.checked })}
        />
        <span>{t('host.create.shuffle')}</span>
      </label>
    </div>
  )
}

function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  labelKey,
  onChange,
  disabled = false,
  help,
}: {
  legend: string
  name: string
  value: T
  options: readonly T[]
  labelKey: (value: T) => string
  onChange: (value: T) => void
  disabled?: boolean
  help?: string | undefined
}) {
  const { t } = useTranslation()
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-1 font-semibold">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex min-h-12 items-center gap-3 rounded-lg px-3 ${value === option ? 'bg-brand' : 'bg-white/10'} ${disabled ? 'opacity-60' : ''}`}
          >
            <input type="radio" name={name} className="size-5" checked={value === option} onChange={() => onChange(option)} />
            <span>{t(labelKey(option))}</span>
          </label>
        ))}
      </div>
      {help && <p className="text-xs text-white/70">{help}</p>}
    </fieldset>
  )
}
