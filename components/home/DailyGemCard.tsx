"use client"

import Link from "next/link"
import { Gem, CONTEXT_TAG_LABELS, ContextTag } from "@/lib/types/gem"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sun, Gem as GemIcon, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyGemCardProps {
  gem: Gem | null
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

export function DailyGemCard({ gem, className }: DailyGemCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg">Today&apos;s Gem</CardTitle>
          </div>
          <Link href="/daily">
            <Button variant="ghost" size="sm" className="gap-1">
              Daily Prompt
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {gem ? (
          <div className="space-y-3">
            <Badge variant={contextTagVariant[gem.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
              {gem.context_tag === "other" && gem.custom_context
                ? gem.custom_context
                : CONTEXT_TAG_LABELS[gem.context_tag]}
            </Badge>
            <p className="text-lg leading-relaxed font-medium line-clamp-3">
              {gem.content}
            </p>
            {gem.source && (
              <p className="text-sm text-muted-foreground">— {gem.source}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <GemIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No active gems yet</p>
            <Link href="/gems">
              <Button size="sm">Add Your First Gem</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
