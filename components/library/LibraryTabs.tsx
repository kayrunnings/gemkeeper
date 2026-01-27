"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Library, Gem, StickyNote, BookOpen, Archive } from "lucide-react"

export type LibraryTab = "all" | "thoughts" | "notes" | "sources" | "archive"

interface Tab {
  id: LibraryTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: "all", label: "All", icon: Library },
  { id: "thoughts", label: "Thoughts", icon: Gem },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "sources", label: "Sources", icon: BookOpen },
  { id: "archive", label: "Archive", icon: Archive },
]

export interface TabCounts {
  all?: number
  thoughts?: number
  notes?: number
  sources?: number
  archive?: number
}

interface LibraryTabsProps {
  activeTab: LibraryTab
  counts?: TabCounts
  className?: string
}

export function LibraryTabs({ activeTab, counts, className }: LibraryTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (tab: LibraryTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "all") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    const queryString = params.toString()
    router.push(`/library${queryString ? `?${queryString}` : ""}`)
  }

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
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count !== undefined && (
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
