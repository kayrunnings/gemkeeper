"use client"

import { cn } from "@/lib/utils"
import { Trophy } from "@phosphor-icons/react"
import { Thought } from "@/lib/types/thought"

interface GraduationCalloutProps {
  thoughts: Array<{
    id: string
    content: string
    applicationCount: number
    remaining: number
  }>
  className?: string
}

export function GraduationCallout({ thoughts, className }: GraduationCalloutProps) {
  if (thoughts.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "p-3 rounded-[calc(var(--radius)-2px)]",
        "bg-gradient-to-br from-yellow-500/10 to-amber-500/5",
        "border border-yellow-500/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy weight="fill" className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
          Almost there!
        </span>
      </div>

      {/* Thoughts close to graduation */}
      <div className="space-y-1.5">
        {thoughts.map((thought) => (
          <div
            key={thought.id}
            className={cn(
              "flex items-center justify-between py-1.5",
              thoughts.indexOf(thought) !== thoughts.length - 1 &&
                "border-b border-yellow-500/10"
            )}
          >
            <span className="text-xs text-foreground flex-1 truncate mr-2">
              &quot;{thought.content}&quot;
            </span>
            <span
              className={cn(
                "text-[10px] font-medium text-amber-500 whitespace-nowrap",
                thought.remaining === 1 &&
                  "bg-gradient-to-br from-yellow-500/30 to-amber-500/20 px-2 py-0.5 rounded animate-pulse"
              )}
            >
              {thought.remaining === 1 ? "1 more!" : `${thought.remaining} more`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
