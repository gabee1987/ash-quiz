import type { Option } from '@ash-quiz/shared'
import { useTranslation } from 'react-i18next'
import { PlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShapeIcon } from '../../components/icons'
import { optionColour } from '../../components/option-colours'
import { newId, withImage } from './draft'
import { ImageField } from './image-field'
import type { FieldErrors } from './validate'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

/**
 * Option rows for single, multiple and poll questions. The correct marker is a radio
 * (single), a checkbox (multiple) or absent (poll).
 */
export function OptionsEditor({
  options,
  marker,
  correctIds,
  onOptions,
  onCorrect,
  errors,
  path,
}: {
  options: Option[]
  marker: 'radio' | 'checkbox' | 'none'
  correctIds: string[]
  onOptions: (options: Option[]) => void
  onCorrect: (ids: string[]) => void
  errors: FieldErrors
  /** Error path of this question, e.g. "questions.2". */
  path: string
}) {
  const { t } = useTranslation()
  const update = (index: number, option: Option) => onOptions(options.map((o, i) => (i === index ? option : o)))
  const remove = (index: number) => {
    const removed = options[index]!
    onOptions(options.filter((_, i) => i !== index))
    if (correctIds.includes(removed.id)) onCorrect(correctIds.filter((id) => id !== removed.id))
  }
  const toggleCorrect = (id: string) => {
    if (marker === 'radio') onCorrect([id])
    else onCorrect(correctIds.includes(id) ? correctIds.filter((x) => x !== id) : [...correctIds, id])
  }
  const correctError = errors[`${path}.correctOptionId`] ?? errors[`${path}.correctOptionIds`]
  const listError = errors[`${path}.options`]

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">
        {marker === 'none' ? t('editor.options') : marker === 'radio' ? t('editor.optionsMarkOne') : t('editor.optionsMarkAll')}
      </legend>
      {options.map((option, index) => {
        const textError = errors[`${path}.options.${index}.text`]
        const correct = correctIds.includes(option.id)
        return (
          <div
            key={option.id}
            className={`flex flex-col gap-2 rounded-2xl border-2 p-2 transition-colors ${correct ? 'border-success bg-success/10' : 'bg-card'}`}
          >
            <div className="flex items-center gap-2">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${optionColour(index)}`}>
                <ShapeIcon index={index} className="size-5" />
              </span>
              <Input
                value={option.text}
                maxLength={200}
                onChange={(e) => update(index, { ...option, text: e.target.value })}
                aria-label={t('editor.optionText', { n: index + 1 })}
                placeholder={t('editor.optionText', { n: index + 1 })}
                aria-invalid={textError ? true : undefined}
                className="flex-1"
              />
              {marker !== 'none' && (
                <label className="flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-1 text-sm font-semibold has-focus-visible:ring-[3px] has-focus-visible:ring-ring">
                  <input
                    type={marker}
                    name={`${path}-correct`}
                    className="size-5 accent-success"
                    checked={correct}
                    onChange={() => toggleCorrect(option.id)}
                  />
                  <span className="hidden sm:inline">{t('editor.correct')}</span>
                  <span className="sr-only sm:hidden">{t('editor.correct')}</span>
                </label>
              )}
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-30"
                disabled={options.length <= MIN_OPTIONS}
                aria-label={t('editor.removeOption', { n: index + 1 })}
                onClick={() => remove(index)}
              >
                <XIcon className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="pl-12">
              <ImageField
                compact
                label={t('editor.optionImage', { n: index + 1 })}
                imageId={option.imageId}
                onChange={(imageId) => update(index, withImage(option, imageId))}
              />
            </div>
            {textError && <p className="pl-12 text-sm font-semibold text-destructive">{t(textError)}</p>}
          </div>
        )
      })}
      {(correctError || listError) && <p className="text-sm font-semibold text-destructive">{t(correctError ?? listError!)}</p>}
      {options.length < MAX_OPTIONS && (
        <Button type="button" variant="outline" onClick={() => onOptions([...options, { id: newId(), text: '' }])}>
          <PlusIcon aria-hidden="true" />
          {t('editor.addOption')}
        </Button>
      )}
    </fieldset>
  )
}
