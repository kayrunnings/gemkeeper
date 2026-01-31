"use client"

import { memo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  SourceType,
  SOURCE_TYPE_ICONS,
  SourceStatus,
  SOURCE_STATUS_ICONS,
  SOURCE_STATUS_LABELS
} from "@/lib/types/source"
import { cn } from "@/lib/utils"
import { BookOpen } from "lucide-react"

interface SourceBadgeProps {
  sourceId?: string
  sourceName: string
  sourceType?: SourceType
  showIcon?: boolean
  linkToSource?: boolean
  className?: string
  size?: "sm" | "default"
}

// Badge that shows source name with type icon, optionally links to source detail
export const SourceBadge = memo(function SourceBadge({
  sourceId,
  sourceName,
  sourceType = "other",
  showIcon = true,
  linkToSource = true,
  className,
  size = "default",
}: SourceBadgeProps) {
  const icon = SOURCE_TYPE_ICONS[sourceType]

  const badgeContent = (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center gap-1 font-normal",
        size === "sm" && "text-xs py-0 px-1.5",
        linkToSource && sourceId && "hover:bg-secondary/80 cursor-pointer",
        className
      )}
    >
      {showIcon && <span className="text-sm">{icon}</span>}
      <span className="truncate max-w-[150px]">{sourceName}</span>
    </Badge>
  )

  if (linkToSource && sourceId) {
    return (
      <Link href={`/library/sources/${sourceId}`} className="inline-flex">
        {badgeContent}
      </Link>
    )
  }

  return badgeContent
})

interface SourceStatusBadgeProps {
  status: SourceStatus
  showIcon?: boolean
  className?: string
}

// Badge that shows source status (Want to Read, Reading, Completed, Archived)
export const SourceStatusBadge = memo(function SourceStatusBadge({
  status,
  showIcon = true,
  className,
}: SourceStatusBadgeProps) {
  const icon = SOURCE_STATUS_ICONS[status]
  const label = SOURCE_STATUS_LABELS[status]

  const statusColors: Record<SourceStatus, string> = {
    want_to_read: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    reading: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    completed: "bg-green-500/10 text-green-600 border-green-500/30",
    archived: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1",
        statusColors[status],
        className
      )}
    >
      {showIcon && <span>{icon}</span>}
      {label}
    </Badge>
  )
})

interface SourceLinkProps {
  sourceId: string
  sourceName: string
  sourceType?: SourceType
  coverImageUrl?: string | null
  className?: string
}

// Compact source link with cover image (for thought detail pages)
export const SourceLink = memo(function SourceLink({
  sourceId,
  sourceName,
  sourceType = "other",
  coverImageUrl,
  className,
}: SourceLinkProps) {
  const icon = SOURCE_TYPE_ICONS[sourceType]

  return (
    <Link
      href={`/library/sources/${sourceId}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group",
        className
      )}
    >
      {/* Cover image or icon */}
      <div className="w-10 h-12 rounded overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={sourceName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl">{icon}</span>
        )}
      </div>

      {/* Source info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
          {sourceName}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          View source
        </p>
      </div>
    </Link>
  )
})
