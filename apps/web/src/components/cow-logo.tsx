import type { ReactNode } from 'react'

/*
 * The Quizmoo cow (the same drawing as public/logo.svg), split into stacked SVG layers so each
 * moving part is an HTML element: Chrome runs transform animations on HTML elements on the
 * compositor, while animating parts inside one SVG repaints it on the main thread every frame.
 * The brand colours are fixed, like the logo file.
 */

const ink = '#1d1442'

function Layer({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span aria-hidden="true" className={`absolute inset-0 ${className}`}>
      <svg viewBox="0 0 64 64" className="size-full overflow-visible">
        <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {children}
        </g>
      </svg>
    </span>
  )
}

/** The cow with idle motion (ears flick, eyes blink); size it with `className`. */
export function CowLogo({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`relative block ${className}`}>
      <Layer className="cow-ear-left">
        <ellipse cx="9" cy="25" rx="8" ry="4.5" transform="rotate(-20 9 25)" fill="#fff" />
      </Layer>
      <Layer className="cow-ear-right">
        <ellipse cx="55" cy="25" rx="8" ry="4.5" transform="rotate(20 55 25)" fill="#fff" />
      </Layer>
      <Layer>
        <path d="M20 15C15 11 14 6 17 3C18 7 21 10 25 12Z" fill="#f5e6c8" />
        <path d="M44 15C49 11 50 6 47 3C46 7 43 10 39 12Z" fill="#f5e6c8" />
        <path d="M32 9C45 9 51 17 51 29C51 41 46 47 32 47C18 47 13 41 13 29C13 17 19 9 32 9Z" fill="#fff" />
        <path d="M18 19C20 13 27 12 29 16C31 21 25 25 21 25C17 25 16 22 18 19Z" fill={ink} stroke="none" />
        <ellipse cx="32" cy="45" rx="16" ry="10.5" fill="#f9a8bf" />
        <ellipse cx="25.5" cy="43" rx="2" ry="3" fill="#c2496b" stroke="none" />
        <ellipse cx="38.5" cy="43" rx="2" ry="3" fill="#c2496b" stroke="none" />
        <path d="M37 51.5C38 58 44 59 44.5 52.5Z" fill="#ff5f87" />
        <path d="M26 51Q32 54.5 38 51" fill="none" />
      </Layer>
      <Layer className="cow-eyes">
        <circle cx="24" cy="28" r="5.5" fill="#fff" />
        <circle cx="41" cy="27" r="4" fill="#fff" />
        <circle cx="26.5" cy="29" r="2.3" fill={ink} stroke="none" />
        <circle cx="39" cy="26" r="1.8" fill={ink} stroke="none" />
      </Layer>
    </span>
  )
}
