import type { ButtonHTMLAttributes } from 'react'
import { CheckIcon, ShapeIcon } from './icons'

/** Fixed by index: red triangle, blue diamond, yellow circle, green square, orange pentagon, purple hexagon. */
const colours = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500 text-black', 'bg-green-600', 'bg-orange-500', 'bg-purple-600']

export function OptionButton({
  index,
  label,
  selected = false,
  dimmed = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { index: number; label: string; selected?: boolean; dimmed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={`flex min-h-16 items-center gap-3 rounded-xl px-4 py-3 text-left text-lg font-semibold text-white shadow-md active:scale-[0.98] disabled:cursor-default ${colours[index % colours.length]} ${selected ? 'ring-4 ring-white' : ''} ${dimmed ? 'opacity-40' : ''} ${className}`}
    >
      <ShapeIcon index={index} className="size-7 shrink-0" />
      <span className="flex-1 break-words">{label}</span>
      {selected && <CheckIcon className="size-6 shrink-0" />}
    </button>
  )
}
