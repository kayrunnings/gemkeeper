"use client"

import { Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface CaptureAnalyzingProps {
  className?: string
}

export function CaptureAnalyzing({ className }: CaptureAnalyzingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      {/* Animated icon */}
      <div className="relative">
        <div className="absolute inset-0 animate-ping opacity-20">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
      </div>

      {/* Text */}
      <div className="mt-4 text-center space-y-1">
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm font-medium">Analyzing content...</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Detecting quotes, insights, and sources
        </p>
      </div>

      {/* Progress shimmer */}
      <div className="mt-6 w-full max-w-xs space-y-2">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/2 bg-primary/30 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
