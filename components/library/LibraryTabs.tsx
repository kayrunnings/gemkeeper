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

interface LibraryTabsProps {
  activeTab: LibraryTab
  className?: string
}

export function LibraryTabs({ activeTab, className }: LibraryTabsProps) {
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
