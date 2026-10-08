import { answerPalettes, answerSymbols, gameThemes, type GameSettings, type GameTheme } from '@ash-quiz/shared'
import { useEffect } from 'react'

export { answerPalettes, answerSymbols, gameThemes }

/** Theme hues and chroma, mirroring the [data-theme] blocks in styles.css. Used for the picker's swatches. */
const hues: Record<GameTheme, { hue: number; accent: number; chroma: number }> = {
  classic: { hue: 277, accent: 330, chroma: 1 },
  arcade: { hue: 305, accent: 195, chroma: 1 },
  sunset: { hue: 35, accent: 350, chroma: 1 },
  mint: { hue: 170, accent: 230, chroma: 1 },
  ocean: { hue: 240, accent: 185, chroma: 1 },
  berry: { hue: 345, accent: 285, chroma: 1 },
  forest: { hue: 135, accent: 75, chroma: 1 },
  graphite: { hue: 255, accent: 60, chroma: 0.3 },
  navy: { hue: 262, accent: 225, chroma: 0.55 },
  petrol: { hue: 215, accent: 185, chroma: 0.5 },
  stone: { hue: 65, accent: 40, chroma: 0.28 },
  bordeaux: { hue: 12, accent: 350, chroma: 0.5 },
}

/** Primary, accent and surface colours of a theme, for a small preview. */
export function themeSwatches(theme: GameTheme): [string, string, string] {
  const { hue, accent, chroma } = hues[theme]
  return [`oklch(0.55 ${0.22 * chroma} ${hue})`, `oklch(0.7 ${0.16 * chroma} ${accent})`, `oklch(0.27 ${0.08 * chroma} ${hue})`]
}

/**
 * Applies a game's theme and answer palette to the whole document while a game view is open. On
 * <html> rather than a wrapper so dialogs and toasts (rendered in portals under <body>) follow it too.
 */
export function useGameTheme(settings: Pick<GameSettings, 'theme' | 'answerPalette'> | undefined) {
  const theme = settings?.theme
  const palette = settings?.answerPalette
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme ?? 'classic'
    root.dataset.palette = palette ?? 'vivid'
    return () => {
      delete root.dataset.theme
      delete root.dataset.palette
    }
  }, [theme, palette])
}
