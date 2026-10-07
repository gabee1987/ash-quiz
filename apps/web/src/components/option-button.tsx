import type { ButtonHTMLAttributes } from 'react'
import { CheckIcon, ShapeIcon } from './icons'
import { optionColour } from './option-colours'

export function OptionButton({
  index,
  label,
  imageId,
  selected = false,
  dimmed = false,
  large = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  index: number
  label: string
  imageId?: string | undefined
  selected?: boolean
  dimmed?: boolean
  /** Projector size. */
  large?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={`flex items-center gap-3 rounded-xl text-left font-semibold ${large ? 'min-h-28 px-8 py-5 text-4xl' : 'min-h-16 px-4 py-3 text-lg'} shadow-md active:scale-[0.98] disabled:cursor-default ${optionColour(index)} ${selected ? 'ring-4 ring-white' : ''} ${dimmed ? 'opacity-40' : ''} ${className}`}
    >
      <ShapeIcon index={index} className="size-[1.4em] shrink-0" />
      {imageId && <img src={`/api/images/${imageId}`} alt="" className="h-[2.5em] w-auto shrink-0 rounded object-contain" />}
      <span className="flex-1 wrap-break-word">{label}</span>
      {selected && <CheckIcon className="size-6 shrink-0" />}
    </button>
  )
}
