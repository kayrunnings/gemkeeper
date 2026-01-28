// Theme definitions for ThoughtFolio multi-theme system

export const THEMES = [
  // Dark themes
  "midnight",
  "obsidian",
  "amethyst",
  "ocean",
  "ruby",
  "forest",
  "rose",
  "nord",
  "cyber",
  "copper",
  "slate",
  "aurora",
  "ember",
  "onyx",
  // Light themes
  "sunrise",
  "daylight",
] as const

export type Theme = (typeof THEMES)[number]

// Theme categories for UI grouping
export const DARK_THEMES: Theme[] = [
  "midnight", "obsidian", "amethyst", "ocean", "ruby",
  "forest", "rose", "nord", "cyber", "copper",
  "slate", "aurora", "ember", "onyx"
]

export const LIGHT_THEMES: Theme[] = ["sunrise", "daylight"]

export const THEME_INFO: Record<Theme, { name: string; description: string; preview: string }> = {
  midnight: {
    name: "Midnight",
    description: "Deep navy blue with warm orange accents",
    preview: "#0a1628",
  },
  obsidian: {
    name: "Obsidian",
    description: "True dark gray with emerald green accents",
    preview: "#09090b",
  },
  amethyst: {
    name: "Amethyst",
    description: "Deep purple-gray with soft purple accents",
    preview: "#13111c",
  },
  ocean: {
    name: "Ocean",
    description: "Deep teal-gray with sapphire blue accents",
    preview: "#0c1517",
  },
  ruby: {
    name: "Ruby",
    description: "Dark warm gray with ruby red accents",
    preview: "#141111",
  },
  forest: {
    name: "Forest",
    description: "Deep forest green with gold accents",
    preview: "#0d1510",
  },
  rose: {
    name: "Rose",
    description: "Dark charcoal with soft rose pink accents",
    preview: "#141214",
  },
  nord: {
    name: "Nord",
    description: "Arctic blue-gray Nordic palette",
    preview: "#2e3440",
  },
  cyber: {
    name: "Cyber",
    description: "Cyberpunk neon with electric pink and cyan",
    preview: "#0a0a0f",
  },
  copper: {
    name: "Copper",
    description: "Warm copper and bronze metallic tones",
    preview: "#120f0c",
  },
  slate: {
    name: "Slate",
    description: "Modern slate gray with indigo accents",
    preview: "#0f172a",
  },
  aurora: {
    name: "Aurora",
    description: "Northern lights with shifting greens and purples",
    preview: "#0a0f14",
  },
  ember: {
    name: "Ember",
    description: "Glowing coals with deep reds and oranges",
    preview: "#0f0906",
  },
  onyx: {
    name: "Onyx",
    description: "Pure black with silver accents - true OLED black",
    preview: "#000000",
  },
  sunrise: {
    name: "Sunrise",
    description: "Warm off-white with amber accents",
    preview: "#fffbf5",
  },
  daylight: {
    name: "Daylight",
    description: "Cool white with crisp blue accents",
    preview: "#f8fafc",
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
