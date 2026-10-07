import { useTranslation } from 'react-i18next'
import { OptionButton } from '../../components/option-button'
import type { QuestionProps } from './types'

export function TrueFalse({ mode, disabled, large, colourful, onSubmit }: QuestionProps<'truefalse'>) {
  const { t } = useTranslation()
  const choices = [
    { value: true, label: t('play.true') },
    { value: false, label: t('play.false') },
  ]
  return (
    <div className="@container flex flex-1 flex-col">
      <div className="grid flex-1 auto-rows-fr gap-3 @md:grid-cols-2">
      {choices.map((choice, index) => (
        <OptionButton
          key={String(choice.value)}
          index={index}
          label={choice.label}
          large={large ?? false}
          colourful={colourful ?? large ?? false}
          disabled={mode === 'display' || disabled}
          onClick={() => onSubmit?.({ type: 'truefalse', value: choice.value })}
        />
      ))}
      </div>
    </div>
  )
}
