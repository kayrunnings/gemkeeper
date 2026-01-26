"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { Theme, THEMES, DEFAULT_THEME, STORAGE_KEY, isValidTheme, getNextTheme, THEME_INFO } from "@/lib/themes"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
  themeName: string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME

  const stored = localStorage.getItem(STORAGE_KEY)
  if (isValidTheme(stored)) {
    return stored
  }
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Single state with lazy initialization - no sync effects needed
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  // Apply theme to DOM and persist - only runs when theme actually changes
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-theme", theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    if (THEMES.includes(newTheme)) {
      setThemeState(newTheme)
    }
  }, [])

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => getNextTheme(prev))
  }, [])

  const themeName = THEME_INFO[theme].name

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themeName }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Re-export theme types and constants for convenience
export type { Theme } from "@/lib/themes"
export { THEMES, THEME_INFO } from "@/lib/themes"
