"use client";

import { useEffect, useRef, useMemo, useState } from "react";

/* ── Color Constants ─────────────────────────────────────────── */

const TEAL = { r: 75, g: 165, b: 195 };

const STATUS_COLORS = {
  active:      { r: 75,  g: 130, b: 180 },
  recommended: { r: 74,  g: 140, b: 106 },
  caution:     { r: 175, g: 148, b: 63  },
};

/* ── Particle Type ───────────────────────────────────────────── */

interface AppParticle {
  baseX: number;
  baseY: number;
  diameter: number;           // 4–6 px
  phase: number;
  orbitR: number;             // 2–3 px
  orbitSpeed: number;         // full orbit in 3–6 seconds
  color: { r: number; g: number; b: number };
  pulsePhase: number;
  pulsePeriod: number;        // 2–4 seconds
  /** offscreen canvas with pre-rendered glow + particle */
  glowCanvas: OffscreenCanvas | null;
  glowSize: number;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Desaturate an RGB colour — amount 0 = no change, 1 = full greyscale */
function desaturate(c: { r: number; g: number; b: number }, amount: number) {
  const lum = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
  return {
    r: Math.round(c.r + (lum - c.r) * amount),
    g: Math.round(c.g + (lum - c.g) * amount),
    b: Math.round(c.b + (lum - c.b) * amount),
  };
}

/** Pre-render a small caustic blob for the pool surface overlay */
function createPoolBlob(size: number, alpha: number): HTMLCanvasElement {
  const pad = 2;
  const dim = size + pad * 2;
  const c = document.createElement("canvas");
  c.width = dim;
  c.height = dim;
  const ctx = c.getContext("2d")!;
  const cx = dim / 2, cy = dim / 2, r = size / 2;
  const offsets = [
    { dx: 0, dy: 0, rScale: 1.0 },
    { dx: r * 0.15, dy: -r * 0.1, rScale: 0.75 },
  ];
  for (const off of offsets) {
    const grad = ctx.createRadialGradient(cx + off.dx, cy + off.dy, 0, cx + off.dx, cy + off.dy, r * off.rScale);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.35, `rgba(220,248,255,${alpha * 0.5})`);
    grad.addColorStop(1, "rgba(220,248,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, dim, dim);
  }
  return c;
}

/* ── Pre-render a single particle — submerged stone treatment ── */

function preRenderParticle(p: AppParticle, dpr: number) {
  const pad = p.diameter * 4;          // room for glow + shadow
  const total = Math.ceil((p.diameter + pad * 2) * dpr);
  const oc = new OffscreenCanvas(total, total);
  const ctx = oc.getContext("2d");
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  const center = (p.diameter + pad * 2) / 2;
  const r = p.diameter / 2;

  // 1. Muted glow halo (softer than before — submerged in water)
  const hg = ctx.createRadialGradient(center, center, r * 0.3, center, center, r * 3);
  hg.addColorStop(0, `rgba(${p.color.r},${p.color.g},${p.color.b},0.08)`);
  hg.addColorStop(1, "transparent");
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, total / dpr, total / dpr);

  // 2. Pool floor shadow — offset +2px right, +3px down
  const sg = ctx.createRadialGradient(center + 2, center + 3, 0, center + 2, center + 3, r * 1.4);
  sg.addColorStop(0, "rgba(0,0,0,0.12)");
  sg.addColorStop(0.5, "rgba(0,0,0,0.04)");
  sg.addColorStop(1, "transparent");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, total / dpr, total / dpr);

  // 3. Wet stone body — desaturated, slightly transparent
  ctx.beginPath();
  ctx.arc(center, center, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},0.80)`;
  ctx.fill();

  // 4. Dark wet-edge stroke
  ctx.beginPath();
  ctx.arc(center, center, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(20,55,80,0.15)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 5. Inner highlight (top-left crescent — refracted light)
  ctx.beginPath();
  ctx.arc(center - r * 0.2, center - r * 0.2, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();

  // 6. Water tint overlay — deeper teal to look submerged
  ctx.beginPath();
  ctx.arc(center, center, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},0.10)`;
  ctx.fill();

  p.glowCanvas = oc;
  p.glowSize = total / dpr;
}

