import type { PlayerSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'

export function Lobby({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  const team = snapshot.teams.find((x) => x.id === snapshot.me.teamId)
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg text-white/70">{snapshot.quizTitle}</p>
      <h1 className="text-3xl font-bold break-words">{t('play.youAreIn', { name: snapshot.me.name })}</h1>
      {team && <p className="text-lg">{t('play.yourTeam', { team: team.name })}</p>}
      <p className="text-white/70">{t('play.waitingForHost')}</p>
      <p className="text-sm text-white/50">{t('play.playerCount', { count: snapshot.players.length })}</p>
    </div>
  )
}
