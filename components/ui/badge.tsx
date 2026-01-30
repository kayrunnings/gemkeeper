import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/20 text-primary shadow-sm hover:bg-primary/30",
        secondary:
          "border-secondary/40 bg-secondary/20 text-secondary-foreground hover:bg-secondary/30",
        destructive:
          "border-destructive/40 bg-destructive/20 text-destructive shadow-sm hover:bg-destructive/30",
        outline: "text-foreground border-[var(--glass-card-border)] bg-transparent",
        gem: "border-thought/40 bg-thought/20 text-thought-foreground",
        success: "border-success/40 bg-success/20 text-success",
        warning: "border-warning/40 bg-warning/20 text-warning",
        // Context tag variants - using theme CSS variables for consistency
        meetings: "border-tag-meetings-foreground/40 bg-tag-meetings text-tag-meetings-foreground",
        feedback: "border-tag-feedback-foreground/40 bg-tag-feedback text-tag-feedback-foreground",
        conflict: "border-tag-conflict-foreground/40 bg-tag-conflict text-tag-conflict-foreground",
        focus: "border-tag-focus-foreground/40 bg-tag-focus text-tag-focus-foreground",
        health: "border-tag-health-foreground/40 bg-tag-health text-tag-health-foreground",
        relationships: "border-tag-relationships-foreground/40 bg-tag-relationships text-tag-relationships-foreground",
        parenting: "border-tag-parenting-foreground/40 bg-tag-parenting text-tag-parenting-foreground",
        other: "border-tag-other-foreground/40 bg-tag-other text-tag-other-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
