"use client";

import { useRef, useCallback } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  intensity?: number; // 1 = subtle, 2 = normal, 3 = strong
  inset?: boolean; // true = non-clickable inset card
}

export default function DynamicShadowCard({
  children,
  className = "",
  style,
  onClick,
  intensity = 2,
  inset = false,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      // Get cursor position relative to card center, normalized to -1 to 1
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      // Shadow falls OPPOSITE to where the light (cursor) is
      const shadowX = -x * 10 * intensity;
      const shadowY = -y * 10 * intensity;

      // Light highlight goes TOWARD the cursor
      const highlightX = x * 7 * intensity;
      const highlightY = y * 7 * intensity;

      // Slight tilt toward cursor
      const tiltX = y * 1.5;
      const tiltY = -x * 1.5;

      if (inset) {
        card.style.boxShadow = [
          `inset ${shadowX}px ${shadowY}px ${18 * intensity}px rgba(148,155,178,0.45)`,
          `inset ${highlightX}px ${highlightY}px ${18 * intensity}px rgba(255,255,255,0.75)`,
        ].join(", ");
        card.style.transform = "none";
      } else {
        card.style.boxShadow = [
          `${shadowX}px ${shadowY}px ${22 * intensity}px rgba(140,148,170,0.5)`,
          `${highlightX}px ${highlightY}px ${22 * intensity}px rgba(255,255,255,0.9)`,
          `0 ${3 * intensity}px ${10 * intensity}px rgba(0,0,0,0.04)`,
        ].join(", ");
        card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-${intensity}px)`;
      }
    },
    [intensity, inset]
  );

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    if (inset) {
      card.style.boxShadow = [
        `inset 10px 10px ${18 * intensity}px rgba(148,155,178,0.45)`,
        `inset -10px -10px ${18 * intensity}px rgba(255,255,255,0.75)`,
      ].join(", ");
    } else {
      card.style.boxShadow = [
        `14px 14px ${22 * intensity}px rgba(140,148,170,0.5)`,
        `-14px -14px ${22 * intensity}px rgba(255,255,255,0.9)`,
      ].join(", ");
    }
    card.style.transform = "none";
  }, [intensity, inset]);

  return (
    <div
      ref={cardRef}
      className={`dynamic-shadow-card ${inset ? "ds-inset" : "ds-raised"} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", ...style }}
    >
      {children}
    </div>
  );
}
