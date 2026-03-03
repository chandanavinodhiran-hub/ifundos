"use client";

import { useRef, useEffect, useCallback } from "react";

/* ================================================================== */
/* CONSTANTS                                                           */
/* ================================================================== */

const GREENS = [
  { h: 128, s: 55, l: 25 }, { h: 136, s: 50, l: 30 }, { h: 120, s: 42, l: 20 },
  { h: 142, s: 52, l: 34 }, { h: 116, s: 38, l: 18 }, { h: 146, s: 56, l: 36 },
  { h: 132, s: 60, l: 28 }, { h: 124, s: 44, l: 22 }, { h: 150, s: 48, l: 38 },
  { h: 112, s: 35, l: 16 }, { h: 138, s: 58, l: 32 }, { h: 126, s: 50, l: 26 },
];

/* FIX 2: Reduce leaf count on mobile */
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
const LAYER_COUNTS = isMobile
  ? [8, 7, 6, 5, 4]   // 30 leaves on mobile
  : [15, 14, 12, 10, 7]; // 58 leaves on desktop

const SIZE_RANGES: [number, number][] = [
  [100, 180], [130, 230], [160, 280], [200, 340], [250, 400],
];
const LAYER_ALPHA = [0.45, 0.55, 0.7, 0.82, 0.88];
const DEPTHS = [0.4, 0.55, 0.75, 1.0, 1.3];

/* ================================================================== */
/* LEAF DRAWING (canvas 2D)                                            */
/* ================================================================== */

