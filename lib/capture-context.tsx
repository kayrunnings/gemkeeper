"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { ContextWithCount } from "@/lib/types/context"

interface CaptureContextValue {
  isOpen: boolean
  openCapture: () => void
  closeCapture: () => void
  contexts: ContextWithCount[]
  setContexts: (contexts: ContextWithCount[]) => void
}

const CaptureContext = createContext<CaptureContextValue | null>(null)

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [contexts, setContexts] = useState<ContextWithCount[]>([])

  const openCapture = () => setIsOpen(true)
  const closeCapture = () => setIsOpen(false)

  return (
    <CaptureContext.Provider
      value={{
        isOpen,
        openCapture,
        closeCapture,
        contexts,
        setContexts,
      }}
    >
      {children}
    </CaptureContext.Provider>
  )
}

export function useCapture() {
  const context = useContext(CaptureContext)
  if (!context) {
    throw new Error("useCapture must be used within a CaptureProvider")
  }
  return context
}
