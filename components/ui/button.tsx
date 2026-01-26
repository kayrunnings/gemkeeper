import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "glass-button-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]",
        destructive:
          "bg-destructive/80 text-destructive-foreground shadow-sm backdrop-blur-sm border border-destructive/30 hover:bg-destructive/90 hover:shadow-md active:scale-[0.98]",
        outline:
          "border border-[var(--glass-card-border)] bg-transparent shadow-sm hover:bg-[var(--glass-hover-bg)] hover:border-[var(--glass-hover-border)] active:scale-[0.98]",
        secondary:
          "glass-button-secondary text-secondary-foreground hover:brightness-110 active:scale-[0.98]",
        ghost: "hover:bg-[var(--glass-hover-bg)] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        ai: "ai-gradient text-white shadow-sm hover:shadow-md hover:shadow-primary/25 active:scale-[0.98]",
        success:
          "bg-success/80 text-success-foreground shadow-sm backdrop-blur-sm border border-success/30 hover:bg-success/90 hover:shadow-md active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
