"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Calendar,
  ChevronRight,
  Filter,
  ArrowLeft,
} from "lucide-react"
import type { Moment, MomentSource } from "@/types/moments"

interface MomentsHistoryClientProps {
  initialMoments: Moment[]
}

export function MomentsHistoryClient({ initialMoments }: MomentsHistoryClientProps) {
  const [filter, setFilter] = useState<MomentSource | 'all'>('all')
  const router = useRouter()

  const filteredMoments = filter === 'all'
    ? initialMoments
    : initialMoments.filter(m => m.source === filter)

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  const handleMomentClick = (momentId: string) => {
    router.push(`/moments/${momentId}/prepare`)
  }

  return (
    <div className="container py-8 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold flex-1">Moments History</h1>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          {(['all', 'manual', 'calendar'] as const).map((option) => (
            <Button
              key={option}
              variant={filter === option ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(option)}
              className="capitalize"
            >
              {option === 'all' ? 'All' : option}
            </Button>
          ))}
        </div>
      </div>

      {/* Moments List */}
      {filteredMoments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'all'
                ? "No moments yet. Create one to get started."
                : `No ${filter} moments found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMoments.map((moment) => (
            <button
              key={moment.id}
              onClick={() => handleMomentClick(moment.id)}
              className={cn(
                "w-full text-left p-4 rounded-lg border bg-card",
                "hover:bg-muted/50 transition-colors",
                "flex items-center justify-between gap-3"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {moment.calendar_event_title || moment.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      moment.source === 'calendar'
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {moment.source === 'calendar' ? (
                      <Calendar className="h-3 w-3 mr-1" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    {moment.source}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(moment.created_at)}
                  </span>
                  {moment.gems_matched_count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {moment.gems_matched_count} gem{moment.gems_matched_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
