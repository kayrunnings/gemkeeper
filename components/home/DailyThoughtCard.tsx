"use client"

import { useState } from "react"
import Link from "next/link"
import { Thought, CONTEXT_TAG_LABELS, ContextTag } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sun, Lightbulb, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyThoughtCardProps {
  thought: Thought | null
  alreadyCheckedIn?: boolean
  contexts?: ContextWithCount[]
  className?: string
}

const contextTagVariant: Record<ContextTag, string> = {
  meetings: "meetings",
  feedback: "feedback",
  conflict: "conflict",
  focus: "focus",
  health: "health",
  relationships: "relationships",
  parenting: "parenting",
  other: "other",
}

export function DailyThoughtCard({ thought, alreadyCheckedIn = false, contexts = [], className }: DailyThoughtCardProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Look up context by ID or by slug matching context_tag
  const getContext = () => {
    if (!thought) return null
    // First try to find by context_id
    if (thought.context_id) {
      return contexts.find((c) => c.id === thought.context_id) || null
    }
    // Fall back to matching context_tag to slug
    if (thought.context_tag) {
      return contexts.find((c) => c.slug === thought.context_tag) || null
    }
    return null
  }

  const context = getContext()

  if (isDismissed) {
    return null
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg">Today&apos;s Thought</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setIsDismissed(true)}
          >
            Dismiss
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {thought ? (
          <div className="space-y-3">
            {/* Context badge - use context color if available */}
            {context ? (
              <Badge
                variant="outline"
                className="border-2"
                style={{
                  borderColor: context.color || "#6B7280",
                  color: context.color || "#6B7280",
                }}
              >
                {context.name}
              </Badge>
            ) : (
              <Badge variant={contextTagVariant[thought.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
                {thought.context_tag === "other" && thought.custom_context
                  ? thought.custom_context
                  : CONTEXT_TAG_LABELS[thought.context_tag]}
              </Badge>
            )}
            <p className="text-lg leading-relaxed font-medium line-clamp-3">
              {thought.content}
            </p>
            {thought.source && (
              <p className="text-sm text-muted-foreground">— {thought.source}</p>
            )}
          </div>
        ) : alreadyCheckedIn ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-3">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <p className="text-muted-foreground mb-2">You&apos;ve completed your check-in for today!</p>
            <p className="text-sm text-muted-foreground">Come back tomorrow for a new thought.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <Lightbulb className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No thoughts on your Active List yet</p>
            <Link href="/thoughts">
              <Button size="sm">Add Thoughts to Active List</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
