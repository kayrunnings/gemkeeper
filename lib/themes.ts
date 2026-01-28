// Theme definitions for ThoughtFolio multi-theme system

export const THEMES = [
  "midnight",
  "obsidian",
  "amethyst",
  "ocean",
  "ruby",
  "forest",
  "rose",
  "nord",
  "sunrise",
  "forest",
  "cosmos",
  "copper",
  "arctic",
] as const

export type Theme = (typeof THEMES)[number]

export const THEME_INFO: Record<Theme, { name: string; description: string; isLight?: boolean }> = {
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
  forest: {
    name: "Forest",
    description: "Deep forest green with gold accents",
  },
  rose: {
    name: "Rose",
    description: "Dark charcoal with soft rose pink accents",
  },
  nord: {
    name: "Nord",
    description: "Arctic blue-gray Nordic palette",
  },
  sunrise: {
    name: "Sunrise",
    description: "Warm off-white with amber accents",
    isLight: true,
  },
  forest: {
    name: "Forest",
    description: "Deep forest green with gold accents",
  },
  cosmos: {
    name: "Cosmos",
    description: "Deep space with nebula pink & purple",
  },
  copper: {
    name: "Copper",
    description: "Warm brown-gray with copper accents",
  },
  arctic: {
    name: "Arctic",
    description: "Cool blue-white with ice blue accents",
    isLight: true,
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

// Get themes by category
export function getLightThemes(): Theme[] {
  return Object.entries(THEME_INFO)
    .filter(([, info]) => info.isLight)
    .map(([key]) => key as Theme)
}

export function getDarkThemes(): Theme[] {
  return Object.entries(THEME_INFO)
    .filter(([, info]) => !info.isLight)
    .map(([key]) => key as Theme)
}
