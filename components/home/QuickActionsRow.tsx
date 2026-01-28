"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThoughtForm } from "@/components/thought-form"
import { ExtractThoughtsModal } from "@/components/extract-thoughts-modal"
import { Sparkles, Target, Lightbulb, Plus, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionsRowProps {
  className?: string
  hasAIConsent?: boolean
}

export function QuickActionsRow({ className, hasAIConsent = false }: QuickActionsRowProps) {
  const [isAddThoughtOpen, setIsAddThoughtOpen] = useState(false)
  const [isExtractOpen, setIsExtractOpen] = useState(false)

  const handleThoughtCreated = () => {
    setIsAddThoughtOpen(false)
    // Optionally refresh the page to show new thought
    window.location.reload()
  }

  const handleThoughtsExtracted = () => {
    setIsExtractOpen(false)
    // Optionally refresh the page to show new thoughts
    window.location.reload()
  }

  return (
    <>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {/* Add Thought - Quick manual entry */}
        <button onClick={() => setIsAddThoughtOpen(true)} className="text-left">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-500 to-orange-500",
                  "group-hover:scale-110 transition-transform duration-300"
                )}
              >
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">
                  Add Thought
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Quick capture
                </p>
              </div>
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </button>

        {/* AI Capture - Extract from content */}
        <button onClick={() => setIsExtractOpen(true)} className="text-left">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 border-violet-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-500 to-purple-600",
                  "group-hover:scale-110 transition-transform duration-300"
                )}
              >
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">
                  Extract with AI
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  From text or URL
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </button>

        {/* New Moment */}
        <Link href="/moments">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-cyan-600",
                  "group-hover:scale-110 transition-transform duration-300"
                )}
              >
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">
                  New Moment
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Prep for a situation
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>

        {/* View Thoughts - Quick access to library */}
        <Link href="/library?tab=thoughts">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-slate-500 to-slate-600",
                  "group-hover:scale-110 transition-transform duration-300"
                )}
              >
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">
                  Your Thoughts
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  View library
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Add Thought Modal */}
      <ThoughtForm
        isOpen={isAddThoughtOpen}
        onClose={() => setIsAddThoughtOpen(false)}
        onThoughtCreated={handleThoughtCreated}
      />

      {/* Extract with AI Modal */}
      <ExtractThoughtsModal
        isOpen={isExtractOpen}
        onClose={() => setIsExtractOpen(false)}
        onThoughtsCreated={handleThoughtsExtracted}
        hasAIConsent={hasAIConsent}
      />
    </>
  )
}
