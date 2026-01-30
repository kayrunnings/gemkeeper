"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

export type QuadrantVariant = "capture" | "grow" | "apply" | "track"

interface HomeQuadrantProps {
  variant: QuadrantVariant
  icon: ReactNode
  title: string
  stat?: string | ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

const variantStyles: Record<QuadrantVariant, {
  iconBg: string
  iconColor: string
  hoverGlow: string
}> = {
  capture: {
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10",
    iconColor: "text-emerald-500",
    hoverGlow: "hover:shadow-[var(--glass-card-shadow),0_0_30px_rgba(16,185,129,0.15)]",
  },
  grow: {
    iconBg: "bg-gradient-to-br from-orange-500 to-blue-500",
    iconColor: "text-white",
    hoverGlow: "hover:shadow-[var(--glass-card-shadow),0_0_30px_var(--ai-glow)]",
  },
  apply: {
    iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-600/10",
    iconColor: "text-amber-500",
    hoverGlow: "hover:shadow-[var(--glass-card-shadow),0_0_30px_rgba(245,158,11,0.15)]",
  },
  track: {
    iconBg: "bg-gradient-to-br from-violet-400/20 to-purple-500/10",
    iconColor: "text-violet-400",
    hoverGlow: "hover:shadow-[var(--glass-card-shadow),0_0_30px_rgba(167,139,250,0.15)]",
  },
}

export function HomeQuadrant({
  variant,
  icon,
  title,
  stat,
  children,
  footer,
  className,
}: HomeQuadrantProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "glass-card p-4 flex flex-col transition-all duration-200",
        "hover:bg-[var(--glass-hover-bg)] hover:border-[var(--glass-hover-border)] hover:-translate-y-0.5",
        styles.hoverGlow,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-9 h-9 rounded-[10px] flex items-center justify-center text-base font-semibold",
              styles.iconBg,
              styles.iconColor
            )}
          >
            {icon}
          </div>
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        </div>
        {stat && (
          typeof stat === "string" ? (
            <div className="text-[11px] text-muted-foreground bg-[var(--glass-card-bg)] px-2.5 py-1 rounded-full border border-[var(--glass-card-border)]">
              {stat}
            </div>
          ) : (
            stat
          )
        )}
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="mt-auto pt-3 text-center">
          {footer}
        </div>
      )}
    </div>
  )
}
