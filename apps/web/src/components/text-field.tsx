import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Labelled input with an optional error under it (wired up with aria-describedby). */
export function TextField({
  label,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined }) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="text-lg"
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
