import type { HostSnapshot, PlayerPublic } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'

export function ScreenScoreboard({ host }: { host: HostSnapshot }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-5xl font-bold">{t('play.leaderboard')}</h1>
      {host.mode === 'team' ? <TeamBoard host={host} /> : <PlayerRows players={host.players.slice(0, 10)} />}
    </div>
  )
}

function PlayerRows({ players, compact = false }: { players: PlayerPublic[]; compact?: boolean }) {
  return (
    <ol className={`flex flex-col ${compact ? 'gap-1 text-2xl' : 'gap-3 text-4xl'}`}>
      {players.map((player) => (
        <li key={player.id} className="flex items-center gap-4 rounded-xl bg-card border px-6 py-2">
          <span className="w-16 font-bold tabular-nums">{player.rank}.</span>
          <span className="flex-1 truncate">{player.name}</span>
          {player.roundPoints > 0 && <span className="text-success tabular-nums">+{player.roundPoints}</span>}
          <span className="w-40 text-right font-bold tabular-nums">{player.score}</span>
        </li>
      ))}
    </ol>
  )
}

/** Team ranking with each team's members underneath. */
function TeamBoard({ host }: { host: HostSnapshot }) {
  return (
    <ol className="grid gap-4 xl:grid-cols-2">
      {host.teams.map((team) => (
        <li key={team.id} className="flex flex-col gap-2 rounded-2xl bg-card border p-4">
          <div className="flex items-center gap-4 text-4xl font-bold">
            <span className="w-16 tabular-nums">{team.rank}.</span>
            <span className="flex-1 truncate">{team.name}</span>
            <span className="tabular-nums">{team.score}</span>
          </div>
          <PlayerRows players={host.players.filter((p) => p.teamId === team.id).slice(0, 5)} compact />
        </li>
      ))}
    </ol>
  )
}
