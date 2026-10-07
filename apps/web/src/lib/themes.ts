import { gameThemes, type GameTheme } from '@ash-quiz/shared'
import { useEffect } from 'react'

export { gameThemes }

/** Theme hues, mirroring the [data-theme] blocks in styles.css. Used for the picker's swatches. */
const hues: Record<GameTheme, { hue: number; accent: number }> = {
  classic: { hue: 277, accent: 330 },
  arcade: { hue: 305, accent: 195 },
  sunset: { hue: 35, accent: 350 },
  mint: { hue: 170, accent: 230 },
}

/** Primary, accent and surface colours of a theme, for a small preview. */
export function themeSwatches(theme: GameTheme): [string, string, string] {
  const { hue, accent } = hues[theme]
  return [`oklch(0.55 0.22 ${hue})`, `oklch(0.7 0.16 ${accent})`, `oklch(0.27 0.08 ${hue})`]
}

/**
 * Applies a game's theme to the whole document while a game view is open. On <html> rather than a
 * wrapper so dialogs and toasts (rendered in portals under <body>) follow it too.
 */
export function useGameTheme(theme: GameTheme | undefined) {
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme ?? 'classic'
    return () => {
      delete root.dataset.theme
    }
  }, [theme])
}
