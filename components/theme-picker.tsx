"use client"

import { useState } from "react"
import { Palette, Check, Sun, Moon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, THEMES, THEME_INFO } from "@/components/theme-provider"
import { DARK_THEMES, LIGHT_THEMES, type Theme } from "@/lib/themes"
import { cn } from "@/lib/utils"

export function ThemePicker() {
  const { theme, setTheme, themeName } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          title={`Theme: ${themeName}`}
          className="relative"
        >
          <Palette className="h-5 w-5" />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
            style={{ backgroundColor: THEME_INFO[theme].preview }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          <Moon className="h-3.5 w-3.5" />
          Dark Themes
        </div>
        <div className="grid grid-cols-2 gap-1 p-1">
          {DARK_THEMES.map((t) => (
            <ThemeOption
              key={t}
              themeKey={t}
              currentTheme={theme}
              onSelect={() => {
                setTheme(t)
                setOpen(false)
              }}
            />
          ))}
        </div>

        <DropdownMenuSeparator />

        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          <Sun className="h-3.5 w-3.5" />
          Light Themes
        </div>
        <div className="grid grid-cols-2 gap-1 p-1">
          {LIGHT_THEMES.map((t) => (
            <ThemeOption
              key={t}
              themeKey={t}
              currentTheme={theme}
              onSelect={() => {
                setTheme(t)
                setOpen(false)
              }}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeOption({
  themeKey,
  currentTheme,
  onSelect,
}: {
  themeKey: Theme
  currentTheme: Theme
  onSelect: () => void
}) {
  const info = THEME_INFO[themeKey]
  const isActive = themeKey === currentTheme

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors w-full text-left",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-accent/50 text-foreground"
      )}
    >
      <span
        className="w-4 h-4 rounded-full border border-border shrink-0"
        style={{ backgroundColor: info.preview }}
      />
      <span className="truncate">{info.name}</span>
      {isActive && <Check className="h-3 w-3 ml-auto shrink-0" />}
    </button>
  )
}