/* ── Particle Creation (Fibonacci Spiral) ────────────────────── */

function createAppParticles(count: number, s: number, dpr: number): AppParticle[] {
  const cx = s / 2;
  const cy = s / 2;
  const particles: AppParticle[] = [];

  // Exact status distribution: 5 active, 3 recommended, 3 caution
  type Status = "active" | "recommended" | "caution";
  const statuses: Status[] = [];
  const activeCount = Math.round(count * 5 / 11);
  const recommendedCount = Math.round(count * 3 / 11);
  for (let i = 0; i < count; i++) {
    if (i < activeCount) statuses.push("active");
    else if (i < activeCount + recommendedCount) statuses.push("recommended");
    else statuses.push("caution");
  }

  // Fibonacci spiral layout
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const spreadFactor = count <= 5 ? 0.38 : count <= 15 ? 0.30 : 0.24;

  for (let i = 0; i < count; i++) {
    const angle = i * goldenAngle;
    const radius = Math.sqrt(i / count) * s * spreadFactor;

    const p: AppParticle = {
      baseX: cx + Math.cos(angle) * radius,
      baseY: cy + Math.sin(angle) * radius,
      diameter: rand(4, 6),                     // 4–6 px
      phase: Math.random() * Math.PI * 2,
      orbitR: rand(2, 3),                        // 2–3 px
      orbitSpeed: (Math.PI * 2) / rand(3, 6),   // full orbit in 3–6 seconds
      color: desaturate(STATUS_COLORS[statuses[i]], 0.25),
      pulsePhase: Math.random() * Math.PI * 2,
      pulsePeriod: rand(2, 4),                   // 2–4 seconds
      glowCanvas: null,
      glowSize: 0,
    };

    preRenderParticle(p, dpr);
    particles.push(p);
  }

  return particles;
}

/* ── Draw: Applications Icon (submerged pool + water surface) ── */

function drawApplicationsIcon(
  ctx: CanvasRenderingContext2D,
  s: number,
  particles: AppParticle[],
  time: number,
  poolBlobs: HTMLCanvasElement[],
) {
  ctx.clearRect(0, 0, s, s);

  // Subtle center glow (underwater depth)
  const cg = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.4);
  cg.addColorStop(0, `rgba(${TEAL.r},${TEAL.g},${TEAL.b},0.04)`);
  cg.addColorStop(1, "transparent");
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, s, s);

  // ─── Layer 1: Submerged particles ────────────────────────

  // Compute current positions for bonds + drawing
  const positions: { x: number; y: number; scale: number }[] = [];

  for (const p of particles) {
    const x = p.baseX + Math.cos(time * p.orbitSpeed + p.phase) * p.orbitR;
    const y = p.baseY + Math.sin(time * p.orbitSpeed * 0.85 + p.phase) * p.orbitR;
    const pulse = 0.9 + 0.2 * (0.5 + 0.5 * Math.sin((Math.PI * 2 / p.pulsePeriod) * time + p.pulsePhase));
    positions.push({ x, y, scale: pulse });
  }

  // Molecular bond lines (underwater — slightly muted)
  ctx.lineWidth = 1;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 18) {
        const alpha = 0.12 * (1 - dist / 18);
        ctx.beginPath();
        ctx.moveTo(positions[i].x, positions[i].y);
        ctx.lineTo(positions[j].x, positions[j].y);
        ctx.strokeStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${alpha})`;
        ctx.stroke();
      }
    }
  }

  // Draw pre-rendered particles + per-particle drifting caustic highlight
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const pos = positions[i];

    if (p.glowCanvas) {
      const drawSize = p.glowSize * pos.scale;
      const offset = drawSize / 2;
      ctx.drawImage(p.glowCanvas, pos.x - offset, pos.y - offset, drawSize, drawSize);
    }

    // Caustic highlight — tiny bright patch drifting on top-left of each particle
    const r = p.diameter / 2;
    const causticDrift = time * 0.4 + i * 1.7;
    const hlX = pos.x - r * 0.3 + Math.sin(causticDrift) * r * 0.25;
    const hlY = pos.y - r * 0.3 + Math.cos(causticDrift * 0.7) * r * 0.2;
    const hlR = r * 0.45;
    const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
    hlGrad.addColorStop(0, "rgba(200,235,250,0.25)");
    hlGrad.addColorStop(1, "transparent");
    ctx.fillStyle = hlGrad;
    ctx.fillRect(hlX - hlR, hlY - hlR, hlR * 2, hlR * 2);
  }

  // ─── Layer 2: Water surface effects ──────────────────────

  // 2a. Caustic blobs drifting across pool surface (1-2 blobs)
  const blobCount = Math.min(poolBlobs.length, 2);
  for (let i = 0; i < blobCount; i++) {
    const blob = poolBlobs[i];
    const bw = blob.width;
    const speed = 4 + i * 2; // slow drift px/s
    const phase = i * 3.14;
    const bx = ((time * speed + phase * 30) % (s + bw)) - bw / 2;
    const by = s * (0.3 + i * 0.35) + Math.sin(time * 0.5 + phase) * 3;
    ctx.globalAlpha = 0.12 + i * 0.02;
    ctx.drawImage(blob, bx - bw / 2, by - bw / 2, bw, bw);
    ctx.globalAlpha = 1;
  }

  // 2b. Hair-thin current line — sine wave
  ctx.beginPath();
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  const clY = s * 0.55;
  const clSpeed = 15;
  const clAmp = 1.2;
  const clPeriod = 20;
  for (let x = 0; x < s; x++) {
    const y = clY + Math.sin((x + time * clSpeed) / clPeriod * Math.PI * 2) * clAmp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 2c. Micro shimmer glints — 2-3 tiny dots fading in/out
  const glintCount = 3;
  for (let i = 0; i < glintCount; i++) {
    // Deterministic position from index
    const gx = s * (0.2 + (i * 0.618) % 0.7);
    const gy = s * (0.25 + ((i * 0.414 + 0.3) % 0.6));
    const period = 1.8 + i * 0.3;
    const phase = i * 2.1;
    const t = ((time + phase) % period) / period;           // 0→1
    const glintAlpha = t < 0.5 ? t * 2 * 0.2 : (1 - t) * 2 * 0.2;
    if (glintAlpha > 0.01) {
      ctx.beginPath();
      ctx.arc(gx, gy, 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${glintAlpha.toFixed(3)})`;
      ctx.fill();
    }
  }
}

