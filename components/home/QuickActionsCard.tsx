"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gem, Target, Moon, Zap } from "lucide-react"

interface QuickActionsCardProps {
  className?: string
}

export function QuickActionsCard({ className }: QuickActionsCardProps) {
  const actions = [
    {
      label: "Add Thought",
      href: "/thoughts",
      icon: Gem,
      variant: "default" as const,
    },
    {
      label: "New Moment",
      href: "/moments",
      icon: Target,
      variant: "outline" as const,
    },
    {
      label: "Check-in",
      href: "/checkin",
      icon: Moon,
      variant: "outline" as const,
    },
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Button variant={action.variant} className="w-full justify-start gap-2">
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
