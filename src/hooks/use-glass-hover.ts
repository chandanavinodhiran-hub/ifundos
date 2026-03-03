"use client";

import { useRef, useState, useCallback, type MouseEvent } from "react";

/**
 * useGlassHover — cursor-tracking radial glow overlay for neumorphic cards.
 *
 * Variants:
 *  - "purple"  → rgba(92,111,181,0.08) — for action cards, pipeline cards
 *  - "accent"  → rgba(92,111,181,0.06) — for Navigator FAB
 *
 * Returns a ref to attach to the container, event handlers, and a style object
 * for the glow overlay div (absolute positioned, pointer-events-none).
 */

type GlowVariant = "purple" | "accent" | "teal" | "gold";

const GLOW_COLORS: Record<GlowVariant, string> = {
  purple: "rgba(92, 111, 181, 0.08)",
  accent: "rgba(92, 111, 181, 0.06)",
  /* Legacy aliases — map to accent blue */
  teal: "rgba(92, 111, 181, 0.08)",
  gold: "rgba(92, 111, 181, 0.06)",
};

export function useGlassHover(variant: GlowVariant = "purple") {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  const glowStyle: React.CSSProperties = isHovered
    ? {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        background: `radial-gradient(circle 200px at ${position.x}px ${position.y}px, ${GLOW_COLORS[variant]}, transparent 80%)`,
        opacity: 1,
        transition: "opacity 300ms ease",
        zIndex: 1,
      }
    : {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        opacity: 0,
        transition: "opacity 300ms ease",
        zIndex: 1,
      };

  return {
    ref,
    handlers: { onMouseMove, onMouseEnter, onMouseLeave },
    isHovered,
    glowStyle,
  };
}
