import type { Question } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { QuestionInput } from '../questions/question-input'

/** The selected question as a player sees it, inside a 375 px phone frame. */
export function PhonePreview({
  question,
  index,
  count,
  colourful,
}: {
  question: Question | null
  index: number
  count: number
  /** The quiz's answer button style. */
  colourful: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto w-[375px] max-w-full rounded-[2.5rem] border-8 border-foreground/85 bg-background p-4 shadow-soft">
      {question ? (
        // Inert: a preview, not a playable question.
        <div className="pointer-events-none flex min-h-[600px] flex-col gap-4" inert>
          <p className="text-sm text-muted-foreground">{t('play.questionOf', { index: index + 1, count })}</p>
          <div className="h-3 rounded-full bg-primary" />
          <p className="text-2xl font-bold wrap-break-word">{question.text || t('editor.untitledQuestion')}</p>
          {question.imageId && (
            <img src={`/api/images/${question.imageId}`} alt="" className="max-h-48 self-center rounded-lg object-contain" />
          )}
          <QuestionInput question={question} mode="answer" colourful={colourful} />
        </div>
      ) : (
        <p className="flex min-h-[600px] items-center justify-center text-center text-muted-foreground">{t('editor.previewEmpty')}</p>
      )}
    </div>
  )
}
