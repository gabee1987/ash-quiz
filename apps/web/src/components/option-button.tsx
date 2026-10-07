import type { ButtonHTMLAttributes } from 'react'
import { CheckIcon, ShapeIcon } from './icons'
import { optionColour } from './option-colours'

/**
 * Answer option. Plain with a letter (A, B, C…), or coloured with a shape. The projector
 * (`large`) is always coloured so the room can follow the bars; phones follow the game setting.
 */
export function OptionButton({
  index,
  label,
  imageId,
  selected = false,
  dimmed = false,
  large = false,
  colourful = large,
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
  colourful?: boolean
}) {
  const size = large ? 'min-h-28 px-8 py-5 text-4xl' : 'min-h-16 px-4 py-3 text-lg'
  const look = colourful
    ? `shadow-md ${optionColour(index)} ${selected ? 'ring-4 ring-white' : ''}`
    : `border ${selected ? 'border-white bg-brand text-white' : 'border-white/25 bg-white/10 text-white enabled:hover:bg-white/15'}`
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={`flex items-center gap-3 rounded-xl text-left font-semibold active:scale-[0.98] disabled:cursor-default ${size} ${look} ${dimmed ? 'opacity-40' : ''} ${className}`}
    >
      {colourful ? (
        <ShapeIcon index={index} className="size-[1.4em] shrink-0" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base font-bold"
        >
          {String.fromCharCode(65 + index)}
        </span>
      )}
      {imageId && <img src={`/api/images/${imageId}`} alt="" className="h-[2.5em] w-auto shrink-0 rounded object-contain" />}
      <span className="flex-1 wrap-break-word">{label}</span>
      {selected && <CheckIcon className="size-6 shrink-0" />}
    </button>
  )
}
