"use client"

import { Calendar, PencilSimple, Sparkle, X, Lightbulb } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface FloatingButtonMenuProps {
  onSelect: (option: 'capture' | 'calendar' | 'describe' | 'thought') => void
  onClose: () => void
  showCalendarOption?: boolean
}

export function FloatingButtonMenu({
  onSelect,
  onClose,
  showCalendarOption = false,
}: FloatingButtonMenuProps) {
  return (
    <div
      className={cn(
        "absolute bottom-16 right-0 mb-2",
        "bg-card border border-border rounded-xl shadow-xl",
        "overflow-hidden min-w-[220px]",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <span className="text-sm font-medium">Quick Actions</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Menu Options */}
      <div className="py-1">
        {/* AI Capture */}
        <button
          onClick={() => onSelect('capture')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3",
            "text-left text-sm",
            "hover:bg-muted transition-colors"
          )}
        >
          <div className="w-9 h-9 rounded-lg ai-gradient flex items-center justify-center">
            <Sparkle className="h-5 w-5 text-white" weight="fill" />
          </div>
          <div>
            <div className="font-medium">AI Capture</div>
            <div className="text-xs text-muted-foreground">Extract insights from content</div>
          </div>
        </button>

        {/* Add Thought */}
        <button
          onClick={() => onSelect('thought')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3",
            "text-left text-sm",
            "hover:bg-muted transition-colors"
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-amber-500" weight="fill" />
          </div>
          <div>
            <div className="font-medium">Add Thought</div>
            <div className="text-xs text-muted-foreground">Capture a quick insight</div>
          </div>
        </button>

        <div className="mx-4 my-1 border-t border-border" />

        {/* Calendar Moment */}
        {showCalendarOption && (
          <button
            onClick={() => onSelect('calendar')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3",
              "text-left text-sm",
              "hover:bg-muted transition-colors"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <div className="font-medium">From Calendar</div>
              <div className="text-xs text-muted-foreground">Pick an upcoming event</div>
            </div>
          </button>
        )}

        {/* Describe Moment */}
        <button
          onClick={() => onSelect('describe')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3",
            "text-left text-sm",
            "hover:bg-muted transition-colors"
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <PencilSimple className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="font-medium">New Moment</div>
            <div className="text-xs text-muted-foreground">Prepare for what's coming up</div>
          </div>
        </button>
      </div>
    </div>
  )
}
