"use client"

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react"
import { AlertCircle, CheckCircle, Info, X, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "error" | "success" | "info" | "warning"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void
  showError: (error: unknown, fallbackMessage?: string) => void
  showSuccess: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// User-friendly error messages
function getErrorMessage(error: unknown, fallbackMessage?: string): { title: string; message?: string } {
  // Handle string errors
  if (typeof error === "string") {
    return { title: error }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Rate limiting
    if (message.includes("rate limit") || message.includes("429") || message.includes("too many")) {
      return {
        title: "Please slow down",
        message: "AI is taking a quick break. Please try again in a moment.",
      }
    }

    // Network errors
    if (message.includes("fetch") || message.includes("network") || message.includes("connection")) {
      return {
        title: "Connection lost",
        message: "Please check your internet and try again.",
      }
    }

    // Auth errors
    if (message.includes("not authenticated") || message.includes("unauthorized") || message.includes("401")) {
      return {
        title: "Session expired",
        message: "Please sign in again to continue.",
      }
    }

    // Server errors
    if (message.includes("500") || message.includes("internal server")) {
      return {
        title: "Something went wrong",
        message: "We're working on it. Please try again.",
      }
    }

    // Validation errors
    if (message.includes("required") || message.includes("invalid") || message.includes("validation")) {
      return {
        title: "Invalid input",
        message: error.message,
      }
    }

    // AI specific errors
    if (message.includes("gemini") || message.includes("ai") || message.includes("extract")) {
      return {
        title: "AI couldn't process that",
        message: "Please try again or enter gems manually.",
      }
    }

    // Quota/limit errors
    if (message.includes("limit") || message.includes("quota") || message.includes("maximum")) {
      return {
        title: "Limit reached",
        message: error.message,
      }
    }

    return {
      title: fallbackMessage || "Something went wrong",
      message: error.message,
    }
  }

  // Handle HTTP response errors
  if (typeof error === "object" && error !== null) {
    const err = error as { status?: number; statusText?: string; message?: string }

    if (err.status === 429) {
      return {
        title: "Please slow down",
        message: "AI is taking a quick break. Please try again in a moment.",
      }
    }

    if (err.status === 401 || err.status === 403) {
      return {
        title: "Access denied",
        message: "Please sign in again.",
      }
    }

    if (err.status && err.status >= 500) {
      return {
        title: "Server error",
        message: "Something went wrong. Please try again.",
      }
    }

    if (err.message) {
      return { title: err.message }
    }
  }

  return {
    title: fallbackMessage || "Something went wrong",
    message: "Please try again.",
  }
}

const toastIcons = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  warning: AlertCircle,
}

const toastStyles = {
  error: "bg-destructive/20 border-destructive/30 text-destructive backdrop-blur-xl",
  success: "bg-success/20 border-success/30 text-success backdrop-blur-xl",
  info: "bg-primary/20 border-primary/30 text-primary backdrop-blur-xl",
  warning: "bg-warning/20 border-warning/30 text-warning backdrop-blur-xl",
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = toastIcons[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in max-w-sm transition-all",
        toastStyles[toast.type]
      )}
      style={{ WebkitBackdropFilter: "blur(24px)" }}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 rounded-md hover:bg-foreground/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isOnline, setIsOnline] = useState(true)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const showError = useCallback((error: unknown, fallbackMessage?: string) => {
    const { title, message } = getErrorMessage(error, fallbackMessage)
    setToasts((prev) => [...prev, { type: "error", title, message, id: Math.random().toString(36).substring(2, 9) }])
  }, [])

  const showSuccess = useCallback((title: string, message?: string) => {
    setToasts((prev) => [...prev, { type: "success", title, message, id: Math.random().toString(36).substring(2, 9) }])
  }, [])

  const showInfo = useCallback((title: string, message?: string) => {
    setToasts((prev) => [...prev, { type: "info", title, message, id: Math.random().toString(36).substring(2, 9) }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showInfo }}>
      {children}

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-warning text-warning-foreground shadow-lg">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You&apos;re offline</span>
        </div>
      )}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Hook for inline error display
export function useInlineError() {
  const [error, setError] = useState<string | null>(null)

  const showError = (err: unknown) => {
    const { title, message } = getErrorMessage(err)
    setError(message ? `${title}: ${message}` : title)
  }

  const clearError = () => setError(null)

  return { error, showError, clearError, setError }
}

// Inline error component
interface InlineErrorProps {
  error: string | null
  className?: string
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <p>{error}</p>
    </div>
  )
}
