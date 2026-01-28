"use client"

import { Sparkle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface AIBadgeProps {
  variant?: "default" | "subtle" | "glow"
  size?: "sm" | "md"
  className?: string
  label?: string
}

export function AIBadge({
  variant = "default",
  size = "sm",
  className,
  label = "AI",
}: AIBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        // Size variants
        size === "sm" && "text-[10px] px-1.5 py-0.5 rounded",
        size === "md" && "text-xs px-2 py-1 rounded-md",
        // Style variants
        variant === "default" && "ai-gradient text-white",
        variant === "subtle" && "bg-primary/10 text-primary",
        variant === "glow" && "ai-gradient text-white ai-glow",
        className
      )}
    >
      <Sparkle className={cn(
        "shrink-0",
        size === "sm" && "h-2.5 w-2.5",
        size === "md" && "h-3 w-3"
      )} weight="fill" />
      {label}
    </span>
  )
}

// AI-powered card wrapper with glow effect
interface AICardProps {
  children: React.ReactNode
  className?: string
  showBadge?: boolean
  glowIntensity?: "low" | "medium" | "high"
}

export function AICard({
  children,
  className,
  showBadge = true,
  glowIntensity = "medium",
}: AICardProps) {
  return (
    <div
      className={cn(
        "relative glass-card overflow-hidden",
        glowIntensity === "low" && "shadow-[0_0_15px_var(--ai-glow)]",
        glowIntensity === "medium" && "shadow-[0_0_25px_var(--ai-glow)]",
        glowIntensity === "high" && "shadow-[0_0_40px_var(--ai-glow)] ai-glow",
        className
      )}
    >
      {/* Gradient border top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] ai-gradient" />

      {/* Content */}
      <div className="relative">
        {children}
      </div>

      {/* AI Badge in corner */}
      {showBadge && (
        <div className="absolute top-3 right-3">
          <AIBadge variant="subtle" />
        </div>
      )}
    </div>
  )
}

// Shimmer loading effect for AI content
export function AIShimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "ai-shimmer rounded-lg",
        className
      )}
    />
  )
}

// Thinking indicator for AI processing
export function AIThinking({ message = "AI is thinking..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="relative">
        <Sparkle className="h-5 w-5 text-primary ai-sparkle" weight="fill" />
        <div className="absolute inset-0 animate-ping opacity-50">
          <Sparkle className="h-5 w-5 text-primary" weight="fill" />
        </div>
      </div>
      <span className="text-muted-foreground text-sm">{message}</span>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}
