import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/* ─── Card Hierarchy — Sovereign + Neumorphic ─────────────────────── */
const cardVariants = cva(
  "rounded-2xl text-card-foreground transition-shadow",
  {
    variants: {
      variant: {
        /* Sovereign (desktop/non-FM) */
        default:  "bg-sovereign-cream border border-sovereign-warm/20 shadow-sovereign",
        elevated: "bg-sovereign-ivory border border-sovereign-warm/30 shadow-elevated",
        recessed: "bg-sovereign-parchment border border-sovereign-warm/15 shadow-none",
        ai:       "bg-sovereign-charcoal text-sovereign-parchment border-l-2 border-sovereign-gold shadow-sovereign",
        /* Neumorphic (mobile-first FM) */
        "neu-raised":  "bg-neu-base rounded-[18px] shadow-neu-raised border-0 neu-press",
        "neu-inset":   "bg-neu-base rounded-[18px] shadow-neu-inset border-0",
        "neu-ai":      "bg-sovereign-charcoal text-neu-light rounded-[18px] shadow-neu-raised border-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, cardVariants, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
