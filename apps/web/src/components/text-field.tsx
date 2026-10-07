import { useId, type InputHTMLAttributes } from 'react'

export function TextField({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        className="min-h-12 rounded-lg bg-white px-4 py-3 text-lg text-black"
      />
      {error && (
        <p id={`${id}-error`} className="text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
