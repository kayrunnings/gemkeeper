"use client"

import { memo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Source, SOURCE_TYPE_LABELS, SOURCE_TYPE_ICONS, SOURCE_STATUS_LABELS, SOURCE_STATUS_ICONS } from "@/lib/types/source"
import { Gem } from "lucide-react"
import { cn } from "@/lib/utils"

interface SourceCardProps {
  source: Source
  linkedThoughtsCount?: number
  className?: string
  onClick?: () => void
  showStatus?: boolean
}

export const SourceCard = memo(function SourceCard({
  source,
  linkedThoughtsCount = 0,
  className,
  onClick,
  showStatus = true,
}: SourceCardProps) {
  const typeIcon = SOURCE_TYPE_ICONS[source.type]
  const typeLabel = SOURCE_TYPE_LABELS[source.type]
  const statusIcon = source.status ? SOURCE_STATUS_ICONS[source.status] : null
  const statusLabel = source.status ? SOURCE_STATUS_LABELS[source.status] : null

  const statusColors: Record<string, string> = {
    want_to_read: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    reading: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    completed: "bg-green-500/10 text-green-600 border-green-500/30",
    archived: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  }

  const content = (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden h-full",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4">
        {/* Cover image or placeholder */}
        <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
          {source.cover_image_url ? (
            <img
              src={source.cover_image_url}
              alt={source.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl">{typeIcon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {source.name}
            </h3>
          </div>

          {source.author && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {source.author}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <span className="mr-1">{typeIcon}</span>
              {typeLabel}
            </Badge>

            {showStatus && source.status && (
              <Badge
                variant="outline"
                className={cn("text-xs", statusColors[source.status])}
              >
                <span className="mr-1">{statusIcon}</span>
                {statusLabel}
              </Badge>
            )}

            {linkedThoughtsCount > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Gem className="h-3 w-3" />
                {linkedThoughtsCount} thought{linkedThoughtsCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (onClick) {
    return content
  }

  return (
    <Link href={`/library/sources/${source.id}`}>
      {content}
    </Link>
  )
})
