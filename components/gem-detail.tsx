"use client"

import { useState } from "react"
import { Gem, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS } from "@/lib/types/gem"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  Edit,
  Archive,
  Trophy,
  CheckCircle,
  XCircle,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GemEditForm } from "@/components/gem-edit-form"
import { RetireGemDialog } from "@/components/retire-gem-dialog"
import { GraduateGemDialog } from "@/components/graduate-gem-dialog"

interface GemDetailProps {
  gem: Gem
  onGemUpdated: (gem: Gem) => void
  onGemRetired: () => void
  onGemGraduated: () => void
}

export function GemDetail({ gem, onGemUpdated, onGemRetired, onGemGraduated }: GemDetailProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRetireOpen, setIsRetireOpen] = useState(false)
  const [isGraduateOpen, setIsGraduateOpen] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const canGraduate = gem.application_count >= 5

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-sm",
                CONTEXT_TAG_COLORS[gem.context_tag]
              )}
            >
              {gem.context_tag === "other" && gem.custom_context
                ? gem.custom_context
                : CONTEXT_TAG_LABELS[gem.context_tag]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Full content */}
          <div>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {gem.content}
            </p>
          </div>

          {/* Source */}
          {gem.source && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Source:</span>
              {gem.source_url ? (
                <a
                  href={gem.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {gem.source}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-foreground">{gem.source}</span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-lg font-semibold">{gem.application_count}</span>
              </div>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-lg font-semibold">{gem.skip_count}</span>
              </div>
              <p className="text-xs text-muted-foreground">Skips</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Calendar className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(gem.created_at)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsRetireOpen(true)}
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              Retire
            </Button>
            <Button
              variant="default"
              onClick={() => setIsGraduateOpen(true)}
              disabled={!canGraduate}
              className="gap-2"
              title={!canGraduate ? "Apply this gem 5+ times to graduate it" : undefined}
            >
              <Trophy className="h-4 w-4" />
              Graduate
            </Button>
          </div>

          {!canGraduate && (
            <p className="text-sm text-muted-foreground">
              Apply this gem {5 - gem.application_count} more {5 - gem.application_count === 1 ? "time" : "times"} to unlock graduation.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit modal */}
      <GemEditForm
        gem={gem}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onGemUpdated={onGemUpdated}
      />

      {/* Retire dialog */}
      <RetireGemDialog
        gem={gem}
        isOpen={isRetireOpen}
        onClose={() => setIsRetireOpen(false)}
        onRetired={onGemRetired}
      />

      {/* Graduate dialog */}
      <GraduateGemDialog
        gem={gem}
        isOpen={isGraduateOpen}
        onClose={() => setIsGraduateOpen(false)}
        onGraduated={onGemGraduated}
      />
    </>
  )
}
