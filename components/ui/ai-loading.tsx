"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const THINKING_MESSAGES = [
    "Scanning your knowledge...",
    "Finding connections...",
    "Matching thoughts...",
    "Analyzing patterns...",
    "Discovering insights...",
]

interface AILoadingProps {
    className?: string
    size?: "sm" | "md" | "lg"
    showMessage?: boolean
    messages?: string[]
}

export function AILoading({
    className,
    size = "md",
    showMessage = true,
    messages = THINKING_MESSAGES
}: AILoadingProps) {
    const [messageIndex, setMessageIndex] = useState(0)

    useEffect(() => {
        if (!showMessage) return

        const interval = setInterval(() => {
            setMessageIndex((i) => (i + 1) % messages.length)
        }, 2000)
        return () => clearInterval(interval)
    }, [showMessage, messages.length])

    const sizes = {
        sm: { orb: "w-10 h-10", icon: "h-5 w-5", blur: "blur-lg" },
        md: { orb: "w-16 h-16", icon: "h-8 w-8", blur: "blur-xl" },
        lg: { orb: "w-24 h-24", icon: "h-12 w-12", blur: "blur-2xl" },
    }

    const currentSize = sizes[size]

    return (
        <div className={cn("flex flex-col items-center gap-4", className)}>
            {/* Animated orb with glow */}
            <div className={cn("relative", currentSize.orb)}>
                {/* Glow layer */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-full ai-gradient opacity-50",
                        currentSize.blur
                    )}
                />
                {/* Main orb */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-full ai-gradient ai-thinking-orb",
                        "flex items-center justify-center"
                    )}
                >
                    <Sparkles
                        className={cn(
                            "text-white animate-spin-slow",
                            currentSize.icon
                        )}
                    />
                </div>
            </div>

            {/* Thinking message with fade transition */}
            {showMessage && (
                <p
                    key={messageIndex}
                    className="text-muted-foreground text-sm animate-fade-in text-center"
                >
                    {messages[messageIndex]}
                </p>
            )}
        </div>
    )
}

// Skeleton loader variant for inline loading states
interface AISkeletonProps {
    className?: string
    lines?: number
}

export function AISkeleton({ className, lines = 3 }: AISkeletonProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "h-4 skeleton-shimmer",
                        i === lines - 1 ? "w-2/3" : "w-full"
                    )}
                    style={{ animationDelay: `${i * 0.1}s` }}
                />
            ))}
        </div>
    )
}

// Inline thinking indicator for buttons/chips
interface AIThinkingDotProps {
    className?: string
}

export function AIThinkingDots({ className }: AIThinkingDotProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-current animate-bounce-subtle"
                    style={{ animationDelay: `${i * 0.15}s` }}
                />
            ))}
        </div>
    )
}
