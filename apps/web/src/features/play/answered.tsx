import type { PlayerSnapshot } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { CheckIcon } from '../../components/icons'

export function Answered({ snapshot }: { snapshot: PlayerSnapshot }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <CheckIcon className="size-16" />
      <h1 className="text-2xl font-bold">{t('play.answerSent')}</h1>
      <p className="text-white/70">
        {t('play.answeredSoFar', { answered: snapshot.answeredCount, count: snapshot.players.length })}
      </p>
    </div>
  )
}
