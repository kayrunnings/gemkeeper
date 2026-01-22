"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Calendar,
  ChevronRight,
  Clock,
} from "lucide-react"
import type { Moment } from "@/types/moments"
import { getRecentMoments } from "@/lib/moments"

interface RecentMomentsProps {
  className?: string
  limit?: number
}

export function RecentMoments({ className, limit = 10 }: RecentMomentsProps) {
  const [moments, setMoments] = useState<Moment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadMoments() {
      setIsLoading(true)
      const { moments: recentMoments } = await getRecentMoments(limit)
      setMoments(recentMoments)
      setIsLoading(false)
    }
    loadMoments()
  }, [limit])

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleMomentClick = (momentId: string) => {
    router.push(`/moments/${momentId}/prepare`)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Moments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (moments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Moments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No moments yet. Create one to prepare for your next situation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Moments
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/moments')}
            className="text-xs"
          >
            See all
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {moments.map((moment) => (
          <button
            key={moment.id}
            data-testid="moment-item"
            onClick={() => handleMomentClick(moment.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg border",
              "hover:bg-muted/50 transition-colors",
              "flex items-center justify-between gap-3"
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {moment.calendar_event_title || moment.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(moment.created_at)}
                </span>
                {moment.gems_matched_count > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {moment.gems_matched_count} gem{moment.gems_matched_count !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {moment.source === 'calendar' ? (
                <Calendar className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-500" />
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
