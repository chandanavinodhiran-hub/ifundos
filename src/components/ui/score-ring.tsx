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

  const color =
    score === 0
      ? "text-gray-400 stroke-gray-400"
      : score >= 75
        ? "text-sovereign-gold stroke-sovereign-gold"
        : score >= 50
          ? "text-leaf-500 stroke-leaf-500"
          : "text-red-500 stroke-red-500";

  const bgColor =
    score === 0
      ? "stroke-gray-200"
      : score >= 75
        ? "stroke-sovereign-goldLight/40"
        : score >= 50
          ? "stroke-leaf-100"
          : "stroke-red-100";

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
          className={bgColor}
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
          className={`${color} transition-all duration-100`}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className={`${color} fill-current rotate-90 origin-center`}
          style={{ fontSize: size * 0.28, fontWeight: 700 }}
        >
          {Math.round(animatedScore)}
        </text>
      </svg>
      <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
