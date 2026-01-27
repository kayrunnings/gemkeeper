"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionsRowProps {
  className?: string
}

export function QuickActionsRow({ className }: QuickActionsRowProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4", className)}>
      {/* AI Capture - Dominant action spanning 2 columns */}
      <Link href="/thoughts/extract" className="sm:col-span-2">
        <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 border-violet-500/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-500 to-purple-600",
                "group-hover:scale-110 transition-transform duration-300"
              )}
            >
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-lg">
                AI Capture
              </h3>
              <p className="text-sm text-muted-foreground">
                Paste anything, we&apos;ll extract the insights
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* New Moment - Secondary action */}
      <Link href="/moments">
        <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
          <CardContent className="p-5 flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-cyan-600",
                "group-hover:scale-110 transition-transform duration-300"
              )}
            >
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                New Moment
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                Prep for a situation
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
