import type { Question } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { QuestionInput } from '../questions/question-input'

/** The selected question as a player sees it, inside a 375 px phone frame. */
export function PhonePreview({ question, index, count }: { question: Question | null; index: number; count: number }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto w-[375px] max-w-full rounded-[2rem] border-8 border-black bg-brand-dark p-4 shadow-2xl">
      {question ? (
        // Inert: a preview, not a playable question.
        <div className="pointer-events-none flex min-h-[600px] flex-col gap-4" inert>
          <p className="text-sm text-white/60">{t('play.questionOf', { index: index + 1, count })}</p>
          <div className="h-3 rounded-full bg-white" />
          <p className="text-2xl font-bold wrap-break-word">{question.text || t('editor.untitledQuestion')}</p>
          {question.imageId && (
            <img src={`/api/images/${question.imageId}`} alt="" className="max-h-48 self-center rounded-lg object-contain" />
          )}
          <QuestionInput question={question} mode="answer" />
        </div>
      ) : (
        <p className="flex min-h-[600px] items-center justify-center text-center text-white/60">{t('editor.previewEmpty')}</p>
      )}
    </div>
  )
}
