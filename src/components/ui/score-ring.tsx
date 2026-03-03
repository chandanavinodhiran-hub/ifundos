"use client";

import { useEffect, useRef, useState } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  delay?: number;
  className?: string;
}

function getStrokeColor(score: number): string {
  if (score === 0) return "#9CA3AF";
  if (score >= 75) return "#5C6FB5";
  if (score >= 50) return "#5CA03E";
  return "#EF4444";
}

function getBgStrokeColor(score: number): string {
  if (score === 0) return "#E5E7EB";
  if (score >= 75) return "rgba(92, 111, 181, 0.25)";
  if (score >= 50) return "rgba(92, 160, 62, 0.2)";
  return "rgba(239, 68, 68, 0.2)";
}

function getTextColor(score: number): string {
  if (score === 0) return "#9CA3AF";
  if (score >= 75) return "#5C6FB5";
  if (score >= 50) return "#5CA03E";
  return "#EF4444";
}

export function ScoreRing({
  score,
  size = 100,
  strokeWidth = 8,
  label,
  delay = 0,
  className = "",
}: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<SVGSVGElement>(null);
  const started = useRef(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    if (started.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          setTimeout(() => {
            const duration = 1200;
            const startTime = performance.now();
            function animate(now: number) {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setAnimatedScore(eased * score);
              if (progress < 1) requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
          }, delay);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [score, delay]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={getBgStrokeColor(score)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={getStrokeColor(score)}
          className="transition-all duration-100"
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={getTextColor(score)}
          className="rotate-90 origin-center"
          style={{ fontSize: size * 0.28, fontWeight: 700 }}
        >
          {Math.round(animatedScore)}
        </text>
      </svg>
      <span className="text-xs font-medium text-center leading-tight" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
    </div>
  );
}
