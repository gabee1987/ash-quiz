import type { PlayerSnapshot } from '@ash-quiz/shared'
import { PartyPopperIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { WaitingDots } from '../../components/waiting-dots'

export function Lobby({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  const team = snapshot.teams.find((x) => x.id === snapshot.me.teamId)
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="glow-border flex w-full max-w-sm animate-pop flex-col items-center gap-3 rounded-3xl bg-card p-6 shadow-soft">
        <span className="grid size-16 animate-float place-items-center rounded-2xl bg-accent text-accent-foreground">
          <PartyPopperIcon className="size-8" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-muted-foreground wrap-break-word">{snapshot.quizTitle}</p>
        <h1 className="text-3xl font-black wrap-break-word">{t('play.youAreIn', { name: snapshot.me.name })}</h1>
        {team && (
          <p className="rounded-full bg-secondary px-3 py-1 font-bold text-secondary-foreground">{t('play.yourTeam', { team: team.name })}</p>
        )}
      </div>
      <p className="flex items-center gap-2 font-semibold text-muted-foreground">
        {t('play.waitingForHost')}
        <WaitingDots />
      </p>
      {/* Keyed by the count so the badge pops each time someone joins. */}
      <p key={snapshot.players.length} className="animate-pop rounded-full bg-muted px-4 py-1.5 text-sm font-bold">
        {t('play.playerCount', { count: snapshot.players.length })}
      </p>
    </div>
  )
}
