"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, NotePencil, Lightbulb, DiamondsFour, Note } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { HomeQuadrant } from "./HomeQuadrant"
import { SmartCaptureInput } from "./SmartCaptureInput"
import { Button } from "@/components/ui/button"
import { Thought } from "@/lib/types/thought"
import { Note as NoteType } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface RecentCapture {
  id: string
  type: "thought" | "note"
  content: string
  contextName?: string
  createdAt: Date
}

interface CaptureQuadrantProps {
  weeklyCaptures: number
  recentCaptures: RecentCapture[]
  onOpenAICapture?: (content: string) => void
  onOpenNoteEditor?: () => void
  onOpenThoughtForm?: () => void
  className?: string
}

export function CaptureQuadrant({
  weeklyCaptures,
  recentCaptures,
  onOpenAICapture,
  onOpenNoteEditor,
  onOpenThoughtForm,
  className,
}: CaptureQuadrantProps) {
  const router = useRouter()
  const [isCapturing, setIsCapturing] = useState(false)

  const handleAICapture = (content: string) => {
    setIsCapturing(true)
    // Trigger AI capture modal with the content
    onOpenAICapture?.(content)
    setIsCapturing(false)
  }

  return (
    <HomeQuadrant
      variant="capture"
      icon={<Plus weight="bold" />}
      title="Capture"
      stat={`+${weeklyCaptures} this week`}
      footer={
        <button
          onClick={() => router.push("/library")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          View library <span>→</span>
        </button>
      }
      className={className}
    >
      {/* Smart AI Capture Input */}
      <SmartCaptureInput
        onCapture={handleAICapture}
        isLoading={isCapturing}
        className="mb-3"
      />

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <Button
          variant="ghost"
          onClick={onOpenNoteEditor}
          className={cn(
            "h-auto py-2.5 px-3 justify-center gap-1.5",
            "bg-[var(--glass-input-bg)] border border-[var(--glass-input-border)]",
            "text-muted-foreground text-xs font-medium",
            "hover:bg-[var(--glass-hover-bg)] hover:border-[var(--glass-hover-border)] hover:text-foreground hover:-translate-y-px"
          )}
        >
          <NotePencil className="w-3.5 h-3.5" />
          New Note
        </Button>
        <Button
          variant="ghost"
          onClick={onOpenThoughtForm}
          className={cn(
            "h-auto py-2.5 px-3 justify-center gap-1.5",
            "bg-[var(--glass-input-bg)] border border-[var(--glass-input-border)]",
            "text-muted-foreground text-xs font-medium",
            "hover:bg-[var(--glass-hover-bg)] hover:border-[var(--glass-hover-border)] hover:text-foreground hover:-translate-y-px"
          )}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Quick Thought
        </Button>
      </div>

      {/* Recent captures */}
      {recentCaptures.length > 0 && (
        <>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
            Recent
          </div>
          <div className="space-y-0">
            {recentCaptures.slice(0, 3).map((capture) => (
              <div
                key={capture.id}
                className="flex items-center gap-2 py-2 border-b border-[var(--glass-card-border)] last:border-b-0"
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center text-[11px] flex-shrink-0",
                    capture.type === "thought"
                      ? "bg-violet-400/20 text-violet-400"
                      : "bg-blue-400/20 text-blue-400"
                  )}
                >
                  {capture.type === "thought" ? (
                    <DiamondsFour weight="fill" className="w-3 h-3" />
                  ) : (
                    <Note weight="fill" className="w-3 h-3" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground truncate">
                    {capture.type === "thought" ? `"${capture.content}"` : capture.content}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {capture.type === "thought" ? "Thought" : "Note"}
                    {capture.contextName && ` · ${capture.contextName}`}
                    {" · "}
                    {formatDistanceToNow(new Date(capture.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </HomeQuadrant>
  )
}
