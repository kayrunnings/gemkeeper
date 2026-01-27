"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Target, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickAction {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  gradient: string
}

const quickActions: QuickAction[] = [
  {
    href: "/thoughts/extract",
    icon: Sparkles,
    title: "AI Capture",
    description: "Paste anything, we'll figure it out",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    href: "/moments",
    icon: Target,
    title: "New Moment",
    description: "Prep for an upcoming situation",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    href: "/discover",
    icon: Lightbulb,
    title: "Discover",
    description: "Find new ideas",
    gradient: "from-amber-500 to-orange-600",
  },
]

interface QuickActionsRowProps {
  className?: string
}

export function QuickActionsRow({ className }: QuickActionsRowProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3", className)}>
      {quickActions.map((action) => {
        const Icon = action.icon
        return (
          <Link key={action.href} href={action.href}>
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br",
                    action.gradient,
                    "group-hover:scale-110 transition-transform duration-300"
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
