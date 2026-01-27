"use client"

import { useState, useEffect, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Gem,
  Sun,
  Trophy,
  StickyNote,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PanelRight,
  X,
  Home,
  Archive,
  Search,
  Library,
  Zap,
  Target,
  FileText,
  BookOpen,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useSidebar } from "@/lib/sidebar-context"
import { GlobalSearch } from "@/components/search/GlobalSearch"
import { useGlobalShortcuts } from "@/lib/hooks/useGlobalShortcuts"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { FloatingMomentButton } from "@/components/moments/FloatingMomentButton"
import { AICaptureModal } from "@/components/capture/AICaptureModal"
import type { ContextWithCount } from "@/lib/types/context"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

// Library sub-items
const librarySubItems: NavItem[] = [
  { href: "/library", label: "All", icon: Library },
  { href: "/library?tab=thoughts", label: "Thoughts", icon: Gem },
  { href: "/library?tab=notes", label: "Notes", icon: StickyNote },
  { href: "/library?tab=sources", label: "Sources", icon: BookOpen },
  { href: "/library?tab=archive", label: "Archive", icon: Archive },
]

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  {
    href: "/library",
    label: "Library",
    icon: Library,
    children: librarySubItems,
  },
  { href: "/checkin", label: "Active", icon: Zap },
  { href: "/moments", label: "Moments", icon: Target },
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/thought-bank", label: "Trophy Case", icon: Trophy },
]

const secondaryNavItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
]

interface LayoutShellProps {
  children: ReactNode
  userEmail?: string | null
  rightPanel?: ReactNode
  showRightPanel?: boolean
  onToggleRightPanel?: () => void
  contexts?: ContextWithCount[]
  calendarConnected?: boolean
}