/* ── Draw: RFP Icon ──────────────────────────────────────────── */

function drawRFPIcon(
  ctx: CanvasRenderingContext2D,
  s: number,
  count: number,
  time: number,
) {
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
  const cy = s / 2;

  const dimFactor = count === 0 ? 0.3 : 1;

  // Ambient glow
  const ag = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.4);
  ag.addColorStop(0, `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${0.06 * dimFactor})`);
  ag.addColorStop(1, "transparent");
  ctx.fillStyle = ag;
  ctx.fillRect(0, 0, s, s);

  // Breathing scale
  const breathe = count === 0 ? 1 : 1 + Math.sin(time * 0.8) * 0.06;

  // Outer hexagonal ring (dotted)
  const outerR = s * 0.3 * breathe;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * outerR;
    const y = cy + Math.sin(a) * outerR;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${0.35 * dimFactor})`;
  ctx.lineWidth = s * 0.015;
  ctx.stroke();

  // Outer ring glow
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${0.08 * dimFactor})`;
  ctx.lineWidth = s * 0.06;
  ctx.stroke();

  // Inner hexagon (slightly rotated, smaller)
  const innerR = s * 0.18 * breathe;
  const innerRot = count === 0 ? 0 : time * 0.15;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + innerRot;
    ctx.lineTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${0.2 * dimFactor})`;
  ctx.lineWidth = s * 0.01;
  ctx.stroke();

  // Fill inner hex (subtle)
  ctx.fillStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${0.04 * dimFactor})`;
  ctx.fill();

  // Center dot (bright, pulsing)
  const centerPulse = count === 0 ? 0.3 : 0.6 + Math.sin(time * 1.2) * 0.2;
  const centerR = s * 0.04 * breathe;

  // Center glow
  const cGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.12);
  cGlow.addColorStop(0, `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${centerPulse * 0.25})`);
  cGlow.addColorStop(1, "transparent");
  ctx.fillStyle = cGlow;
  ctx.fillRect(cx - s * 0.12, cy - s * 0.12, s * 0.24, s * 0.24);

  ctx.beginPath();
  ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${centerPulse})`;
  ctx.fill();

  // Vertex dots on outer hex
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const vx = cx + Math.cos(a) * outerR;
    const vy = cy + Math.sin(a) * outerR;
    const vPulse = count === 0 ? 0.3 : Math.sin(time * 1 + i * 1.2) * 0.5 + 0.5;

    ctx.beginPath();
    ctx.arc(vx, vy, s * 0.018, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${(0.3 + vPulse * 0.3) * dimFactor})`;
    ctx.fill();
  }

  // Orbiting particle (proposal coming in) — only when active
  if (count > 0) {
    const orbitR = s * 0.36;
    const orbitA = time * 0.5;
    const ox = cx + Math.cos(orbitA) * orbitR;
    const oy = cy + Math.sin(orbitA) * orbitR;

    // Orbit trail (fading dots)
    for (let t = 0; t < 8; t++) {
      const trailA = orbitA - t * 0.12;
      const tx = cx + Math.cos(trailA) * orbitR;
      const ty = cy + Math.sin(trailA) * orbitR;
      const trailAlpha = 0.2 * (1 - t / 8);
      const trailR = s * 0.012 * (1 - t / 12);
      ctx.beginPath();
      ctx.arc(tx, ty, trailR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${trailAlpha})`;
      ctx.fill();
    }

    // Orbiting particle (bright)
    ctx.beginPath();
    ctx.arc(ox, oy, s * 0.022, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},0.7)`;
    ctx.fill();

    // Particle glow
    const pg = ctx.createRadialGradient(ox, oy, 0, ox, oy, s * 0.06);
    pg.addColorStop(0, `rgba(${TEAL.r},${TEAL.g},${TEAL.b},0.15)`);
    pg.addColorStop(1, "transparent");
    ctx.fillStyle = pg;
    ctx.fillRect(ox - s * 0.06, oy - s * 0.06, s * 0.12, s * 0.12);
  }
}

