import type { PlayerQuestionResult, PlayerSnapshot } from '@quizmoo/shared'
import { Link } from '@tanstack/react-router'
import { TrophyIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CheckIcon, CrossIcon } from '../../components/icons'
import { celebrate } from '../../lib/confetti'
import { stagger } from '../../lib/motion'
import { forgetPlayer } from '../../lib/player-storage'
import { CorrectAnswer } from '../questions/correct-answer'
import { formatAnswer } from '../questions/format-answer'
import { PodiumStage } from '../screen/podium'

export function Podium({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  const myTeam = snapshot.teams.find((team) => team.id === snapshot.me.teamId)
  const onPodium = !snapshot.resultsPending && (snapshot.mode === 'team' ? (myTeam?.rank ?? 99) : snapshot.me.rank) <= 3

  // Confetti for the top three once the results are in (the podium stage below celebrates nobody on phones).
  useEffect(() => {
    if (onPodium) void celebrate()
  }, [onPodium])

  if (snapshot.resultsPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="animate-pop text-3xl font-black">{t('play.gameOver')}</h1>
        <p className="text-lg text-foreground">{t('play.resultsComing')}</p>
      </div>
    )
  }
  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <h1 className="animate-pop text-3xl font-black">{t('play.gameOver')}</h1>
      <div className="w-full animate-pop rounded-3xl border bg-card p-5 text-center shadow-soft" style={stagger(1, 0, 200)}>
        {onPodium && <TrophyIcon className="mx-auto size-10 animate-float text-warning" aria-hidden="true" />}
        <p className="font-semibold text-muted-foreground">{onPodium ? t('play.finalRank') : t('play.wellPlayed')}</p>
        <p className="text-6xl font-black">{snapshot.me.rank}.</p>
        <p className="text-lg font-semibold">{t('play.totalScore', { score: snapshot.me.score })}</p>
        {myTeam && <p className="text-foreground">{t('play.teamRank', { team: myTeam.name, rank: myTeam.rank })}</p>}
      </div>
      <h2 className="text-xl font-extrabold">{t('play.podium')}</h2>
      <PodiumStage places={snapshot.mode === 'team' ? snapshot.teams : snapshot.players} compact celebrate={false} />
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
      <h2 className="text-center text-xl font-extrabold">{t('play.yourAnswers')}</h2>
      <ol className="flex flex-col gap-2">
        {results.map(({ question, answer, correct, points }, index) => (
          <li
            key={question.id}
            className={`flex flex-col gap-1 rounded-xl px-4 py-3 ${correct === true ? 'border-2 border-success bg-success/15' : correct === false ? 'border-2 border-destructive bg-destructive/10' : 'border bg-card'}`}
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
            <div className="text-sm">
              <CorrectAnswer question={question} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
