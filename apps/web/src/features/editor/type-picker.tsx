import { questionTypes, type QuestionType } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'

/** One button per question type with a one-line explanation. */
export function TypePicker({ onPick, onCancel }: { onPick: (type: QuestionType) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-3">
      <p className="font-semibold">{t('editor.pickType')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {questionTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onPick(type)}
            className="flex min-h-14 flex-col items-start justify-center rounded-lg bg-white/10 px-4 py-2 text-left hover:bg-white/20"
          >
            <span className="font-semibold">{t(`questionTypes.${type}`)}</span>
            <span className="text-xs text-white/70">{t(`questionTypes.${type}Help`)}</span>
          </button>
        ))}
      </div>
      <button type="button" className="min-h-10 self-start px-2 text-sm underline" onClick={onCancel}>
        {t('common.cancel')}
      </button>
    </div>
  )
}
