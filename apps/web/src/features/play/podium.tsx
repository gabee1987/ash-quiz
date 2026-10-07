import type { PlayerSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { RankList, TeamRankList } from './scoreboard'

export function Podium({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  const topThree = snapshot.players.filter((p) => p.rank <= 3)
  const myTeam = snapshot.teams.find((team) => team.id === snapshot.me.teamId)
  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <h1 className="text-3xl font-bold">{t('play.gameOver')}</h1>
      <div className="text-center">
        <p className="text-white/70">{t('play.finalRank')}</p>
        <p className="text-6xl font-bold">{snapshot.me.rank}.</p>
        <p className="text-lg">{t('play.totalScore', { score: snapshot.me.score })}</p>
        {myTeam && <p className="text-white/80">{t('play.teamRank', { team: myTeam.name, rank: myTeam.rank })}</p>}
      </div>
      <h2 className="text-xl font-semibold">{t('play.podium')}</h2>
      {snapshot.mode === 'team' ? (
        <TeamRankList teams={snapshot.teams.filter((team) => team.rank <= 3)} myTeamId={snapshot.me.teamId} />
      ) : (
        <RankList players={topThree} meId={snapshot.me.id} limit={topThree.length} />
      )}
    </div>
  )
}
