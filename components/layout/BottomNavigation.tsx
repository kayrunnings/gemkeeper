"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Library, Zap, Sparkles } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  matchPaths?: string[]
}

const navItems: NavItem[] = [
  {
    href: "/home",
    label: "Home",
    icon: Home,
    matchPaths: ["/home"]
  },
  {
    href: "/library",
    label: "Library",
    icon: Library,
    matchPaths: ["/library", "/thoughts", "/notes", "/dashboard"]
  },
  {
    href: "/checkin",
    label: "Active",
    icon: Zap,
    matchPaths: ["/checkin", "/daily"]
  },
  {
    href: "/discover",
    label: "Discover",
    icon: Sparkles,
    matchPaths: ["/discover"]
  },
]

export function BottomNavigation() {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      )
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-sidebar border-t border-[var(--glass-sidebar-border)] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
