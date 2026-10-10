import type { Answer, PlayerSnapshot } from '@quizmoo/shared'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormAlert } from '@/components/form-alert'
import { PausedNote } from '@/components/paused-note'
import { Timer } from '../../components/timer'
import { stagger } from '../../lib/motion'
import { sendAnswer } from '../../lib/socket'
import { QuestionInput } from '../questions/question-input'
import { Answered } from './answered'

/** Question phase. Keyed by question id by the caller, so local state resets per question. */
export function Question({ snapshot, clockOffset }: { snapshot: PlayerSnapshot; clockOffset: number }) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  const [closed, setClosed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const question = snapshot.question
  const paused = snapshot.pausedAt !== null

  if (!question) return null
  if (snapshot.myAnswer) return <Answered snapshot={snapshot} />

  async function submit(answer: Answer) {
    if (!question) return
    setPending(true)
    setError(null)
    // Stays pending through a reconnect and one retry.
    const res = await sendAnswer({ questionId: question.id, answer })
    if ('error' in res) {
      if (res.error === 'errors.answerNotSent') toast.error(t(res.error), { id: res.error })
      else setError(res.error)
      if (res.error === 'errors.questionClosed' || res.error === 'errors.alreadyAnswered') setClosed(true)
    }
    // On success the next snapshot carries myAnswer and switches to the answered view.
    setPending(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Tall enough to keep the timer below the floating settings button. */}
      <p className="flex min-h-10 animate-fade-up items-center pr-12 text-sm font-semibold text-muted-foreground">
        {t('play.questionOf', { index: snapshot.questionIndex + 1, count: snapshot.questionCount })}
      </p>
      {snapshot.questionEndsAt !== null && (
        <Timer
          endsAt={snapshot.questionEndsAt}
          totalMs={question.timeLimitSec * 1000}
          clockOffset={clockOffset}
          pausedAt={snapshot.pausedAt}
        />
      )}
      {paused && <PausedNote />}
      <h1 className="animate-fade-up text-2xl font-black wrap-break-word" style={stagger(1, 0, 60)}>
        {question.text}
      </h1>
      {/*
        The image takes the space the answers leave (3 : 2 with them) and shrinks to fit, so the
        image and every answer are on screen together; it never gets smaller than 7 rem.
      */}
      {question.imageId && (
        <div className="relative min-h-28 flex-3">
          <img
            src={`/api/images/${question.imageId}`}
            alt=""
            className="absolute inset-0 m-auto max-h-full max-w-full animate-pop rounded-2xl object-contain shadow-soft"
            style={stagger(1, 0, 120)}
          />
        </div>
      )}
      {error && <FormAlert>{t(error)}</FormAlert>}
      <div className="flex flex-2 flex-col">
        <QuestionInput
          question={question}
          mode="answer"
          disabled={pending || closed || paused}
          pending={pending}
          colourful={snapshot.settings.answerStyle === 'colourful'}
          symbols={snapshot.settings.answerSymbols}
          onSubmit={(a) => void submit(a)}
        />
      </div>
    </div>
  )
}
