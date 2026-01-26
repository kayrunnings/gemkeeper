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

export function ContextChip({
  context,
  onClick,
  disabled = false,
  selected = false,
  className,
}: ContextChipProps) {
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
        borderColor: context.color || "#6B7280",
        color: disabled ? "#9CA3AF" : context.color || "#6B7280",
        backgroundColor: selected ? `${context.color}15` : "transparent",
      }}
    >
      <span>{context.name}</span>
      {context.thought_count > 0 && (
        <span
          className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs"
          style={{
            backgroundColor: context.color || "#6B7280",
            color: "white",
          }}
        >
          {context.thought_count}
        </span>
      )}
    </button>
  )
}
