import { useTranslation } from 'react-i18next'
import { OptionButton } from '../../components/option-button'
import type { QuestionProps } from './types'

export function TrueFalse({ mode, disabled, large, onSubmit }: QuestionProps<'truefalse'>) {
  const { t } = useTranslation()
  const choices = [
    { value: true, label: t('play.true') },
    { value: false, label: t('play.false') },
  ]
  return (
    <div className="grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
      {choices.map((choice, index) => (
        <OptionButton
          key={String(choice.value)}
          index={index}
          label={choice.label}
          large={large ?? false}
          disabled={mode === 'display' || disabled}
          onClick={() => onSubmit?.({ type: 'truefalse', value: choice.value })}
        />
      ))}
    </div>
  )
}
