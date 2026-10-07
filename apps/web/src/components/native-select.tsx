import { ChevronDownIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** The platform's own select (best on phones: native picker wheel), styled like Input. */
export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <span className="relative flex">
      <select
        className={cn(
          'h-12 w-full appearance-none rounded-xl border-2 border-input bg-card py-2 pr-10 pl-4 text-base text-foreground outline-none',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 dark:bg-background/40',
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  )
}
