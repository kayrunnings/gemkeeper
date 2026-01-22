// Theme definitions for ThoughtFolio multi-theme system

export const THEMES = [
  "midnight",
  "obsidian",
  "amethyst",
  "ocean",
  "ruby",
  "sunrise",
] as const

export type Theme = (typeof THEMES)[number]

export const THEME_INFO: Record<Theme, { name: string; description: string }> = {
  midnight: {
    name: "Midnight",
    description: "Deep navy blue with warm orange accents",
  },
  obsidian: {
    name: "Obsidian",
    description: "True dark gray with emerald green accents",
  },
  amethyst: {
    name: "Amethyst",
    description: "Deep purple-gray with soft purple accents",
  },
  ocean: {
    name: "Ocean",
    description: "Deep teal-gray with sapphire blue accents",
  },
  ruby: {
    name: "Ruby",
    description: "Dark warm gray with ruby red accents",
  },
  sunrise: {
    name: "Sunrise",
    description: "Warm off-white with amber accents",
  },
}

export const DEFAULT_THEME: Theme = "midnight"

export const STORAGE_KEY = "thoughtfolio-theme"

export function isValidTheme(value: string | null): value is Theme {
  return value !== null && THEMES.includes(value as Theme)
}

export function getNextTheme(current: Theme): Theme {
  const currentIndex = THEMES.indexOf(current)
  const nextIndex = (currentIndex + 1) % THEMES.length
  return THEMES[nextIndex]
}

export function getPreviousTheme(current: Theme): Theme {
  const currentIndex = THEMES.indexOf(current)
  const prevIndex = (currentIndex - 1 + THEMES.length) % THEMES.length
  return THEMES[prevIndex]
}
