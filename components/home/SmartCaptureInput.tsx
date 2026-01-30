"use client"

import { useState, useCallback } from "react"
import { Sparkle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

interface SmartCaptureInputProps {
  onCapture?: (content: string) => void
  isLoading?: boolean
  className?: string
}

export function SmartCaptureInput({
  onCapture,
  isLoading = false,
  className,
}: SmartCaptureInputProps) {
  const [content, setContent] = useState("")

  const handleCapture = useCallback(() => {
    if (content.trim() && onCapture) {
      onCapture(content.trim())
    }
  }, [content, onCapture])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleCapture()
      }
    },
    [handleCapture]
  )

  return (
    <div className={cn("relative", className)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste a quote, URL, screenshot, meeting notes..."
        className={cn(
          "min-h-[70px] pr-[70px] resize-none",
          "bg-[var(--glass-input-bg)] border-[var(--glass-input-border)]",
          "text-sm placeholder:text-muted-foreground placeholder:text-xs",
          "focus:border-ring focus:ring-[3px] focus:ring-[var(--ai-glow)]",
          "transition-all duration-150"
        )}
        disabled={isLoading}
      />
      <button
        onClick={handleCapture}
        disabled={!content.trim() || isLoading}
        className={cn(
          "absolute bottom-2.5 right-2.5",
          "inline-flex items-center gap-1",
          "text-[9px] font-semibold uppercase tracking-wider",
          "px-2 py-1 rounded",
          "bg-gradient-to-br from-[var(--ai-gradient-start)] to-[var(--ai-gradient-end)]",
          "text-white cursor-pointer",
          "transition-all duration-150",
          "hover:scale-105 hover:shadow-[0_0_12px_var(--ai-glow)]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          "animate-[glow-pulse_2s_ease-in-out_infinite]"
        )}
      >
        <Sparkle weight="fill" className="w-3 h-3" />
        <span>AI</span>
      </button>
    </div>
  )
}
