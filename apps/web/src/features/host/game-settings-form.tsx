import { gameSettingsSchema, gameThemes, type GameSettings } from '@ash-quiz/shared'
import type { TFunction } from 'i18next'
import { XIcon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceCards } from '@/components/choice-cards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { themeSwatches } from '@/lib/themes'

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
    `${t('host.create.finalResults')}: ${t(`host.create.finalResultsOptions.${settings.finalResults}`)}`,
    t(`host.create.answerStyleOptions.${settings.answerStyle}`),
    `${t('host.create.theme')}: ${t(`host.create.themeOptions.${settings.theme}`)}`,
    settings.speedBonus ? t('host.create.speedBonus') : null,
    settings.shuffleOptions ? t('host.create.shuffle') : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Every game setting. Used in the quiz editor (the quiz's defaults) and when starting a game (overrides). */
export function GameSettingsForm({ value, onChange }: { value: GameSettings; onChange: (settings: GameSettings) => void }) {
  const { t } = useTranslation()
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
    <div className="flex flex-col gap-6">
      <ChoiceCards
        legend={t('host.create.mode')}
        value={value.mode}
        choices={(['classic', 'team'] as const).map((mode) => ({
          value: mode,
          label: t(`host.create.modes.${mode}`),
          description: t(`host.create.modes.${mode}Help`),
        }))}
        onChange={(mode) =>
          set(
            mode === 'team' && value.teamNames.length === 0
              ? { mode, teamNames: [t('host.create.defaultTeam', { n: 1 }), t('host.create.defaultTeam', { n: 2 })] }
              : { mode },
          )
        }
      />

      {value.mode === 'team' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-bold">{t('host.create.teams')}</legend>
          <ul className="flex flex-wrap gap-2">
            {value.teamNames.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-3 font-semibold text-secondary-foreground"
              >
                <span>{name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 rounded-full"
                  aria-label={t('host.create.removeTeam', { name })}
                  onClick={() => set({ teamNames: value.teamNames.filter((_, j) => j !== i) })}
                >
                  <XIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
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
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={addTeam}>
              {t('host.create.addTeam')}
            </Button>
          </div>
          {error && <p className="text-sm font-semibold text-destructive">{t(error)}</p>}
        </fieldset>
      )}

      <ChoiceCards
        legend={t('host.create.theme')}
        value={value.theme}
        choices={gameThemes.map((theme) => ({
          value: theme,
          label: t(`host.create.themeOptions.${theme}`),
          adornment: <ThemeSwatch colours={themeSwatches(theme)} />,
        }))}
        onChange={(theme) => set({ theme })}
        help={t('host.create.themeHelp')}
      />
      <ChoiceCards
        legend={t('host.create.revealAnswers')}
        value={value.revealAnswers}
        choices={choices(['afterQuestion', 'atEnd'] as const, (v) => t(`host.create.revealAnswersOptions.${v}`))}
        // Scores would give the answers away, so results at the end means no scoreboard until then.
        onChange={(revealAnswers) => set(revealAnswers === 'atEnd' ? { revealAnswers, scoreboard: 'onDemand' } : { revealAnswers })}
      />
      <ChoiceCards
        legend={t('host.create.scoreboard')}
        value={value.scoreboard}
        choices={choices(['afterQuestion', 'onDemand'] as const, (v) => t(`host.create.scoreboardOptions.${v}`))}
        onChange={(scoreboard) => set({ scoreboard })}
        disabled={value.revealAnswers === 'atEnd'}
        help={value.revealAnswers === 'atEnd' ? t('host.create.scoreboardAtEnd') : undefined}
      />
      <ChoiceCards
        legend={t('host.create.finalResults')}
        value={value.finalResults}
        choices={choices(['immediately', 'onRelease'] as const, (v) => t(`host.create.finalResultsOptions.${v}`))}
        onChange={(finalResults) => set({ finalResults })}
        help={value.finalResults === 'onRelease' ? t('host.create.finalResultsHelp') : undefined}
      />
      <ChoiceCards
        legend={t('host.create.answerStyle')}
        value={value.answerStyle}
        choices={choices(['plain', 'colourful'] as const, (v) => t(`host.create.answerStyleOptions.${v}`))}
        onChange={(answerStyle) => set({ answerStyle })}
        help={t('host.create.answerStyleHelp')}
      />

      <div className="flex flex-col">
        <SwitchRow
          label={t('host.create.speedBonus')}
          description={t('host.create.speedBonusHelp')}
          checked={value.speedBonus}
          onChange={(speedBonus) => set({ speedBonus })}
        />
        <SwitchRow
          label={t('host.create.shuffle')}
          checked={value.shuffleOptions}
          onChange={(shuffleOptions) => set({ shuffleOptions })}
        />
      </div>
    </div>
  )
}

function choices<T extends string>(values: readonly T[], label: (value: T) => string) {
  return values.map((value) => ({ value, label: label(value) }))
}

function ThemeSwatch({ colours }: { colours: readonly string[] }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 -space-x-1.5">
      {colours.map((colour) => (
        <span key={colour} className="size-6 rounded-full border-2 border-card" style={{ background: colour }} />
      ))}
    </span>
  )
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-muted-foreground">{description}</span>}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
