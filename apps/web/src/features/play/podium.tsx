import type { PlayerQuestionResult, PlayerSnapshot } from '@ash-quiz/shared'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CheckIcon, CrossIcon } from '../../components/icons'
import { forgetPlayer } from '../../lib/player-storage'
import { CorrectAnswer } from '../questions/correct-answer'
import { formatAnswer } from '../questions/format-answer'
import { RankList, TeamRankList } from './scoreboard'

export function Podium({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  if (snapshot.resultsPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-3xl font-bold">{t('play.gameOver')}</h1>
        <p className="text-lg text-foreground">{t('play.resultsComing')}</p>
      </div>
    )
  }
  const topThree = snapshot.players.filter((p) => p.rank <= 3)
  const myTeam = snapshot.teams.find((team) => team.id === snapshot.me.teamId)
  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <h1 className="text-3xl font-bold">{t('play.gameOver')}</h1>
      <div className="text-center">
        <p className="text-muted-foreground">{t('play.finalRank')}</p>
        <p className="text-6xl font-bold">{snapshot.me.rank}.</p>
        <p className="text-lg">{t('play.totalScore', { score: snapshot.me.score })}</p>
        {myTeam && <p className="text-foreground">{t('play.teamRank', { team: myTeam.name, rank: myTeam.rank })}</p>}
      </div>
      <h2 className="text-xl font-semibold">{t('play.podium')}</h2>
      {snapshot.mode === 'team' ? (
        <TeamRankList teams={snapshot.teams.filter((team) => team.rank <= 3)} myTeamId={snapshot.me.teamId} />
      ) : (
        <RankList players={topThree} meId={snapshot.me.id} limit={topThree.length} />
      )}
      {snapshot.myResults && snapshot.myResults.length > 0 && <MyResults results={snapshot.myResults} />}
      <Button asChild size="lg" className="w-full">
        <Link to="/" onClick={() => forgetPlayer(snapshot.pin)}>
          {t('play.backToHome')}
        </Link>
      </Button>
    </div>
  )
}

/** The player's answer to every question next to the correct one. */
function MyResults({ results }: { results: PlayerQuestionResult[] }) {
  const { t, i18n } = useTranslation()
  return (
    <section className="flex w-full flex-col gap-2">
      <h2 className="text-center text-xl font-semibold">{t('play.yourAnswers')}</h2>
      <ol className="flex flex-col gap-2">
        {results.map(({ question, answer, correct, points }, index) => (
          <li
            key={question.id}
            className={`flex flex-col gap-1 rounded-lg px-4 py-3 ${correct === true ? 'border-2 border-success bg-success/15' : correct === false ? 'border-2 border-destructive bg-destructive/10' : 'border bg-card'}`}
          >
            <div className="flex items-start gap-2">
              <span className="font-bold tabular-nums">{index + 1}.</span>
              <p className="flex-1 font-semibold wrap-break-word">{question.text}</p>
              {correct === true && <CheckIcon className="size-6 shrink-0" />}
              {correct === false && <CrossIcon className="size-6 shrink-0" />}
            </div>
            <p className="text-sm wrap-break-word text-foreground">
              {t('play.yourAnswer')}:{' '}
              <span className="font-semibold">{answer ? formatAnswer(answer, question, t, i18n.language) : t('play.noAnswer')}</span>
              {question.type !== 'poll' && <> · {t('play.points', { count: points })}</>}
            </p>
            <div className="text-sm [&_p]:text-left">
              <CorrectAnswer question={question} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
