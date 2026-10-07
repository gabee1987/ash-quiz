import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white',
  secondary: 'bg-white/10 text-white',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`min-h-12 rounded-lg px-4 py-3 text-lg font-semibold active:scale-[0.98] disabled:opacity-60 ${variants[variant]} ${className}`}
    />
  )
}
