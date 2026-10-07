import { questionTypes, type QuestionType } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/** One button per question type with a one-line explanation. */
export function TypePicker({ onPick, onCancel }: { onPick: (type: QuestionType) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft">
      <p className="font-extrabold">{t('editor.pickType')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {questionTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onPick(type)}
            className="flex min-h-14 flex-col items-start justify-center rounded-xl border-2 bg-card px-4 py-2 text-left transition-colors outline-none hover:border-primary hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <span className="font-bold">{t(`questionTypes.${type}`)}</span>
            <span className="text-xs text-muted-foreground">{t(`questionTypes.${type}Help`)}</span>
          </button>
        ))}
      </div>
      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={onCancel}>
        {t('common.cancel')}
      </Button>
    </div>
  )
}
