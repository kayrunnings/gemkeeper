"use client"

import { useState, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Gem,
  Sun,
  Moon,
  Trophy,
  StickyNote,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Sparkles,
  PanelRight,
  X,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/gems", label: "Gems", icon: Gem },
  { href: "/daily", label: "Daily Prompt", icon: Sun },
  { href: "/checkin", label: "Check-in", icon: Moon },
  { href: "/trophy-case", label: "Trophy Case", icon: Trophy },
]

const secondaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface LayoutShellProps {
  children: ReactNode
  userEmail?: string | null
  rightPanel?: ReactNode
  showRightPanel?: boolean
  onToggleRightPanel?: () => void
}

export function LayoutShell({
  children,
  userEmail,
  rightPanel,
  showRightPanel = false,
  onToggleRightPanel,
}: LayoutShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isActive = (href: string) => {
    if (href === "/gems") {
      return pathname === "/gems" || pathname.startsWith("/gems/")
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 h-16 border-b bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
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
              <span className="text-xl font-semibold hidden sm:inline">GemKeeper</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
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

            {/* Theme toggle */}
            <ThemeToggle />

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
            "hidden md:flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "w-16" : "w-60"
          )}
        >
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}

            <div className="my-3 border-t" />

            {secondaryNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Collapse toggle */}
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
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
            "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r p-4 pt-20 md:hidden transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}

            <div className="my-3 border-t" />

            {secondaryNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right panel - Contextual actions */}
        {rightPanel && showRightPanel && (
          <aside className="hidden lg:block w-80 border-l bg-card overflow-y-auto slide-in-right">
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  )
}
