import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        /* Neumorphic — inset for non-clickable badge pills */
        neu: "border-0 bg-[#E2E5ED] text-sovereign-charcoal font-semibold shadow-[inset_2px_2px_5px_rgba(155,161,180,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]",
        "neu-gold": "border-0 bg-[#E2E5ED] text-sovereign-gold font-semibold shadow-[inset_2px_2px_5px_rgba(155,161,180,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]",
        "neu-verified": "border-0 bg-[#E2E5ED] text-verified font-semibold shadow-[inset_2px_2px_5px_rgba(155,161,180,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]",
        "neu-amber": "border-0 bg-[#E2E5ED] text-envfund font-semibold shadow-[inset_2px_2px_5px_rgba(155,161,180,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]",
        "neu-critical": "border-0 bg-[#E2E5ED] text-critical font-semibold shadow-[inset_2px_2px_5px_rgba(155,161,180,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
