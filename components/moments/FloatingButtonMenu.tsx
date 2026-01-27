"use client"

import { Calendar, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingButtonMenuProps {
  onSelect: (option: 'calendar' | 'describe') => void
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
        "overflow-hidden min-w-[200px]",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <span className="text-sm font-medium">New Moment</span>
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

        <button
          onClick={() => onSelect('describe')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3",
            "text-left text-sm",
            "hover:bg-muted transition-colors"
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Pencil className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="font-medium">Describe It</div>
            <div className="text-xs text-muted-foreground">Tell us what's coming up</div>
          </div>
        </button>
      </div>
    </div>
  )
}
