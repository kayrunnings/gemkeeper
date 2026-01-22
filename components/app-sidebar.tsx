"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Gem,
  Sun,
  Moon,
  Trophy,
  StickyNote,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: "/gems", label: "Gems", icon: Gem },
  { href: "/daily", label: "Daily", icon: Sun },
  { href: "/checkin", label: "Check-in", icon: Moon },
  { href: "/trophy-case", label: "Trophy Case", icon: Trophy },
]

const secondaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/gems") {
      return pathname === "/gems" || pathname.startsWith("/gems/")
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className="w-64 border-r bg-muted/30 p-4">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
        <div className="my-2 border-t" />
        {secondaryNavItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/gems") {
      return pathname === "/gems" || pathname.startsWith("/gems/")
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/50 md:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-muted/30 border-r p-4 pt-20 md:hidden">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          <div className="my-2 border-t" />
          {secondaryNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
