import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80",
        outline: "text-foreground border-border",
        gem: "border-transparent bg-gem text-gem-foreground",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/10 text-warning",
        // Context tag variants
        meetings: "border-transparent bg-tag-meetings text-tag-meetings-foreground",
        feedback: "border-transparent bg-tag-feedback text-tag-feedback-foreground",
        conflict: "border-transparent bg-tag-conflict text-tag-conflict-foreground",
        focus: "border-transparent bg-tag-focus text-tag-focus-foreground",
        health: "border-transparent bg-tag-health text-tag-health-foreground",
        relationships: "border-transparent bg-tag-relationships text-tag-relationships-foreground",
        parenting: "border-transparent bg-tag-parenting text-tag-parenting-foreground",
        other: "border-transparent bg-tag-other text-tag-other-foreground",
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
