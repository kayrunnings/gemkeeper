"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

// UI theme types - Glass (frosted) vs Classic (solid)
export const UI_THEMES = ["glass", "classic"] as const
export type UITheme = (typeof UI_THEMES)[number]

export const UI_THEME_INFO: Record<UITheme, { name: string; description: string }> = {
  glass: {
    name: "Glass",
    description: "Modern frosted glass effects with blur and transparency",
  },
  classic: {
    name: "Classic",
    description: "Traditional solid backgrounds without blur effects",
  },
}

export const DEFAULT_UI_THEME: UITheme = "glass"
export const UI_THEME_STORAGE_KEY = "thoughtfolio-ui-theme"

export function isValidUITheme(value: string | null): value is UITheme {
  return value !== null && UI_THEMES.includes(value as UITheme)
}

interface UIThemeContextType {
  uiTheme: UITheme
  setUITheme: (theme: UITheme) => void
  toggleUITheme: () => void
  uiThemeName: string
}

const UIThemeContext = createContext<UIThemeContextType | undefined>(undefined)

function getInitialUITheme(): UITheme {
  if (typeof window === "undefined") return DEFAULT_UI_THEME

  const stored = localStorage.getItem(UI_THEME_STORAGE_KEY)
  if (isValidUITheme(stored)) {
    return stored
  }
  return DEFAULT_UI_THEME
}

export function UIThemeProvider({ children }: { children: React.ReactNode }) {
  // Single state with lazy initialization - no sync effects needed
  const [uiTheme, setUIThemeState] = useState<UITheme>(getInitialUITheme)

  // Apply theme to DOM and persist - only runs when theme actually changes
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-ui-theme", uiTheme)
    localStorage.setItem(UI_THEME_STORAGE_KEY, uiTheme)
  }, [uiTheme])

  const setUITheme = useCallback((newTheme: UITheme) => {
    if (UI_THEMES.includes(newTheme)) {
      setUIThemeState(newTheme)
    }
  }, [])

  const toggleUITheme = useCallback(() => {
    setUIThemeState((prev) => (prev === "glass" ? "classic" : "glass"))
  }, [])

  const uiThemeName = UI_THEME_INFO[uiTheme].name

  return (
    <UIThemeContext.Provider value={{ uiTheme, setUITheme, toggleUITheme, uiThemeName }}>
      {children}
    </UIThemeContext.Provider>
  )
}

export function useUITheme() {
  const context = useContext(UIThemeContext)
  if (context === undefined) {
    throw new Error("useUITheme must be used within a UIThemeProvider")
  }
  return context
}
