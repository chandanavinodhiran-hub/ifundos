"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NeuProgressProps {
  value: number;
  variant?: "gold" | "green" | "amber" | "critical";
  size?: "sm" | "md";
  label?: string;
  showValue?: boolean;
  className?: string;
  delay?: number;
  /** Use deeper groove track for dimension score bars */
  groove?: boolean;
  /** Override track CSS class */
  trackClassName?: string;
  /** Override fill CSS class */
  fillClassName?: string;
  /** Override track height */
  trackHeight?: number;
}

const fillGradients = {
  gold: "linear-gradient(90deg, rgba(75, 165, 195, 0.7), rgba(75, 165, 195, 0.9))",
  green: "linear-gradient(90deg, #4a7c59, #6a9c79)",
  amber: "linear-gradient(90deg, rgba(175, 148, 63, 0.55), rgba(175, 148, 63, 0.7))",
  critical: "linear-gradient(90deg, rgba(150, 90, 90, 0.45), rgba(150, 90, 90, 0.6))",
};

export function NeuProgress({
  value,
  variant = "gold",
  size = "md",
  label,
  showValue = false,
  className,
  delay = 0,
  groove = false,
  trackClassName,
  fillClassName,
  trackHeight,
}: NeuProgressProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimatedWidth(Math.min(value, 100)), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, delay]);

  return (
    <div className={cn("w-full", className)} ref={ref}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-semibold text-sovereign-stone uppercase tracking-wide">
              {label}
            </span>
          )}
          {showValue && (
            <span className="font-mono text-xs font-medium text-sovereign-charcoal tabular-nums">
              {value}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          trackClassName || (groove ? "dimension-bar-track" : "neu-track"),
          !trackHeight && (size === "sm" ? "h-2" : "h-3")
        )}
        style={trackHeight ? { height: `${trackHeight}px` } : undefined}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-800 ease-out", fillClassName)}
          style={{
            width: `${animatedWidth}%`,
            background: fillGradients[variant],
            boxShadow: variant === "gold" ? "0 0 8px rgba(75,165,195,0.3)" : undefined,
            transitionDuration: "0.8s",
          }}
        />
      </div>
    </div>
  );
}
