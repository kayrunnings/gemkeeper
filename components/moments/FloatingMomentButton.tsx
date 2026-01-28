"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Plus, X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useScrollVisibility } from "@/lib/hooks/useScrollVisibility"
import { FloatingButtonMenu } from "./FloatingButtonMenu"
import { QuickMomentEntry } from "./QuickMomentEntry"
import { CalendarEventPicker } from "./CalendarEventPicker"

interface FloatingMomentButtonProps {
  calendarConnected?: boolean
  onAICapture?: () => void
  onAddThought?: () => void
  className?: string
}

type ActivePanel = null | 'menu' | 'quick-entry' | 'calendar'

export function FloatingMomentButton({
  calendarConnected = false,
  onAICapture,
  onAddThought,
  className,
}: FloatingMomentButtonProps) {
  const pathname = usePathname()
  const { isVisible } = useScrollVisibility({ showDelay: 500 })
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)

  // Hide on moments page (moment entry is inline there)
  const shouldHide = pathname === "/moments" || pathname.startsWith("/moments/")

  // Close menu when clicking outside
  useEffect(() => {
    if (activePanel) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('[data-floating-moment]')) {
          setActivePanel(null)
        }
      }

      // Add delay to allow click event on menu items
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timer)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [activePanel])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePanel(null)
      }
    }

    if (activePanel) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [activePanel])

  if (shouldHide) {
    return null
  }

  const handleButtonClick = () => {
    setActivePanel(activePanel === null ? 'menu' : null)
  }

  const handleMenuSelect = (option: 'capture' | 'calendar' | 'describe' | 'thought') => {
    if (option === 'capture') {
      setActivePanel(null)
      onAICapture?.()
    } else if (option === 'thought') {
      setActivePanel(null)
      onAddThought?.()
    } else if (option === 'calendar') {
      setActivePanel('calendar')
    } else {
      setActivePanel('quick-entry')
    }
  }

  const handleClose = () => {
    setActivePanel(null)
  }

  return (
    <div
      data-floating-moment
      className={cn(
        "fixed z-50 transition-all duration-300 ease-in-out",
        // Position: bottom-right, above mobile navigation
        "bottom-20 right-4 md:bottom-6 md:right-6",
        // Visibility based on scroll
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
    >
      {/* Quick Entry Panel */}
      {activePanel === 'quick-entry' && (
        <QuickMomentEntry onClose={handleClose} />
      )}

      {/* Calendar Event Picker Panel */}
      {activePanel === 'calendar' && (
        <CalendarEventPicker onClose={handleClose} />
      )}

      {/* Menu */}
      {activePanel === 'menu' && (
        <FloatingButtonMenu
          onSelect={handleMenuSelect}
          onClose={handleClose}
          showCalendarOption={calendarConnected}
        />
      )}

      {/* Main Button */}
      <button
        onClick={handleButtonClick}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          "ai-gradient shadow-lg hover:shadow-xl",
          "transition-all duration-200",
          "hover:scale-105 active:scale-95",
          // Semi-transparent when idle, solid when active
          activePanel ? "opacity-100" : "opacity-80 hover:opacity-100"
        )}
        title="Quick actions"
        aria-label="Quick actions"
      >
        {activePanel === 'menu' ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  )
}
