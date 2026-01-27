"use client"

import { Link2, Quote, StickyNote, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface CaptureEmptyStateProps {
  onExampleClick?: (example: string) => void
}

const examples = [
  {
    icon: Link2,
    title: "Paste an article URL",
    description: "Extract key thoughts from any article",
    example: "https://example.com/article",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Quote,
    title: "Paste a quote",
    description: "Save as thought with source attribution",
    example: '"The only way to do great work is to love what you do." — Steve Jobs',
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    icon: StickyNote,
    title: "Paste meeting notes",
    description: "Save as note, extract thoughts",
    example: "Meeting with team:\n- Discussed Q1 goals\n- Key insight: focus on user retention",
    color: "text-green-500 bg-green-500/10",
  },
  {
    icon: Lightbulb,
    title: "Type a quick idea",
    description: "Capture it as a thought",
    example: "Remember to always clarify expectations before starting a project",
    color: "text-amber-500 bg-amber-500/10",
  },
]

export function CaptureEmptyState({ onExampleClick }: CaptureEmptyStateProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Paste any content — we'll figure out the rest
      </p>

      <div className="grid grid-cols-1 gap-2">
        {examples.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              onClick={() => onExampleClick?.(item.example)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                "text-left transition-colors",
                "hover:bg-muted/50"
              )}
            >
              <div className={cn("p-2 rounded-lg", item.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
