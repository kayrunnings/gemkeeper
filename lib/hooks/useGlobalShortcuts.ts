"use client"

import { useState, useEffect, useCallback } from "react"

interface UseGlobalShortcutsReturn {
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
}

export function useGlobalShortcuts(): UseGlobalShortcutsReturn {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    if ((event.metaKey || event.ctrlKey) && event.key === "k") {
      event.preventDefault()
      setIsSearchOpen((prev) => !prev)
    }

    // Escape to close
    if (event.key === "Escape" && isSearchOpen) {
      setIsSearchOpen(false)
    }
  }, [isSearchOpen])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    isSearchOpen,
    setIsSearchOpen,
  }
}
