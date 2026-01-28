"use client"

import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

interface LogoProps {
    variant?: "full" | "icon" | "wordmark"
    size?: "sm" | "md" | "lg" | "xl"
    animated?: boolean
    className?: string
}

export function Logo({
    variant = "full",
    size = "md",
    animated = false,
    className
}: LogoProps) {
    // Size configurations
    const iconSizes = {
        sm: { container: "w-7 h-7", icon: "h-3.5 w-3.5" },
        md: { container: "w-9 h-9", icon: "h-4.5 w-4.5" },
        lg: { container: "w-11 h-11", icon: "h-5 w-5" },
        xl: { container: "w-14 h-14", icon: "h-7 w-7" },
    }

    const textSizes = {
        sm: "text-base",
        md: "text-lg",
        lg: "text-xl",
        xl: "text-2xl",
    }

    const currentIconSize = iconSizes[size]
    const currentTextSize = textSizes[size]

    // Icon component
    const LogoIcon = (
        <div
            className={cn(
                "rounded-xl ai-gradient flex items-center justify-center flex-shrink-0",
                "shadow-lg shadow-primary/20",
                currentIconSize.container,
                animated && "ai-glow hover:scale-110 transition-transform"
            )}
        >
            <Sparkles
                className={cn(
                    "text-white",
                    currentIconSize.icon,
                    animated && "animate-ai-sparkle"
                )}
            />
        </div>
    )

    // Wordmark component
    const LogoWordmark = (
        <span
            className={cn(
                "font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text",
                currentTextSize
            )}
        >
            ThoughtFolio
        </span>
    )

    if (variant === "icon") {
        return <div className={className}>{LogoIcon}</div>
    }

    if (variant === "wordmark") {
        return <div className={className}>{LogoWordmark}</div>
    }

    // Full variant: icon + wordmark
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            {LogoIcon}
            {LogoWordmark}
        </div>
    )
}

// Compact logo for mobile/tight spaces
interface LogoCompactProps {
    className?: string
}

export function LogoCompact({ className }: LogoCompactProps) {
    return (
        <div
            className={cn(
                "w-8 h-8 rounded-lg ai-gradient flex items-center justify-center",
                "shadow-md shadow-primary/20",
                className
            )}
        >
            <Sparkles className="h-4 w-4 text-white" />
        </div>
    )
}

// Animated logo for loading states
interface LogoLoadingProps {
    className?: string
}

export function LogoLoading({ className }: LogoLoadingProps) {
    return (
        <div
            className={cn(
                "w-12 h-12 rounded-xl ai-thinking-orb flex items-center justify-center",
                className
            )}
        >
            <Sparkles className="h-6 w-6 text-white animate-spin-slow" />
        </div>
    )
}
