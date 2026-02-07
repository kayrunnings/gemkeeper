"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { MomentEntryModal } from "./MomentEntryModal"
import type { MomentWithThoughts } from "@/types/moments"

interface MomentFABProps {
  className?: string
}

export function MomentFAB({ className }: MomentFABProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  // Keyboard shortcut: Cmd+M / Ctrl+M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault()
        setIsModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleMomentCreated = (moment: MomentWithThoughts) => {
    // Navigate to the prep card page
    router.push(`/moments/${moment.id}/prepare`)
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 px-5 rounded-full shadow-lg",
          "bg-amber-500 hover:bg-amber-600 text-white",
          "gap-2 font-medium",
          className
        )}
        title="Create a moment (Ctrl+M / Cmd+M)"
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline">Moment</span>
      </Button>

      <MomentEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMomentCreated={handleMomentCreated}
      />
    </>
  )
}
