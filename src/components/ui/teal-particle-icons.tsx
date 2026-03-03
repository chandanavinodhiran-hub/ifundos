"use client";

import { useEffect, useRef } from "react";

/* ── Shared helpers ─────────────────────────────────────────────── */

const TEAL = [80, 170, 200]; // rgba base

function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number,
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${TEAL[0]}, ${TEAL[1]}, ${TEAL[2]}, ${Math.min(alpha, 1)})`;
  ctx.fill();
}

function dottedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  alpha: number,
  dotRadius: number,
  spacing: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.floor(len / spacing));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    dot(ctx, x1 + dx * t, y1 + dy * t, dotRadius, alpha);
  }
}

function dottedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
  dotRadius: number,
  spacing: number,
) {
  dottedLine(ctx, x, y, x + w, y, alpha, dotRadius, spacing);         // top
  dottedLine(ctx, x + w, y, x + w, y + h, alpha, dotRadius, spacing); // right
  dottedLine(ctx, x + w, y + h, x, y + h, alpha, dotRadius, spacing); // bottom
  dottedLine(ctx, x, y + h, x, y, alpha, dotRadius, spacing);         // left
}

/** Bright hero dot with visible glow halo */
function heroDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  // Outer glow halo
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${TEAL[0]}, ${TEAL[1]}, ${TEAL[2]}, 0.18)`;
  ctx.fill();
  // Mid glow
  ctx.beginPath();
  ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${TEAL[0]}, ${TEAL[1]}, ${TEAL[2]}, 0.3)`;
  ctx.fill();
  // Bright core
  dot(ctx, cx, cy, 1.5, 1.0);
}

/* ── ApplicationsIcon — stack of overlapping dotted documents ──── */

export function ApplicationsParticleIcon({ size = 24 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const sp = 1.8;   // dot spacing
    const dr = 0.78;   // dot radius (was 0.6, ×1.3)

    // Back document — offset right+up, faint
    dottedRect(ctx, 7, 2, 14, 17, 0.24, dr, sp);

    // Middle document — slight offset
    dottedRect(ctx, 5, 4, 14, 17, 0.42, dr, sp);

    // Front document — normal position, full
    dottedRect(ctx, 3, 6, 14, 17, 0.78, dr, sp);

    // Text lines inside front doc
    dottedLine(ctx, 6, 11, 14, 11, 0.6, dr, sp);
    dottedLine(ctx, 6, 14, 12, 14, 0.48, dr, sp);
    dottedLine(ctx, 6, 17, 10, 17, 0.36, dr, sp);

    // Status indicator — hero dot top-left of front doc
    heroDot(ctx, 5, 8);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}

/* ── RFPParticleIcon — formal document with fold + seal ────────── */

export function RFPParticleIcon({ size = 24 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const sp = 1.8;
    const dr = 0.78;   // dot radius (was 0.6, ×1.3)

    // Document outline (with top-right corner cut for fold)
    const x = 4, y = 2, w = 16, h = 20;
    const fold = 5;

    // Left edge
    dottedLine(ctx, x, y, x, y + h, 0.72, dr, sp);
    // Bottom edge
    dottedLine(ctx, x, y + h, x + w, y + h, 0.72, dr, sp);
    // Right edge
    dottedLine(ctx, x + w, y + fold, x + w, y + h, 0.72, dr, sp);
    // Top edge (stopping before fold)
    dottedLine(ctx, x, y, x + w - fold, y, 0.72, dr, sp);
    // Diagonal fold
    dottedLine(ctx, x + w - fold, y, x + w, y + fold, 0.6, dr, sp);
    // Fold inner line (horizontal)
    dottedLine(ctx, x + w - fold, y, x + w - fold, y + fold, 0.3, dr, sp);
    // Fold inner line (vertical)
    dottedLine(ctx, x + w - fold, y + fold, x + w, y + fold, 0.3, dr, sp);

    // Text lines
    dottedLine(ctx, 7, 9, 15, 9, 0.54, dr, sp);
    dottedLine(ctx, 7, 12, 17, 12, 0.48, dr, sp);
    dottedLine(ctx, 7, 15, 13, 15, 0.36, dr, sp);

    // Seal circle — dotted outline bottom-right
    const sealCx = 16, sealCy = 19, sealR = 3;
    const sealDots = 14;
    for (let i = 0; i < sealDots; i++) {
      const angle = (i / sealDots) * Math.PI * 2;
      dot(ctx, sealCx + Math.cos(angle) * sealR, sealCy + Math.sin(angle) * sealR, dr, 0.48);
    }

    // Seal center — hero dot with glow
    heroDot(ctx, sealCx, sealCy);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
