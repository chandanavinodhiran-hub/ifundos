"use client";

import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";

interface ScoreWellProps {
  score: number;
  label?: string;
  verdict?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const verdictColor = (score: number) => {
  if (score >= 75) return "text-envfund";
  if (score >= 50) return "text-envfund";
  return "text-critical";
};

export function ScoreWell({
  score,
  label,
  verdict,
  size = "md",
  animated = true,
  className,
}: ScoreWellProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "score-well flex flex-col items-center justify-center",
          size === "sm" && "score-well-sm",
          size === "lg" && "score-well-lg"
        )}
      >
        {animated ? (
          <AnimatedCounter
            end={score}
            duration={1200}
            className={cn(
              "font-sans font-extrabold leading-none",
              size === "sm" && "text-lg",
              size === "md" && "text-score-display",
              size === "lg" && "text-score-display-lg",
              verdictColor(score)
            )}
          />
        ) : (
          <span
            className={cn(
              "font-sans font-extrabold leading-none",
              size === "sm" && "text-lg",
              size === "md" && "text-score-display",
              size === "lg" && "text-score-display-lg",
              verdictColor(score)
            )}
          >
            {score}
          </span>
        )}
      </div>
      {verdict && (
        <span
          className={cn(
            "font-mono text-[8px] font-semibold uppercase tracking-wider",
            verdictColor(score)
          )}
        >
          {verdict}
        </span>
      )}
      {label && (
        <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </span>
      )}
    </div>
  );
}
