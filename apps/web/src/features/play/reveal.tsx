import type { PlayerSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { CheckIcon, CrossIcon } from '../../components/icons'
import { CorrectAnswer } from '../questions/correct-answer'

export function Reveal({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  const question = snapshot.reveal?.question
  const isPoll = question?.type === 'poll'
  const answered = snapshot.myAnswer !== null
  const correct = snapshot.lastCorrect

  let tone = 'bg-white/10'
  let title = t('play.noAnswer')
  if (isPoll) title = answered ? t('play.thanksForVoting') : t('play.noAnswer')
  else if (correct === true) [tone, title] = ['bg-green-600', t('play.correct')]
  else if (correct === false) [tone, title] = ['bg-red-600', t('play.wrong')]
  else if (answered) title = t('play.awaitingGrading')

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <div className={`flex w-full flex-col items-center gap-2 rounded-2xl px-4 py-8 ${tone}`}>
        {correct === true && <CheckIcon className="size-14" />}
        {correct === false && <CrossIcon className="size-14" />}
        <h1 className="text-3xl font-bold">{title}</h1>
        {!isPoll && snapshot.lastPoints !== null && (
          <p className="text-xl font-semibold">{t('play.points', { count: snapshot.lastPoints })}</p>
        )}
      </div>
      {question && <CorrectAnswer question={question} />}
      <p className="text-white/70">
        {t('play.totalScore', { score: snapshot.me.score })} · {t('play.rank', { rank: snapshot.me.rank })}
      </p>
    </div>
  )
}
