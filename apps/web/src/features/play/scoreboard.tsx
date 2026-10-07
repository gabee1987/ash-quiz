import type { PlayerPublic, PlayerSnapshot, TeamPublic } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'

export function RankList({ players, meId, limit }: { players: PlayerPublic[]; meId?: string; limit: number }) {
  return (
    <ol className="flex w-full flex-col gap-2">
      {players.slice(0, limit).map((player) => (
        <li
          key={player.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-2 ${player.id === meId ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}
        >
          <span className="w-8 text-lg font-bold tabular-nums">{player.rank}.</span>
          <span className="flex-1 truncate">{player.name}</span>
          <span className="font-semibold tabular-nums">{player.score}</span>
        </li>
      ))}
    </ol>
  )
}

export function TeamRankList({ teams, myTeamId }: { teams: TeamPublic[]; myTeamId: string | null }) {
  return (
    <ol className="flex w-full flex-col gap-2">
      {teams.map((team) => (
        <li
          key={team.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-2 ${team.id === myTeamId ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}
        >
          <span className="w-8 text-lg font-bold tabular-nums">{team.rank}.</span>
          <span className="flex-1 truncate">{team.name}</span>
          <span className="font-semibold tabular-nums">{team.score}</span>
        </li>
      ))}
    </ol>
  )
}

export function Scoreboard({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  const myTeam = snapshot.teams.find((team) => team.id === snapshot.me.teamId)
  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-muted-foreground">{t('play.yourRank')}</p>
        <p className="text-6xl font-bold">{snapshot.me.rank}.</p>
        <p className="text-lg">{t('play.totalScore', { score: snapshot.me.score })}</p>
        {myTeam && <p className="text-foreground">{t('play.teamRank', { team: myTeam.name, rank: myTeam.rank })}</p>}
      </div>
      {snapshot.mode === 'team' && (
        <>
          <h2 className="text-xl font-semibold">{t('play.teamLeaderboard')}</h2>
          <TeamRankList teams={snapshot.teams} myTeamId={snapshot.me.teamId} />
        </>
      )}
      <h2 className="text-xl font-semibold">{t('play.leaderboard')}</h2>
      <RankList players={snapshot.players} meId={snapshot.me.id} limit={5} />
    </div>
  )
}
