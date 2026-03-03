"use client";

import { useEffect, useRef } from "react";

/* ────────────────────────────────────────────────────────────────────
   AmbientCaustics — Full-screen canvas behind dashboard content
   Renders 8-10 large, very faint caustic blobs that drift slowly.
   Blob shapes are pre-rendered to offscreen canvases at init for perf.
   ──────────────────────────────────────────────────────────────────── */

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  offscreen: HTMLCanvasElement;
}

/** Pre-render a single organic caustic blob to an offscreen canvas */
function createBlobCanvas(size: number, alpha: number): HTMLCanvasElement {
  const pad = 4; // padding to avoid edge clipping
  const dim = size + pad * 2;
  const c = document.createElement("canvas");
  c.width = dim;
  c.height = dim;
  const ctx = c.getContext("2d")!;

  // Draw 3-4 overlapping radial gradients offset slightly for organic shape
  const cx = dim / 2;
  const cy = dim / 2;
  const r = size / 2;

  const offsets = [
    { dx: 0, dy: 0, rScale: 1.0 },
    { dx: r * 0.15, dy: -r * 0.1, rScale: 0.85 },
    { dx: -r * 0.12, dy: r * 0.18, rScale: 0.75 },
    { dx: r * 0.08, dy: r * 0.15, rScale: 0.65 },
  ];

  for (const off of offsets) {
    const grad = ctx.createRadialGradient(
      cx + off.dx, cy + off.dy, 0,
      cx + off.dx, cy + off.dy, r * off.rScale
    );
    // Teal-cyan caustic color
    const a1 = alpha * 0.7;
    const a2 = alpha * 0.3;
    grad.addColorStop(0, `rgba(135, 210, 225, ${a1})`);
    grad.addColorStop(0.4, `rgba(120, 200, 220, ${a2})`);
    grad.addColorStop(0.7, `rgba(150, 215, 230, ${a2 * 0.4})`);
    grad.addColorStop(1, `rgba(140, 208, 225, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, dim, dim);
  }

  return c;
}

/** Generate a random number in [min, max] */
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function AmbientCaustics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match viewport
    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Pre-render 4 blob shape templates at varying sizes
    const templates: { canvas: HTMLCanvasElement; size: number }[] = [];
    const templateSizes = [250, 350, 420, 500];
    for (const s of templateSizes) {
      templates.push({ canvas: createBlobCanvas(s, 0.035), size: s });
    }

    // Init 9 blobs with random positions, sizes, velocities
    const blobCount = 9;
    const blobs: Blob[] = [];
    for (let i = 0; i < blobCount; i++) {
      const tmpl = templates[Math.floor(Math.random() * templates.length)];
      const sizeVar = rand(0.7, 1.3);
      blobs.push({
        x: rand(0, window.innerWidth),
        y: rand(0, window.innerHeight),
        vx: rand(-2, 2) || 0.5, // 2-4px/s at 60fps → ~0.03-0.07/frame, but we use px/s
        vy: rand(-2, 2) || 0.5,
        size: tmpl.size * sizeVar,
        alpha: rand(0.025, 0.035),
        offscreen: tmpl.canvas,
      });
    }
    blobsRef.current = blobs;

    let lastTime = performance.now();

    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1); // seconds, capped
      lastTime = now;
      const w = canvas!.width;
      const h = canvas!.height;

      ctx!.clearRect(0, 0, w, h);

      for (const b of blobsRef.current) {
        // Drift position
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Wrap around edges with generous margin
        const margin = b.size * 0.5;
        if (b.x > w + margin) b.x = -margin;
        if (b.x < -margin) b.x = w + margin;
        if (b.y > h + margin) b.y = -margin;
        if (b.y < -margin) b.y = h + margin;

        // Draw blob (the offscreen canvas contains the pre-rendered shape)
        ctx!.globalAlpha = b.alpha;
        ctx!.drawImage(
          b.offscreen,
          b.x - b.size / 2,
          b.y - b.size / 2,
          b.size,
          b.size
        );
      }
      ctx!.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="ambient-caustics-canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
      aria-hidden="true"
    />
  );
}
