// Theme definitions for ThoughtFolio multi-theme system

export const THEMES = [
  // Dark themes - Sorted by expected market popularity
  "midnight",     // 1. Classic dark with warm orange - universal appeal, default
  "obsidian",     // 2. True dark OLED - developer favorite, clean minimal
  "onyx",         // 3. Pure OLED black - battery saving, premium
  "void",         // 4. Maximum contrast OLED - accessibility
  "nord",         // 5. Nordic palette - cult following
  "slate",        // 6. Modern indigo - professional developers
  "manuscript",   // 7. Notion-inspired - productivity users
  "graphite",     // 8. Carbon-neutral - understated elegance
  "carbon",       // 9. Luxury gold/charcoal - premium feel
  "steel",        // 10. Industrial silver - engineering aesthetic
  "titanium",     // 11. Aerospace cyan - tech-forward
  "aurora",       // 12. Northern lights - visually striking
  "nebula",       // 13. Cosmic AI gradients - creative users
  "mercury",      // 14. Violet luminescence - sophisticated
  "amethyst",     // 15. Purple creative theme
  "ocean",        // 16. Calming blue tones
  "cyber",        // 17. Neon cyberpunk - gaming/tech niche
  "ember",        // 18. Fire tones - passionate
  "rose",         // 19. Soft pink - specific appeal
  "ruby",         // 20. Bold red - energetic
  "forest",       // 21. Nature theme
  "copper",       // 22. Metallic luxury - niche
  // Light themes - Sorted by expected market popularity
  "daylight",     // 1. Clean blue - professional default light
  "paper",        // 2. Pure white - focused writing
  "sunrise",      // 3. Warm amber - daytime reading
  "ivory",        // 4. Cream/amber - eye-strain reduction
] as const

export type Theme = (typeof THEMES)[number]

// Theme categories for UI grouping - Sorted by expected market popularity
export const DARK_THEMES: Theme[] = [
  "midnight", "obsidian", "onyx", "void", "nord",
  "slate", "manuscript", "graphite", "carbon", "steel",
  "titanium", "aurora", "nebula", "mercury", "amethyst",
  "ocean", "cyber", "ember", "rose", "ruby",
  "forest", "copper"
]

export const LIGHT_THEMES: Theme[] = ["daylight", "paper", "sunrise", "ivory"]

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
  graphite: {
    name: "Graphite",
    description: "Carbon-neutral with silver-blue accents",
    preview: "#18181b",
  },
  mercury: {
    name: "Mercury",
    description: "Deep space black with violet luminescence",
    preview: "#0c0c14",
  },
  titanium: {
    name: "Titanium",
    description: "Aerospace-inspired blue-black with cyan",
    preview: "#0a1219",
  },
  carbon: {
    name: "Carbon",
    description: "Luxury charcoal with warm gold accents",
    preview: "#111111",
  },
  void: {
    name: "Void",
    description: "Absolute black with pure white - OLED",
    preview: "#000000",
  },
  nebula: {
    name: "Nebula",
    description: "Cosmic purple-black with AI gradients",
    preview: "#0a0812",
  },
  steel: {
    name: "Steel",
    description: "Industrial blue-gray with silver highlights",
    preview: "#0f1114",
  },
  manuscript: {
    name: "Manuscript",
    description: "Notion-inspired warm gray - content-first",
    preview: "#191919",
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
  paper: {
    name: "Paper",
    description: "Pure white with ink-blue accents",
    preview: "#ffffff",
  },
  ivory: {
    name: "Ivory",
    description: "Warm cream with amber - easy on eyes",
    preview: "#fffdf9",
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
