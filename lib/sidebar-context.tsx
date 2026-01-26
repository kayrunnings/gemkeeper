"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

export const SIDEBAR_STORAGE_KEY = "thoughtfolio-sidebar-collapsed"

interface SidebarContextType {
  isCollapsedByDefault: boolean
  setCollapsedByDefault: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

function getInitialSidebarPreference(): boolean {
  if (typeof window === "undefined") return false

  const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
  return stored === "true"
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsedByDefault, setCollapsedState] = useState<boolean>(getInitialSidebarPreference)

  // Persist preference to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsedByDefault))
  }, [isCollapsedByDefault])

  const setCollapsedByDefault = useCallback((collapsed: boolean) => {
    setCollapsedState(collapsed)
  }, [])

  return (
    <SidebarContext.Provider value={{ isCollapsedByDefault, setCollapsedByDefault }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
