"use client"

import { cn } from "@/lib/utils"
import type { ContextWithCount } from "@/lib/types/context"

interface ContextChipProps {
  context: ContextWithCount
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  className?: string
}

// Default color using muted-foreground for theme consistency
const DEFAULT_CONTEXT_COLOR = "var(--muted-foreground)"

export function ContextChip({
  context,
  onClick,
  disabled = false,
  selected = false,
  className,
}: ContextChipProps) {
  const contextColor = context.color || DEFAULT_CONTEXT_COLOR

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        "border-2 hover:scale-105 active:scale-95",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100",
        selected && "ring-2 ring-offset-2 ring-offset-background",
        className
      )}
      style={{
        borderColor: contextColor,
        color: disabled ? "var(--muted-foreground)" : contextColor,
        backgroundColor: selected && context.color ? `${context.color}15` : "transparent",
      }}
    >
      <span>{context.name}</span>
      {context.thought_count > 0 && (
        <span
          className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs text-white"
          style={{
            backgroundColor: contextColor,
          }}
        >
          {context.thought_count}
        </span>
      )}
    </button>
  )
}
