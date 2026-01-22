"use client"

import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { cycleTheme, themeName } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(
        "relative h-8 w-8 text-muted-foreground hover:text-foreground group",
        className
      )}
      onClick={cycleTheme}
      title={`${themeName} - Click to change theme`}
    >
      <Palette className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      <span className="sr-only">Change theme (currently {themeName})</span>
    </Button>
  )
}