export function LayoutShell({
  children,
  userEmail,
  rightPanel,
  showRightPanel = false,
  onToggleRightPanel,
  contexts = [],
  calendarConnected = false,
}: LayoutShellProps) {
  const { isCollapsedByDefault } = useSidebar()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isCollapsedByDefault)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSearchOpen, setIsSearchOpen, isCaptureOpen, setIsCaptureOpen } = useGlobalShortcuts()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Sync sidebar state when preference changes (e.g., from settings page)
  useEffect(() => {
    setIsSidebarCollapsed(isCollapsedByDefault)
  }, [isCollapsedByDefault])

  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true)

  const isActive = (href: string) => {
    // Handle library tab params
    if (href.includes("?tab=")) {
      const [basePath, query] = href.split("?")
      const tabParam = new URLSearchParams(query).get("tab")
      const currentTab = new URLSearchParams(pathname.split("?")[1] || "").get("tab") || "all"
      return pathname.startsWith(basePath) && currentTab === tabParam
    }
    if (href === "/library") {
      return pathname === "/library" || pathname.startsWith("/library")
    }
    if (href === "/thoughts") {
      return pathname === "/thoughts" || pathname.startsWith("/thoughts/")
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const isLibraryActive = pathname.startsWith("/library") || pathname.startsWith("/thoughts") || pathname.startsWith("/dashboard")

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 h-16 border-b glass-sidebar">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Logo */}
            <Link href="/home" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl ai-gradient flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold hidden sm:inline">ThoughtFolio</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Capture button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsCaptureOpen(true)}
              title="Quick Capture (Cmd+N)"
              className="hidden sm:flex"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Search button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsSearchOpen(true)}
              title="Search (Cmd+K)"
              className="hidden sm:flex"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Right panel toggle */}
            {rightPanel && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden lg:flex"
                onClick={onToggleRightPanel}
                title={showRightPanel ? "Hide panel" : "Show panel"}
              >
                <PanelRight className={cn("h-5 w-5 transition-colors", showRightPanel && "text-primary")} />
              </Button>
            )}

            {/* User info and sign out */}
            <div className="flex items-center gap-2 pl-2 border-l">
              <div
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground cursor-default"
                title={userEmail ?? undefined}
              >
                {userEmail?.[0]?.toUpperCase() ?? "U"}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Sign out"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside
          className={cn(
            "hidden md:flex flex-col glass-sidebar transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "w-16" : "w-60"
          )}
        >
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = item.children ? isLibraryActive : isActive(item.href)

              // Handle items with children (Library)
              if (item.children && !isSidebarCollapsed) {
                return (
                  <div key={item.href} className="space-y-1">
                    <button
                      onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        active
                          ? "text-primary"
                          : "text-muted-foreground hover:bg-[var(--glass-hover-bg)] hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {isLibraryExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {isLibraryExpanded && (
                      <div className="ml-4 pl-4 border-l border-[var(--glass-sidebar-border)] space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const childActive = isActive(child.href)
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                                childActive
                                  ? "glass-button-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-[var(--glass-hover-bg)] hover:text-foreground"
                              )}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" />
                              <span>{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              // Collapsed sidebar - show just icon for Library
              if (item.children && isSidebarCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      active
                        ? "glass-button-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-[var(--glass-hover-bg)] hover:text-foreground"
                    )}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </Link>
                )
              }

              // Regular nav items
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "glass-button-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-[var(--glass-hover-bg)] hover:text-foreground"
                  )}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}

            <div className="my-3 border-t border-[var(--glass-sidebar-border)]" />

            {secondaryNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "glass-button-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-[var(--glass-hover-bg)] hover:text-foreground"
                  )}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-[var(--glass-sidebar-border)] space-y-2">
              <Link href="/thoughts/extract">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Capture
                </Button>
              </Link>
              <Link href="/moments">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Target className="h-4 w-4" />
                  New Moment
                </Button>
              </Link>
            </div>
          )}

          {/* Collapse toggle */}
          <div className="p-3 border-t border-[var(--glass-sidebar-border)]">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover-bg)]",
                isSidebarCollapsed && "justify-center"
              )}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-200",
                isSidebarCollapsed && "rotate-180"
              )} />
              {!isSidebarCollapsed && <span>Collapse</span>}
            </Button>
          </div>
        </aside>

        {/* Sidebar - Mobile */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 glass-sidebar p-4 pt-20 md:hidden transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = item.children ? isLibraryActive : isActive(item.href)

              // Handle items with children (Library)
              if (item.children) {
                return (
                  <div key={item.href} className="space-y-1">
                    <button
                      onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "text-primary"
                          : "hover:bg-[var(--glass-hover-bg)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {isLibraryExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {isLibraryExpanded && (
                      <div className="ml-4 pl-4 border-l border-[var(--glass-sidebar-border)] space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const childActive = isActive(child.href)
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                                childActive
                                  ? "glass-button-primary text-primary-foreground"
                                  : "hover:bg-[var(--glass-hover-bg)]"
                              )}
                            >
                              <ChildIcon className="h-4 w-4" />
                              <span>{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "glass-button-primary text-primary-foreground"
                      : "hover:bg-[var(--glass-hover-bg)]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}

            <div className="my-3 border-t border-[var(--glass-sidebar-border)]" />

            {secondaryNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "glass-button-primary text-primary-foreground"
                      : "hover:bg-[var(--glass-hover-bg)]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions - Mobile */}
          <div className="pt-4 mt-auto border-t border-[var(--glass-sidebar-border)] space-y-2">
            <Link href="/thoughts/extract" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="h-4 w-4" />
                AI Capture
              </Button>
            </Link>
            <Link href="/moments" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <Target className="h-4 w-4" />
                New Moment
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Right panel - Contextual actions */}
        {rightPanel && showRightPanel && (
          <aside className="hidden lg:block w-80 glass-sidebar border-l-0 overflow-y-auto slide-in-right">
            {rightPanel}
          </aside>
        )}
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* AI Capture Modal */}
      <AICaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        contexts={contexts}
      />

      {/* Floating Moment Button */}
      <FloatingMomentButton calendarConnected={calendarConnected} />

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
