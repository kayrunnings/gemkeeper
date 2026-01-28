"use client"

import { cn } from "@/lib/utils"
import type { Context, ContextWithCount } from "@/lib/types/context"

// Context name to CSS class mapping
const CONTEXT_TINT_MAP: Record<string, string> = {
    meetings: "context-tint-meetings",
    feedback: "context-tint-feedback",
    conflict: "context-tint-conflict",
    focus: "context-tint-focus",
    health: "context-tint-health",
    relationships: "context-tint-relationships",
    parenting: "context-tint-parenting",
}

// Context name to gradient colors
const CONTEXT_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
    meetings: { bg: "bg-blue-500/20", text: "text-blue-400", glow: "rgba(59, 130, 246, 0.4)" },
    feedback: { bg: "bg-pink-500/20", text: "text-pink-400", glow: "rgba(236, 72, 153, 0.4)" },
    conflict: { bg: "bg-red-500/20", text: "text-red-400", glow: "rgba(239, 68, 68, 0.4)" },
    focus: { bg: "bg-violet-500/20", text: "text-violet-400", glow: "rgba(139, 92, 246, 0.4)" },
    health: { bg: "bg-green-500/20", text: "text-green-400", glow: "rgba(34, 197, 94, 0.4)" },
    relationships: { bg: "bg-amber-500/20", text: "text-amber-400", glow: "rgba(245, 158, 11, 0.4)" },
    parenting: { bg: "bg-purple-500/20", text: "text-purple-400", glow: "rgba(168, 85, 247, 0.4)" },
}

const DEFAULT_COLORS = { bg: "bg-muted", text: "text-muted-foreground", glow: "rgba(107, 114, 128, 0.4)" }

interface ContextBadgeProps {
    context: Context | ContextWithCount
    size?: "sm" | "md" | "lg"
    variant?: "solid" | "outline" | "ghost"
    showGlow?: boolean
    className?: string
    onClick?: () => void
}

export function ContextBadge({
    context,
    size = "md",
    variant = "solid",
    showGlow = false,
    className,
    onClick
}: ContextBadgeProps) {
    const contextKey = context.name.toLowerCase()
    const colors = CONTEXT_COLORS[contextKey] || DEFAULT_COLORS

    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-sm font-medium",
    }

    const variantClasses = {
        solid: cn(colors.bg, colors.text),
        outline: cn("bg-transparent border", colors.text, `border-current/30`),
        ghost: cn("bg-transparent", colors.text),
    }

    const glowStyle = showGlow ? {
        boxShadow: `0 0 12px ${colors.glow}`,
    } : {}

    const Component = onClick ? "button" : "span"

    return (
        <Component
            onClick={onClick}
            className={cn(
                "inline-flex items-center rounded-full font-medium transition-all",
                sizeClasses[size],
                variantClasses[variant],
                onClick && "cursor-pointer hover:scale-105 active:scale-95",
                className
            )}
            style={glowStyle}
        >
            {context.name}
        </Component>
    )
}

// Helper to get context tint class for cards
export function getContextTintClass(contextName: string): string {
    const key = contextName.toLowerCase()
    return CONTEXT_TINT_MAP[key] || "context-tint-other"
}

// Helper to get context colors
export function getContextColors(contextName: string) {
    const key = contextName.toLowerCase()
    return CONTEXT_COLORS[key] || DEFAULT_COLORS
}
