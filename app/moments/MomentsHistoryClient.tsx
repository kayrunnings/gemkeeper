"use client"

import { useState, useEffect } from "react"
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
  Plus,
} from "lucide-react"
import type { Moment, MomentSource } from "@/types/moments"
import { LayoutShell } from "@/components/layout-shell"
import { MomentFAB } from "@/components/moments/MomentFAB"
import { createClient } from "@/lib/supabase/client"

interface MomentsHistoryClientProps {
  initialMoments: Moment[]
}

export function MomentsHistoryClient({ initialMoments }: MomentsHistoryClientProps) {
  const [filter, setFilter] = useState<MomentSource | 'all'>('all')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    getUser()
  }, [supabase])

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
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Moments</h1>
            <p className="text-muted-foreground mt-1">
              Prepare for situations with your gems
            </p>
          </div>
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
                        ? "bg-info/10 text-info border-info/30"
                        : "bg-warning/10 text-warning border-warning/30"
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

      {/* Moment FAB */}
      <MomentFAB />
    </LayoutShell>
  )
}