/* ── Component ───────────────────────────────────────────────── */

interface LivingIconProps {
  type: "applications" | "rfp";
  count: number;
  size?: number;
}

export function LivingIcon({ type, count, size = 48 }: LivingIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const particlesRef = useRef<AppParticle[]>([]);
  const poolBlobsRef = useRef<HTMLCanvasElement[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastFrameRef = useRef(0);
  const [ready, setReady] = useState(false);

  // Create particles (memoized on count + size changes)
  const particles = useMemo(() => {
    if (type === "applications" && count > 0) {
      const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 2;
      return createAppParticles(count, size, dpr);
    }
    return [];
  }, [type, count, size]);

  // Create pool blob canvases for water surface overlay
  const poolBlobs = useMemo(() => {
    if (type === "applications" && count > 0 && typeof document !== "undefined") {
      return [
        createPoolBlob(10, 0.12),
        createPoolBlob(8, 0.14),
      ];
    }
    return [];
  }, [type, count]);

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  useEffect(() => {
    poolBlobsRef.current = poolBlobs;
  }, [poolBlobs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    function animate(now: number) {
      if (cancelled) return;

      // Delta time for smooth animation
      const dt = lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : 0.016;
      lastFrameRef.current = now;
      timeRef.current += dt;

      const dpr = window.devicePixelRatio || 1;
      canvas!.width = size * dpr;
      canvas!.height = size * dpr;
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      if (type === "applications") {
        if (count === 0) {
          // Empty state: faint center dot
          ctx.clearRect(0, 0, size, size);
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size * 0.03, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},0.15)`;
          ctx.fill();
        } else {
          drawApplicationsIcon(ctx, size, particlesRef.current, timeRef.current, poolBlobsRef.current);
        }
      } else {
        drawRFPIcon(ctx, size, count, timeRef.current);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    /* Defer canvas init 2 frames so it doesn't block first paint */
    const startId = requestAnimationFrame(() => {
      requestAnimationFrame((now) => {
        if (!cancelled) {
          lastFrameRef.current = now;
          animate(now);
          setReady(true);
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(startId);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [type, count, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        opacity: ready ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    />
  );
}
