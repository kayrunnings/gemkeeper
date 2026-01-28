"use client"

import { cn } from "@/lib/utils"
import {
    Sparkles,
    Zap,
    Target,
    Trophy,
    Sun,
    Brain,
    Star
} from "lucide-react"

// Animated Sparkles - pulses and glows
interface AnimatedSparklesProps {
    className?: string
    animate?: boolean
}

export function AnimatedSparkles({ className, animate = true }: AnimatedSparklesProps) {
    return (
        <Sparkles
            className={cn(
                "transition-all",
                animate && "ai-sparkle",
                className
            )}
        />
    )
}

// Animated Lightning - for Active List
interface AnimatedLightningProps {
    className?: string
    active?: boolean
}

export function AnimatedLightning({ className, active = false }: AnimatedLightningProps) {
    return (
        <Zap
            className={cn(
                "transition-all",
                active && "text-warning icon-glow-hover",
                className
            )}
            fill={active ? "currentColor" : "none"}
        />
    )
}

// Animated Target - for Moments
interface AnimatedTargetProps {
    className?: string
    pulsing?: boolean
}

export function AnimatedTarget({ className, pulsing = false }: AnimatedTargetProps) {
    return (
        <Target
            className={cn(
                "transition-all",
                pulsing && "animate-pulse-scale",
                className
            )}
        />
    )
}

// Animated Trophy - bounces on graduation
interface AnimatedTrophyProps {
    className?: string
    celebrating?: boolean
}

export function AnimatedTrophy({ className, celebrating = false }: AnimatedTrophyProps) {
    return (
        <Trophy
            className={cn(
                "transition-all",
                celebrating && "trophy-celebrate text-warning",
                className
            )}
        />
    )
}

// Animated Sun - for daily check-in
interface AnimatedSunProps {
    className?: string
    rising?: boolean
}

export function AnimatedSun({ className, rising = false }: AnimatedSunProps) {
    return (
        <Sun
            className={cn(
                "transition-all",
                rising && "animate-bounce-subtle text-warning",
                className
            )}
        />
    )
}

// Animated Brain - for AI features
interface AnimatedBrainProps {
    className?: string
    thinking?: boolean
}

export function AnimatedBrain({ className, thinking = false }: AnimatedBrainProps) {
    return (
        <Brain
            className={cn(
                "transition-all",
                thinking && "animate-pulse-scale",
                className
            )}
        />
    )
}

// Animated Star - for favorites/active
interface AnimatedStarProps {
    className?: string
    active?: boolean
    onClick?: () => void
}

export function AnimatedStar({ className, active = false, onClick }: AnimatedStarProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "transition-all focus:outline-none",
                active && "star-active",
                className
            )}
        >
            <Star
                className="h-full w-full"
                fill={active ? "currentColor" : "none"}
            />
        </button>
    )
}

// Logo mark with animation
interface LogoMarkProps {
    className?: string
    size?: "sm" | "md" | "lg"
    animated?: boolean
}

export function LogoMark({ className, size = "md", animated = false }: LogoMarkProps) {
    const sizes = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    }

    return (
        <div
            className={cn(
                "rounded-xl ai-gradient flex items-center justify-center",
                sizes[size],
                animated && "ai-glow",
                className
            )}
        >
            <Sparkles className={cn(
                "text-white",
                size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-6 w-6"
            )} />
        </div>
    )
}
