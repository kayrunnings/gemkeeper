"use client"

import { cn } from "@/lib/utils"
import { Sparkles, Compass, Bookmark } from "lucide-react"

export type DiscoverTab = "for-you" | "explore" | "saved"

interface Tab {
  id: DiscoverTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: "for-you", label: "For You", icon: Sparkles },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "saved", label: "Saved", icon: Bookmark },
]

export interface DiscoverTabCounts {
  "for-you"?: number
  explore?: number
  saved?: number
}

interface DiscoverTabsProps {
  activeTab: DiscoverTab
  onTabChange: (tab: DiscoverTab) => void
  counts?: DiscoverTabCounts
  className?: string
}

export function DiscoverTabs({ activeTab, onTabChange, counts, className }: DiscoverTabsProps) {
  return (
    <div className={cn("border-b border-border", className)}>
      <div className="flex overflow-x-auto scrollbar-hide -mb-px" style={{ scrollbarWidth: "none" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const count = counts?.[tab.id]
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
