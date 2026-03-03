import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/* ─── Card Hierarchy — Lit Room Neumorphic Depth System ─────────────── */
/* RAISED = touchable objects ON the desk (outer shadows)               */
/* RECESSED = wells carved INTO the desk (inner shadows)                */
/* All backgrounds are opaque cool grey to keep ambient light effect     */
const cardVariants = cva(
  "rounded-[20px] transition-all duration-[400ms]",
  {
    variants: {
      variant: {
        /* Lit Room neumorphic cards */
        default:  "rounded-[20px] border border-[rgba(255,255,255,0.4)]",
        elevated: "rounded-[20px] border border-[rgba(255,255,255,0.5)]",
        recessed: "rounded-[16px] border border-[rgba(255,255,255,0.2)]",
        ai:       "rounded-[20px] border-l-2 border-[rgba(92,111,181,0.3)]",
        /* Neumorphic presets */
        "neu-raised":  "rounded-[20px] border border-[rgba(255,255,255,0.5)] neu-press",
        "neu-inset":   "rounded-[16px] border border-[rgba(255,255,255,0.2)]",
        "neu-ai":      "rounded-[20px] border border-[rgba(92,111,181,0.15)]",
        /* Glass — frosted translucent with directional borders */
        "glass":       "rounded-[22px]",
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
  ({ className, variant, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      style={{
        background: variant === "glass"
          ? "rgba(240, 242, 248, 0.55)"
          : variant === "ai" || variant === "neu-ai"
          ? "var(--bg-dark)"
          : variant === "neu-inset" || variant === "recessed"
          ? "var(--bg-dark)"
          : variant === "neu-raised" || variant === "elevated"
          ? "var(--bg-light)"
          : "var(--bg-card)",
        color: "var(--text-primary)",
        boxShadow: variant === "glass"
          ? "0 8px 32px rgba(0, 0, 0, 0.06)"
          : variant === "neu-raised" || variant === "elevated"
          ? "var(--raise-lg)"
          : variant === "neu-inset" || variant === "recessed"
          ? "var(--press)"
          : undefined,
        ...(variant === "glass" ? {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.6)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.6)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
          borderRight: "1px solid rgba(255, 255, 255, 0.15)",
        } : {}),
        transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        ...style,
      }}
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
    <p ref={ref} className={cn("text-sm", className)} style={{ color: "var(--text-secondary)" }} {...props} />
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
