import type { Answer, PlayerSnapshot } from '@ash-quiz/shared'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormAlert } from '@/components/form-alert'
import { Timer } from '../../components/timer'
import { stagger } from '../../lib/motion'
import { emitAck } from '../../lib/socket'
import { QuestionInput } from '../questions/question-input'
import { Answered } from './answered'

/** Question phase. Keyed by question id by the caller, so local state resets per question. */
export function Question({ snapshot, clockOffset }: { snapshot: PlayerSnapshot; clockOffset: number }) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  const [closed, setClosed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const question = snapshot.question

  if (!question) return null
  if (snapshot.myAnswer) return <Answered snapshot={snapshot} />

  async function submit(answer: Answer) {
    if (!question) return
    setPending(true)
    setError(null)
    const res = await emitAck('player:answer', { questionId: question.id, answer })
    if ('error' in res) {
      setError(res.error)
      if (res.error === 'errors.questionClosed' || res.error === 'errors.alreadyAnswered') setClosed(true)
    }
    // On success the next snapshot carries myAnswer and switches to the answered view.
    setPending(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="animate-fade-up text-sm font-semibold text-muted-foreground">
        {t('play.questionOf', { index: snapshot.questionIndex + 1, count: snapshot.questionCount })}
      </p>
      {snapshot.questionEndsAt !== null && (
        <Timer endsAt={snapshot.questionEndsAt} totalMs={question.timeLimitSec * 1000} clockOffset={clockOffset} />
      )}
      <h1 className="animate-fade-up text-2xl font-black wrap-break-word" style={stagger(1, 0, 60)}>
        {question.text}
      </h1>
      {question.imageId && (
        <img
          src={`/api/images/${question.imageId}`}
          alt=""
          className="max-h-48 animate-pop self-center rounded-2xl object-contain shadow-soft"
          style={stagger(1, 0, 120)}
        />
      )}
      {error && <FormAlert>{t(error)}</FormAlert>}
      <QuestionInput
        question={question}
        mode="answer"
        disabled={pending || closed}
        pending={pending}
        colourful={snapshot.settings.answerStyle === 'colourful'}
        symbols={snapshot.settings.answerSymbols}
        onSubmit={(a) => void submit(a)}
      />
    </div>
  )
}
