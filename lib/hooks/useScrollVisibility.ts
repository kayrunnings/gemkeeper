"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseScrollVisibilityOptions {
  /** Time in ms to wait after scrolling stops before showing (default: 500ms) */
  showDelay?: number
  /** Initial visibility state (default: true) */
  initialVisible?: boolean
}

interface UseScrollVisibilityReturn {
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
}

/**
 * Custom hook for scroll-based visibility
 * Hides on scroll down, shows after delay when scrolling stops
 */
export function useScrollVisibility(
  options: UseScrollVisibilityOptions = {}
): UseScrollVisibilityReturn {
  const { showDelay = 500, initialVisible = true } = options

  const [isVisible, setIsVisible] = useState(initialVisible)
  const lastScrollY = useRef(0)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const isScrolling = useRef(false)

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY

    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }

    // Determine scroll direction
    const isScrollingDown = currentScrollY > lastScrollY.current
    const scrollDelta = Math.abs(currentScrollY - lastScrollY.current)

    // Only hide if actually scrolling down with meaningful delta
    if (isScrollingDown && scrollDelta > 5) {
      setIsVisible(false)
      isScrolling.current = true
    }

    // Set timeout to show element after scrolling stops
    scrollTimeout.current = setTimeout(() => {
      setIsVisible(true)
      isScrolling.current = false
    }, showDelay)

    lastScrollY.current = currentScrollY
  }, [showDelay])

  useEffect(() => {
    // Store initial scroll position
    lastScrollY.current = window.scrollY

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [handleScroll])

  return {
    isVisible,
    setIsVisible,
  }
}
