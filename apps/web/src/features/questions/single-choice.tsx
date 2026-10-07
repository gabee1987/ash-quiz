import { OptionButton } from '../../components/option-button'
import type { QuestionProps } from './types'

/** Tap to submit. Polls share this layout. */
export function SingleChoice({ question, mode, disabled, onSubmit }: QuestionProps<'single' | 'poll'>) {
  return (
    <div className="grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
      {question.options.map((option, index) => (
        <OptionButton
          key={option.id}
          index={index}
          label={option.text}
          disabled={mode === 'display' || disabled}
          onClick={() => onSubmit?.({ type: question.type, optionId: option.id })}
        />
      ))}
    </div>
  )
}
