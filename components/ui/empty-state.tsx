"use client"

import { ReactNode } from "react"
import {
  Lightbulb,
  BookOpenText,
  CalendarCheck,
  Compass,
  Trophy,
  Sparkle,
  Plus,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EmptyStateVariant =
  | "thoughts"
  | "notes"
  | "sources"
  | "moments"
  | "discover"
  | "search"
  | "archive"
  | "trophy"
  | "default"

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: ReactNode
}

const variantConfig: Record<EmptyStateVariant, { icon: typeof Lightbulb; title: string; description: string }> = {
  thoughts: {
    icon: Lightbulb,
    title: "No thoughts yet",
    description: "Capture insights from books, podcasts, or conversations. Start with something that resonated with you recently.",
  },
  notes: {
    icon: BookOpenText,
    title: "No notes yet",
    description: "Create notes to capture longer ideas, meeting summaries, or reflections.",
  },
  sources: {
    icon: BookOpenText,
    title: "No sources yet",
    description: "Add books, articles, or podcasts that inspire your thinking.",
  },
  moments: {
    icon: CalendarCheck,
    title: "No upcoming moments",
    description: "Moments are opportunities to apply your knowledge. Connect your calendar or create one manually.",
  },
  discover: {
    icon: Compass,
    title: "All caught up!",
    description: "You've explored all of today's discoveries. Come back tomorrow for fresh insights.",
  },
  search: {
    icon: Compass,
    title: "No results found",
    description: "Try adjusting your search terms or filters to find what you're looking for.",
  },
  archive: {
    icon: Sparkle,
    title: "Archive is empty",
    description: "Archived thoughts and notes will appear here.",
  },
  trophy: {
    icon: Trophy,
    title: "No graduated thoughts yet",
    description: "Apply thoughts 5+ times to graduate them to your Trophy Case. Keep practicing!",
  },
  default: {
    icon: Sparkle,
    title: "Nothing here yet",
    description: "Get started by adding some content.",
  },
}

export function EmptyState({
  variant = "default",
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4",
      className
    )}>
      {/* Icon with subtle animation */}
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-xl bg-primary/10 rounded-full animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" weight="duotone" />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-lg font-semibold mb-2">
        {title || config.title}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        {description || config.description}
      </p>

      {/* Action button */}
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          <Plus className="h-4 w-4" />
          {action.label}
        </Button>
      )}

      {/* Custom content */}
      {children}
    </div>
  )
}

// Inline variant for smaller spaces
export function InlineEmptyState({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-2 py-8 text-muted-foreground",
      className
    )}>
      <Sparkle className="h-4 w-4" />
      <span className="text-sm">{message}</span>
    </div>
  )
}