interface LeafColor { h: number; s: number; l: number }

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: LeafColor,
  variant: number,
) {
  const w = size * (variant === 0 ? 0.38 : variant === 1 ? 0.5 : 0.42);
  const h = size;

  /* ── Leaf shape ───────────────────────────────────────────────── */
  ctx.beginPath();
  if (variant === 0) {
    // Elongated tropical
    ctx.moveTo(0, -h * 0.5);
    ctx.bezierCurveTo(w * 0.3, -h * 0.42, w * 0.85, -h * 0.2, w * 0.9, 0);
    ctx.bezierCurveTo(w * 0.92, h * 0.15, w * 0.7, h * 0.35, w * 0.3, h * 0.45);
    ctx.bezierCurveTo(w * 0.1, h * 0.49, 0, h * 0.5, 0, h * 0.5);
    ctx.bezierCurveTo(0, h * 0.5, -w * 0.1, h * 0.49, -w * 0.3, h * 0.44);
    ctx.bezierCurveTo(-w * 0.65, h * 0.33, -w * 0.88, h * 0.12, -w * 0.85, -h * 0.05);
    ctx.bezierCurveTo(-w * 0.8, -h * 0.22, -w * 0.25, -h * 0.43, 0, -h * 0.5);
  } else if (variant === 1) {
    // Broad tropical
    ctx.moveTo(0, -h * 0.48);
    ctx.bezierCurveTo(w * 0.5, -h * 0.4, w * 1.05, -h * 0.1, w * 1.0, h * 0.08);
    ctx.bezierCurveTo(w * 0.95, h * 0.25, w * 0.6, h * 0.42, w * 0.15, h * 0.48);
    ctx.lineTo(0, h * 0.5);
    ctx.lineTo(-w * 0.15, h * 0.48);
    ctx.bezierCurveTo(-w * 0.6, h * 0.42, -w * 0.95, h * 0.22, -w * 0.98, h * 0.05);
    ctx.bezierCurveTo(-w * 1.0, -h * 0.12, -w * 0.45, -h * 0.42, 0, -h * 0.48);
  } else {
    // Heart-shaped / ovate
    ctx.moveTo(0, -h * 0.5);
    ctx.bezierCurveTo(w * 0.6, -h * 0.35, w * 0.95, -h * 0.05, w * 0.85, h * 0.15);
    ctx.bezierCurveTo(w * 0.75, h * 0.32, w * 0.4, h * 0.46, 0, h * 0.5);
    ctx.bezierCurveTo(-w * 0.4, h * 0.46, -w * 0.75, h * 0.32, -w * 0.85, h * 0.15);
    ctx.bezierCurveTo(-w * 0.95, -h * 0.05, -w * 0.6, -h * 0.35, 0, -h * 0.5);
  }
  ctx.closePath();

  /* ── Gradient fill ───────────────────────────────────────────── */
  const grad = ctx.createLinearGradient(-w * 0.5, -h * 0.3, w * 0.5, h * 0.3);
  grad.addColorStop(0, `hsl(${color.h + 3},${color.s + 3}%,${color.l + 12}%)`);
  grad.addColorStop(0.25, `hsl(${color.h + 1},${color.s + 1}%,${color.l + 5}%)`);
  grad.addColorStop(0.55, `hsl(${color.h},${color.s}%,${color.l}%)`);
  grad.addColorStop(0.8, `hsl(${color.h - 2},${color.s - 3}%,${color.l - 5}%)`);
  grad.addColorStop(1, `hsl(${color.h - 4},${color.s - 6}%,${color.l - 10}%)`);
  ctx.fillStyle = grad;
  ctx.fill();

  /* ── Edge stroke ─────────────────────────────────────────────── */
  ctx.strokeStyle = `hsla(${color.h - 5},${color.s - 10}%,${color.l - 12}%,0.35)`;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  /* ── Central midrib ──────────────────────────────────────────── */
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.47);
  ctx.bezierCurveTo(1, -h * 0.15, -1, h * 0.15, 0, h * 0.47);
  ctx.strokeStyle = `hsla(${color.h},${color.s - 12}%,${color.l - 4}%,0.45)`;
  ctx.lineWidth = size * 0.008;
  ctx.stroke();
  // Highlight
  ctx.beginPath();
  ctx.moveTo(0.5, -h * 0.46);
  ctx.bezierCurveTo(1.5, -h * 0.15, -0.5, h * 0.15, 0.5, h * 0.46);
  ctx.strokeStyle = `hsla(${color.h + 5},${color.s}%,${color.l + 15}%,0.1)`;
  ctx.lineWidth = size * 0.004;
  ctx.stroke();

  /* ── Secondary veins ─────────────────────────────────────────── */
  const vc = variant === 1 ? 10 : 8;
  for (let v = 0; v < vc; v++) {
    const vt = (v + 1) / (vc + 1);
    const vy = -h * 0.44 + vt * h * 0.88;
    const leafW = w * Math.sin(vt * Math.PI) * 0.9;

    // Right vein
    ctx.beginPath();
    ctx.moveTo(0, vy);
    ctx.bezierCurveTo(leafW * 0.3, vy - h * 0.01, leafW * 0.6, vy + h * 0.005, leafW * 0.8, vy + h * 0.02);
    ctx.strokeStyle = `hsla(${color.h},${color.s - 10}%,${color.l - 2}%,0.16)`;
    ctx.lineWidth = size * 0.003;
    ctx.stroke();

    // Left vein
    ctx.beginPath();
    ctx.moveTo(0, vy);
    ctx.bezierCurveTo(-leafW * 0.3, vy - h * 0.01, -leafW * 0.6, vy + h * 0.005, -leafW * 0.8, vy + h * 0.02);
    ctx.stroke();

    // Tertiary veins on larger leaves
    if (size > 120) {
      for (let tv = 1; tv <= 2; tv++) {
        const tvt = tv / 3;
        const tvx = leafW * 0.8 * tvt;
        const tvy = vy + h * 0.02 * tvt;
        ctx.beginPath();
        ctx.moveTo(tvx, tvy);
        ctx.lineTo(tvx + leafW * 0.12, tvy + h * 0.015);
        ctx.strokeStyle = `hsla(${color.h},${color.s - 10}%,${color.l - 1}%,0.07)`;
        ctx.lineWidth = size * 0.002;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-tvx, tvy);
        ctx.lineTo(-tvx - leafW * 0.12, tvy + h * 0.015);
        ctx.stroke();
      }
    }
  }

  /* ── Specular highlights ─────────────────────────────────────── */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(-w * 0.12, -h * 0.18, w * 0.35, h * 0.15, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-w * 0.08, -h * 0.22, w * 0.12, h * 0.05, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.restore();

  /* ── Edge rim light ──────────────────────────────────────────── */
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  if (variant === 0) {
    ctx.moveTo(w * 0.85, -h * 0.15);
    ctx.bezierCurveTo(w * 0.9, 0, w * 0.85, h * 0.15, w * 0.65, h * 0.3);
  } else {
    ctx.moveTo(w * 0.95, -h * 0.05);
    ctx.bezierCurveTo(w * 0.9, h * 0.15, w * 0.7, h * 0.3, w * 0.4, h * 0.4);
  }
  ctx.strokeStyle = `hsla(${color.h + 8},${color.s}%,${color.l + 20}%,0.12)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/* ================================================================== */
/* FIX 1: Pre-render leaf + shadow to offscreen canvas                 */
/* ================================================================== */

interface CachedLeaf {
  canvas: HTMLCanvasElement;
  cacheSize: number;
}

function preRenderLeaf(
  size: number,
  color: LeafColor,
  variant: number,
  layer: number,
  depth: number,
): CachedLeaf {
  const padding = 20;
  const shadowOffX = layer >= 2 ? 3 * depth : 0;
  const shadowOffY = layer >= 2 ? 5 * depth : 0;
  const totalSize = size + padding * 2 + Math.max(shadowOffX, shadowOffY) * 2;

  const canvas = document.createElement("canvas");
  canvas.width = totalSize * 2;  // 2x for quality
  canvas.height = totalSize * 2;

  const cctx = canvas.getContext("2d");
  if (!cctx) return { canvas, cacheSize: totalSize };

  cctx.scale(2, 2);
  cctx.translate(totalSize / 2, totalSize / 2);

  // Draw drop shadow first (layers 2+)
  if (layer >= 2) {
    cctx.save();
    cctx.translate(shadowOffX, shadowOffY);
    cctx.globalAlpha = 0.08;
    drawLeaf(cctx, size, { h: 0, s: 0, l: 3 }, variant);
    cctx.restore();
  }

  // Draw the actual leaf at full quality
  drawLeaf(cctx, size, color, variant);

  return { canvas, cacheSize: totalSize };
}

/* ================================================================== */
/* LEAF INSTANCE                                                       */
/* ================================================================== */

interface CLeaf {
  layer: number;
  depth: number;
  size: number;
  x: number;
  y: number;
  bx: number;
  by: number;
  rot: number;
  brot: number;
  color: LeafColor;
  alpha: number;
  variant: number;
  cached: CachedLeaf;
}

/** Config for staggered creation (FIX 5) */
interface LeafConfig {
  layer: number;
  W: number;
  H: number;
}

function createLeaf(layer: number, W: number, H: number): CLeaf {
  const depth = DEPTHS[layer] + (Math.random() - 0.5) * 0.1;
  const sr = SIZE_RANGES[layer];
  const size = sr[0] + Math.random() * (sr[1] - sr[0]);
  const x = Math.random() * (W + size) - size * 0.5;
  const y = Math.random() * (H + size) - size * 0.5;
  let color = { ...GREENS[Math.floor(Math.random() * GREENS.length)] };
  if (layer <= 1) { color = { ...color, l: color.l - 5, s: color.s - 6 }; }
  if (layer >= 3) { color = { ...color, l: color.l + 5, s: color.s + 3 }; }
  const variant = Math.floor(Math.random() * 3);

  // FIX 1: Pre-render leaf + shadow onto offscreen canvas
  const cached = preRenderLeaf(size, color, variant, layer, depth);

  return {
    layer,
    depth,
    size,
    x, y,
    bx: x, by: y,
    rot: Math.random() * Math.PI * 2,
    brot: Math.random() * Math.PI * 2,
    color,
    alpha: LAYER_ALPHA[layer],
    variant,
    cached,
  };
}

/* ================================================================== */
/* WIND PARTICLE                                                       */
/* ================================================================== */

interface WindParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; max: number; sz: number;
}

/* ================================================================== */
/* COMPONENT                                                           */
/* ================================================================== */

export default function ForestCanopy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    mx: -300, my: -300,
    pmx: -300, pmy: -300,
    mvx: 0, mvy: 0,
    t: 0,
    leaves: [] as CLeaf[],
    windParticles: [] as WindParticle[],
    leafConfigs: [] as LeafConfig[],
    leafIndex: 0,
    inited: false,
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const s = stateRef.current;
    s.mx = e.clientX;
    s.my = e.clientY;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    document.addEventListener("mousemove", handleMouseMove);

    let animId: number;

    const frame = () => {
      s.t += 0.016;
      s.mvx = s.mx - s.pmx;
      s.mvy = s.my - s.pmy;
      s.pmx = s.mx;
      s.pmy = s.my;

      /* FIX 3: Cap pixel ratio at 2x */
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      /* ── Init leaf configs on first frame (FIX 5) ──────────────── */
      if (!s.inited) {
        s.leafConfigs = [];
        LAYER_COUNTS.forEach((count, layer) => {
          for (let i = 0; i < count; i++) {
            s.leafConfigs.push({ layer, W, H });
          }
        });
        s.leafIndex = 0;
        s.leaves = [];
        s.inited = true;
      }

      /* ── FIX 5: Stagger leaf creation — 3 per frame ────────────── */
      if (s.leafIndex < s.leafConfigs.length) {
        const batchSize = 3;
        for (let i = 0; i < batchSize && s.leafIndex < s.leafConfigs.length; i++) {
          const cfg = s.leafConfigs[s.leafIndex];
          s.leaves.push(createLeaf(cfg.layer, cfg.W, cfg.H));
          s.leafIndex++;
        }
        s.leaves.sort((a, b) => a.depth - b.depth);
      }

      /* ── Background ───────────────────────────────────────────── */
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      bg.addColorStop(0, "#111f14");
      bg.addColorStop(0.25, "#0d1a10");
      bg.addColorStop(0.6, "#09130b");
      bg.addColorStop(1, "#050c06");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      /* ── Dappled sunlight ─────────────────────────────────────── */
      for (let i = 0; i < 8; i++) {
        const lx = W * (0.1 + (i % 4) * 0.27) + Math.sin(s.t * 0.12 + i * 1.8) * 60;
        const ly = H * (0.15 + Math.floor(i / 4) * 0.5) + Math.cos(s.t * 0.09 + i * 2.3) * 40;
        const lr = 120 + Math.sin(s.t * 0.2 + i) * 40;
        const la = 0.018 + Math.sin(s.t * 0.18 + i * 1.4) * 0.008;
        const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        lg.addColorStop(0, `rgba(110,170,90,${la})`);
        lg.addColorStop(0.6, `rgba(90,150,80,${la * 0.3})`);
        lg.addColorStop(1, "transparent");
        ctx.fillStyle = lg;
        ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
      }

      /* ── Update & draw leaves (FIX 1: cached drawImage) ────────── */
      s.leaves.forEach((leaf) => {
        // Wind field
        const wx = leaf.x * 0.002 + s.t * 0.15;
        const wy = leaf.y * 0.002 + s.t * 0.08;
        const flowX =
          Math.sin(wx * 0.5 + s.t * 0.06) * 1.2 +
          Math.sin(wx * 1.3 + s.t * 0.12) * 0.5 +
          Math.sin(wx * 3.1 + s.t * 0.25) * 0.15;
        const flowY =
          Math.cos(wy * 0.4 + s.t * 0.05) * 0.6 +
          Math.cos(wy * 1.7 + s.t * 0.1) * 0.3 +
          Math.sin(wy * 2.9 + s.t * 0.2) * 0.1;
        const flowRot =
          Math.sin(wx * 0.8 + wy * 0.6 + s.t * 0.08) * 0.015 +
          Math.sin(wx * 2.0 + s.t * 0.18) * 0.006;

        const windStr = leaf.depth * 1.8;
        leaf.x += flowX * windStr * 0.3;
        leaf.y += flowY * windStr * 0.2;
        leaf.rot += flowRot * windStr;

        // Very gentle drift back
        leaf.x += (leaf.bx - leaf.x) * 0.003;
        leaf.y += (leaf.by - leaf.y) * 0.003;
        leaf.rot += (leaf.brot - leaf.rot) * 0.002;

        // Cursor wind
        const dx = leaf.x - s.mx;
        const dy = leaf.y - s.my;
        const d = Math.sqrt(dx * dx + dy * dy);
        const wr = 280 * leaf.depth;
        if (d < wr && d > 0) {
          const f = Math.pow(1 - d / wr, 1.5) * 25 * leaf.depth;
          const spd = Math.sqrt(s.mvx * s.mvx + s.mvy * s.mvy);
          const spdMult = Math.min(spd * 0.12, 2.5);
          leaf.x += ((dx / d) * f * 0.3 + s.mvx * f * 0.06) * spdMult * 0.06;
          leaf.y += ((dy / d) * f * 0.3 + s.mvy * f * 0.06) * spdMult * 0.06;
          leaf.rot += (dx > 0 ? 1 : -1) * f * 0.0004 * spdMult;
        }

        // FIX 1: Stamp pre-rendered cached bitmap instead of redrawing
        ctx.save();
        ctx.globalAlpha = leaf.alpha;
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rot);
        const cs = leaf.cached.cacheSize;
        ctx.drawImage(
          leaf.cached.canvas,
          -cs / 2, -cs / 2,
          cs, cs,
        );
        ctx.restore();
      });

      /* ── Cursor wind particles (FIX 6: reduced count) ──────────── */
      const spd = Math.sqrt(s.mvx * s.mvx + s.mvy * s.mvy);
      if (spd > 3) {
        for (let i = 0; i < 2; i++) {
          s.windParticles.push({
            x: s.mx + (Math.random() - 0.5) * 50,
            y: s.my + (Math.random() - 0.5) * 50,
            vx: s.mvx * 0.25 + (Math.random() - 0.5) * 3,
            vy: s.mvy * 0.25 + (Math.random() - 0.5) * 3,
            life: 0,
            max: 0.5 + Math.random() * 0.6,
            sz: 1.5 + Math.random() * 3,
          });
        }
      }
      s.windParticles.forEach((p) => {
        p.life += 0.016;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        const a = 1 - p.life / p.max;
        if (a > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.sz * a, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(170,210,170,${a * 0.2})`;
          ctx.fill();
        }
      });
      s.windParticles = s.windParticles.filter((p) => p.life < p.max);

      /* ── Post-processing ──────────────────────────────────────── */
      // Atmospheric haze
      ctx.fillStyle = "rgba(10,20,12,0.04)";
      ctx.fillRect(0, 0, W, H);

      // Vignette
      const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.12, W / 2, H / 2, W * 0.8);
      v.addColorStop(0, "transparent");
      v.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);

      // Green color grade
      ctx.fillStyle = "rgba(20,40,25,0.06)";
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(frame);
    };

    frame();
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
    />
  );
}
