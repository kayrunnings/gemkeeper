"use client"

import { Sparkle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  message?: string
  variant?: "default" | "minimal" | "fullscreen"
  className?: string
}

const loadingMessages = [
  "Gathering your thoughts...",
  "Curating your knowledge...",
  "Preparing your insights...",
  "Loading your wisdom...",
]

export function LoadingState({
  message,
  variant = "default",
  className,
}: LoadingStateProps) {
  // Pick a random message if none provided
  const displayMessage = message || loadingMessages[Math.floor(Math.random() * loadingMessages.length)]

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center gap-3 py-8", className)}>
        <div className="relative">
          <Sparkle className="h-5 w-5 text-primary animate-pulse" weight="fill" />
          <div className="absolute inset-0 animate-ping">
            <Sparkle className="h-5 w-5 text-primary/30" weight="fill" />
          </div>
        </div>
        <span className="text-muted-foreground text-sm">{displayMessage}</span>
      </div>
    )
  }

  if (variant === "fullscreen") {
    return (
      <div className={cn("min-h-screen bg-background flex items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl animate-pulse" />

            {/* Main icon container */}
            <div className="relative w-20 h-20 rounded-2xl ai-gradient flex items-center justify-center shadow-lg">
              <Sparkle className="h-10 w-10 text-white ai-sparkle" weight="fill" />
            </div>

            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDelay: "1s" }}>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-foreground font-medium">{displayMessage}</p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12", className)}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-2 rounded-2xl bg-primary/20 blur-lg animate-pulse" />

        {/* Icon container */}
        <div className="relative w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center shadow-lg">
          <Sparkle className="h-8 w-8 text-white ai-sparkle" weight="fill" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-muted-foreground">{displayMessage}</p>
      </div>
    </div>
  )
}

// Skeleton components for content loading
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-6 animate-pulse", className)}>
      <div className="space-y-4">
        <div className="h-4 bg-muted/50 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-muted/30 rounded w-full" />
          <div className="h-3 bg-muted/30 rounded w-5/6" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted/40 rounded-full w-16" />
          <div className="h-6 bg-muted/40 rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 3, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="glass-card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/40" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted/50 rounded w-2/3" />
              <div className="h-2 bg-muted/30 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
