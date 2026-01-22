"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gem, Trophy, CheckCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Stats {
  activeGems: number
  graduatedGems: number
  totalApplications: number
}

interface ActivityStatsCardProps {
  stats: Stats
  className?: string
}

export function ActivityStatsCard({ stats, className }: ActivityStatsCardProps) {
  const statItems = [
    {
      label: "Active Thoughts",
      value: stats.activeGems,
      icon: Gem,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Graduated",
      value: stats.graduatedGems,
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Applications",
      value: stats.totalApplications,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {statItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="text-center">
                <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", item.bgColor)}>
                  <Icon className={cn("h-5 w-5", item.color)} />
                </div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
