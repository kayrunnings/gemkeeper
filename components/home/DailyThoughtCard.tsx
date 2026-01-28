"use client"

import { useState } from "react"
import Link from "next/link"
import { Thought, CONTEXT_TAG_LABELS, ContextTag } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sun, Lightbulb, X, Check, ArrowRight, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextBadge, getContextTintClass } from "@/components/ui/context-badge"

interface DailyThoughtCardProps {
  thought: Thought | null
  alreadyCheckedIn?: boolean
  contexts?: ContextWithCount[]
  className?: string
}

export function DailyThoughtCard({ thought, alreadyCheckedIn = false, contexts = [], className }: DailyThoughtCardProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Look up context by ID or by slug matching context_tag
  const getContext = () => {
    if (!thought) return null
    if (thought.context_id) {
      return contexts.find((c) => c.id === thought.context_id) || null
    }
    if (thought.context_tag) {
      return contexts.find((c) => c.slug === thought.context_tag) || null
    }
    return null
  }

  const context = getContext()
  const contextName = context?.name || thought?.context_tag || "other"

  if (isDismissed) {
    return null
  }

  // Completed state - celebratory design
  if (alreadyCheckedIn && !thought) {
    return (
      <Card className={cn("overflow-hidden glass-card-interactive", className)}>
        <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 animate-bounce-subtle">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Check-in Complete!</h3>
            <p className="text-muted-foreground">Come back tomorrow for a new thought.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state - encourage adding thoughts
  if (!thought) {
    return (
      <Card className={cn("overflow-hidden glass-card-interactive", className)}>
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center animate-slide-up">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Active Thoughts Yet</h3>
            <p className="text-muted-foreground mb-4">Add thoughts to your Active List to start your daily practice.</p>
            <Link href="/thoughts">
              <Button className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main thought display - immersive hero design
  const tintClass = getContextTintClass(contextName)

  return (
    <Card className={cn("overflow-hidden relative group card-hover-lift", className)}>
      {/* Top accent bar with context color */}
      <div
        className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"
        style={context?.color ? {
          background: `linear-gradient(to right, ${context.color}, ${context.color}dd)`
        } : undefined}
      />

      {/* Subtle context gradient background */}
      <div className={cn("absolute inset-0 opacity-50", tintClass)} />

      <CardContent className="relative pt-6 pb-5">
        {/* Header with sun icon and dismiss */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
              style={context?.color ? {
                background: `linear-gradient(135deg, ${context.color}, ${context.color}cc)`
              } : undefined}
            >
              <Sun className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Today's Thought</h3>
              {context && (
                <ContextBadge context={context} size="sm" variant="ghost" className="mt-0.5" />
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quote-style thought content */}
        <blockquote className="mb-4">
          <p className="text-xl md:text-2xl leading-relaxed font-medium text-foreground">
            "{thought.content}"
          </p>
          {thought.source && (
            <footer className="mt-2 text-sm text-muted-foreground">
              — {thought.source}
            </footer>
          )}
        </blockquote>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/checkin" className="flex-1 min-w-[140px]">
            <Button className="w-full gap-2">
              <Check className="h-4 w-4" />
              Check In
            </Button>
          </Link>
          <Link href="/moments">
            <Button variant="outline" className="gap-2">
              <Target className="h-4 w-4" />
              Prep for Moment
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
