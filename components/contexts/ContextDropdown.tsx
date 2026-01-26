"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContextWithCount } from "@/lib/types/context"
import { getContexts } from "@/lib/contexts"

interface ContextDropdownProps {
  value: string | null
  onChange: (contextId: string, context: ContextWithCount) => void
  disabled?: boolean
  showCount?: boolean
  className?: string
}

export function ContextDropdown({
  value,
  onChange,
  disabled = false,
  showCount = true,
  className,
}: ContextDropdownProps) {
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadContexts() {
      setIsLoading(true)
      const { contexts: data } = await getContexts()
      setContexts(data)
      setIsLoading(false)
    }
    loadContexts()
  }, [])

  const selectedContext = contexts.find((c) => c.id === value)

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className={cn("w-full justify-between", className)}
        disabled
      >
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading contexts...
        </span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            {selectedContext ? (
              <>
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedContext.color || "#6B7280" }}
                />
                <span className="truncate">{selectedContext.name}</span>
                {showCount && (
                  <span className="text-muted-foreground text-xs">
                    ({selectedContext.thought_count}/{selectedContext.thought_limit})
                  </span>
                )}
              </>
            ) : (
              "Select a context..."
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[260px]">
        {contexts.map((context) => {
          const isAtLimit = context.thought_count >= context.thought_limit
          return (
            <DropdownMenuItem
              key={context.id}
              onClick={() => onChange(context.id, context)}
              disabled={isAtLimit}
              className={cn(
                "flex items-center gap-2",
                value === context.id && "bg-muted",
                isAtLimit && "opacity-50"
              )}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: context.color || "#6B7280" }}
              />
              <span className="flex-1 truncate">{context.name}</span>
              {showCount && (
                <span className={cn(
                  "text-xs",
                  isAtLimit ? "text-destructive" : "text-muted-foreground"
                )}>
                  {context.thought_count}/{context.thought_limit}
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Export a hook for getting contexts
export function useContexts() {
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadContexts() {
      setIsLoading(true)
      const { contexts: data } = await getContexts()
      setContexts(data)
      setIsLoading(false)
    }
    loadContexts()
  }, [])

  const refresh = async () => {
    const { contexts: data } = await getContexts()
    setContexts(data)
  }

  return { contexts, isLoading, refresh }
}
