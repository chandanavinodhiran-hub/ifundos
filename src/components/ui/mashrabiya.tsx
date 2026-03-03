"use client";

/* ================================================================
   Mashrabiya Pattern Components — Image-based authentic lattice
   Uses /patterns/mashrabiya.svg with CSS filter colorization
   and radial gradient masks for corner seals
   ================================================================ */

/** CSS filter presets for colorizing the black mashrabiya SVG */
const FILTERS = {
  teal: "brightness(0) saturate(100%) invert(59%) sepia(52%) saturate(467%) hue-rotate(131deg) brightness(95%) contrast(86%)",
  gold: "brightness(0) saturate(100%) invert(72%) sepia(28%) saturate(776%) hue-rotate(2deg) brightness(89%) contrast(86%)",
  white: "brightness(0) invert(1)",
} as const;

type ColorVariant = keyof typeof FILTERS;

/**
 * MashrabiyaCornerSeal — Image-based corner ornament
 * Places the authentic mashrabiya lattice with radial gradient mask
 * in the top-right corner of focus/priority cards
 */
export function MashrabiyaCornerSeal({
  size = 180,
  variant = "teal",
  opacity = 0.12,
  className = "",
}: {
  size?: number;
  variant?: ColorVariant;
  opacity?: number;
  className?: string;
}) {
  return (
    <div
      className={`absolute top-[-20px] right-[-20px] pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        opacity,
        backgroundImage: "url('/patterns/mashrabiya.svg')",
        backgroundSize: "100px 100px",
        backgroundRepeat: "repeat",
        filter: FILTERS[variant],
        maskImage: "radial-gradient(circle at center, black 30%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 70%)",
      }}
      aria-hidden="true"
    />
  );
}

/**
 * MashrabiyaOverlay — Full-area pattern overlay for cards/sections
 * Uses image-based approach with CSS filter colorization
 */
export function MashrabiyaOverlay({
  variant = "gold",
  opacity = 0.04,
  tileSize = 280,
  className = "",
}: {
  variant?: ColorVariant;
  opacity?: number;
  tileSize?: number;
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity,
        backgroundImage: "url('/patterns/mashrabiya.svg')",
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: "repeat",
        filter: FILTERS[variant],
        borderRadius: "inherit",
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Vision2030Spiral — Official dot-spiral watermark
 * Central dot + 7-dot ring + 9-dot outer ring with petal guide curves
 * For header area and hero stat cards
 */
export function Vision2030Spiral({
  size = 60,
  opacity = 0.18,
  color = "#94A1A8",
  className = "",
}: {
  size?: number;
  opacity?: number;
  color?: string;
  className?: string;
}) {
  const innerDots = Array.from({ length: 7 }, (_, i) => {
    const angle = (i * (360 / 7) * Math.PI) / 180 - Math.PI / 2;
    return { cx: 30 + 10 * Math.cos(angle), cy: 30 + 10 * Math.sin(angle) };
  });

  const outerDots = Array.from({ length: 9 }, (_, i) => {
    const angle = (i * (360 / 9) * Math.PI) / 180 - Math.PI / 2;
    return { cx: 30 + 20 * Math.cos(angle), cy: 30 + 20 * Math.sin(angle) };
  });

  const petals = innerDots.map((dot, i) => {
    const next = innerDots[(i + 1) % 7];
    const midAngle =
      ((i * (360 / 7) + (360 / 14)) * Math.PI) / 180 - Math.PI / 2;
    const cpx = 30 + 15 * Math.cos(midAngle);
    const cpy = 30 + 15 * Math.sin(midAngle);
    return `M ${dot.cx} ${dot.cy} Q ${cpx} ${cpy} ${next.cx} ${next.cy}`;
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {petals.map((d, i) => (
        <path
          key={`petal-${i}`}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
        />
      ))}
      <circle cx="30" cy="30" r="3" fill={color} />
      {innerDots.map((d, i) => (
        <circle key={`inner-${i}`} cx={d.cx} cy={d.cy} r="2" fill={color} />
      ))}
      {outerDots.map((d, i) => (
        <circle key={`outer-${i}`} cx={d.cx} cy={d.cy} r="1.5" fill={color} />
      ))}
    </svg>
  );
}

/**
 * MashrabiyaScoreRing — Watch-dial geometric ring for score circles
 * Thin geometric marks at regular intervals like a precision instrument
 */
export function MashrabiyaScoreRing({
  size = 72,
  color = "#b8943f",
  opacity = 0.2,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const innerR = outerR - 4;

  const ticks = Array.from({ length: 32 }, (_, i) => {
    const angle = (i * (360 / 32) * Math.PI) / 180;
    const isMajor = i % 4 === 0;
    const r1 = isMajor ? innerR - 2 : innerR;
    return {
      x1: cx + r1 * Math.cos(angle),
      y1: cy + r1 * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
      width: isMajor ? 1 : 0.5,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
      />
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={color}
          strokeWidth={t.width}
        />
      ))}
    </svg>
  );
}
