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
        // Context tag variants - muted pastels for glass compatibility
        // 20% bg opacity, 40% border opacity, full color text
        meetings: "border-[#60A5FA]/40 bg-[#60A5FA]/20 text-[#60A5FA]",
        feedback: "border-[#FB923C]/40 bg-[#FB923C]/20 text-[#FB923C]",
        conflict: "border-[#F87171]/40 bg-[#F87171]/20 text-[#F87171]",
        focus: "border-[#A78BFA]/40 bg-[#A78BFA]/20 text-[#A78BFA]",
        health: "border-[#4ADE80]/40 bg-[#4ADE80]/20 text-[#4ADE80]",
        relationships: "border-[#F472B6]/40 bg-[#F472B6]/20 text-[#F472B6]",
        parenting: "border-[#FACC15]/40 bg-[#FACC15]/20 text-[#FACC15]",
        other: "border-[#9CA3AF]/40 bg-[#9CA3AF]/20 text-[#9CA3AF]",
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
