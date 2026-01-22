"use client"

import { createContext, useContext, useEffect, useState, useCallback, useSyncExternalStore } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = "gemkeeper-theme"

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark"

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "dark" || stored === "light") {
    return stored
  }
  // Fall back to system preference, default to dark
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light"
  }
  return "dark"
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

function getServerSnapshot(): Theme {
  return "dark" // Default for SSR
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use useSyncExternalStore for reading localStorage without causing cascading renders
  const storedTheme = useSyncExternalStore(
    subscribeToStorage,
    getStoredTheme,
    getServerSnapshot
  )

  const [theme, setThemeState] = useState<Theme>(storedTheme)

  // Sync theme state with stored theme on mount
  useEffect(() => {
    setThemeState(storedTheme)
  }, [storedTheme])

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    if (theme === "light") {
      root.classList.add("light")
    } else {
      root.classList.remove("light")
    }

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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
