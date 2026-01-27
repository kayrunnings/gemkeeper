"use client"

import { useState, useEffect, useCallback } from "react"

interface UseGlobalShortcutsReturn {
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
  isCaptureOpen: boolean
  setIsCaptureOpen: (open: boolean) => void
}

export function useGlobalShortcuts(): UseGlobalShortcutsReturn {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isCaptureOpen, setIsCaptureOpen] = useState(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts if user is typing in an input/textarea
    const target = event.target as HTMLElement
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      // Only allow Escape to close modals
      if (event.key === "Escape") {
        if (isSearchOpen) setIsSearchOpen(false)
        if (isCaptureOpen) setIsCaptureOpen(false)
      }
      return
    }

    // Cmd+K (Mac) or Ctrl+K (Windows/Linux) - Search
    if ((event.metaKey || event.ctrlKey) && event.key === "k") {
      event.preventDefault()
      setIsSearchOpen((prev) => !prev)
      // Close capture if open
      if (isCaptureOpen) setIsCaptureOpen(false)
    }

    // Cmd+N (Mac) or Ctrl+N (Windows/Linux) - Capture
    if ((event.metaKey || event.ctrlKey) && event.key === "n") {
      event.preventDefault()
      setIsCaptureOpen((prev) => !prev)
      // Close search if open
      if (isSearchOpen) setIsSearchOpen(false)
    }

    // Escape to close any open modal
    if (event.key === "Escape") {
      if (isSearchOpen) setIsSearchOpen(false)
      if (isCaptureOpen) setIsCaptureOpen(false)
    }
  }, [isSearchOpen, isCaptureOpen])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    isSearchOpen,
    setIsSearchOpen,
    isCaptureOpen,
    setIsCaptureOpen,
  }
}
