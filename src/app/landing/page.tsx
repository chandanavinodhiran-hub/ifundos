"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
 * iFundOS — Cinematic Landing Page
 * Rolls Royce Motor Cars design language. Full-bleed. Cinematic. Confident.
 * ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  bg: "#0A0E1A",
  navBg: "rgba(10, 14, 26, 0.85)",
  border: "rgba(230, 232, 240, 0.2)",
  borderFaint: "rgba(230, 232, 240, 0.06)",
  easeContent: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  easeHover: "cubic-bezier(0.215, 0.61, 0.355, 1)",
} as const;

const NAV_ITEMS = ["Overview", "Technology", "About", "Contact"];

const NAV_MESSAGE = "Your application scored 91. This matches the profile of your last 4 approved grants.".split(" ");

const PARTICLES = [
  { radius: 70, speed: 10, start: 0, opacity: 0.3 },
  { radius: 120, speed: 12, start: 36, opacity: 0.5 },
  { radius: 90, speed: 9, start: 72, opacity: 0.25 },
  { radius: 155, speed: 15, start: 108, opacity: 0.4 },
  { radius: 65, speed: 11, start: 144, opacity: 0.35 },
  { radius: 175, speed: 14, start: 180, opacity: 0.45 },
  { radius: 100, speed: 8, start: 216, opacity: 0.3 },
  { radius: 140, speed: 16, start: 252, opacity: 0.55 },
  { radius: 80, speed: 13, start: 288, opacity: 0.25 },
  { radius: 160, speed: 10, start: 324, opacity: 0.4 },
];

const PIPELINE_DOTS = [
  { left: 6,  top: 40, status: "active",      delay: 0   },
  { left: 11, top: 55, status: "active",      delay: 0.5 },
  { left: 20, top: 42, status: "active",      delay: 0.3 },
  { left: 25, top: 52, status: "active",      delay: 0.8 },
  { left: 28, top: 48, status: "caution",     delay: 0.6 },
  { left: 40, top: 48, status: "caution",     delay: 0.2 },
  { left: 44, top: 46, status: "active",      delay: 0.7 },
  { left: 47, top: 55, status: "rejected",    delay: 0.4 },
  { left: 60, top: 45, status: "recommended", delay: 0.1 },
  { left: 66, top: 52, status: "caution",     delay: 0.9 },
  { left: 77, top: 47, status: "recommended", delay: 0.5 },
  { left: 83, top: 50, status: "recommended", delay: 0.3 },
  { left: 93, top: 48, status: "recommended", delay: 0.7 },
];

const FLOW_LINES = [
  { top: 30, delay: 0 },
  { top: 40, delay: 1.2 },
  { top: 50, delay: 2.4 },
  { top: 60, delay: 3.6 },
  { top: 70, delay: 4.8 },
];

const PIPELINE_STAGES = ["PUBLISHED", "APPLICATIONS", "AI SCORED", "SHORTLISTED", "INTERVIEW", "AWARDED"];

/* ═══════════════════════════════════════════════════════════════════════════
 * UTILITY: Canvas base hook — handles sizing, DPR, resize, animation loop
 * ═══════════════════════════════════════════════════════════════════════════ */
function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void,
  deps: unknown[] = []
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const visRef = useRef(true);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    /* Visibility-based start/stop */
    const obs = new IntersectionObserver(
      ([e]) => { visRef.current = e.isIntersecting; },
      { threshold: 0 }
    );
    obs.observe(canvas);

    let time = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (visRef.current) {
        time += dt;
        ctx.clearRect(0, 0, w, h);
        draw(ctx, w, h, time, dt);
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      obs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CANVAS 1: Dark Water Surface — available for other sections
 * Looking down at a dark body of water at night with faint light playing
 * ═══════════════════════════════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function WaterCanvas() {
  const caustics = useRef(
    Array.from({ length: 18 }, () => ({
      x: Math.random(), y: Math.random(),
      size: 0.06 + Math.random() * 0.1,
      alpha: 0.06 + Math.random() * 0.04,
      sx: 0.008 + Math.random() * 0.012,
      sy: (Math.random() - 0.5) * 0.004,
      morph: Math.random() * Math.PI * 2,
      morphSpeed: 0.3 + Math.random() * 0.4,
    }))
  ).current;

  const currents = useRef(
    Array.from({ length: 9 }, (_, i) => ({
      y: 0.08 + (i * 0.1),
      amp: 0.008 + Math.random() * 0.012,
      wl: 0.15 + Math.random() * 0.12,
      speed: 0.4 + Math.random() * 0.3,
      alpha: 0.02 + Math.random() * 0.015,
      phase: Math.random() * Math.PI * 2,
    }))
  ).current;

  const glints = useRef(
    Array.from({ length: 6 }, () => ({
      x: Math.random(), y: Math.random(),
      life: Math.random() * 4, dur: 2 + Math.random() * 3,
      alpha: 0,
    }))
  ).current;

  const canvasRef = useCanvas((ctx, w, h, t, dt) => {
    /* Base fill */
    ctx.fillStyle = "#0A1218";
    ctx.fillRect(0, 0, w, h);

    /* Caustic blobs */
    for (const c of caustics) {
      c.x += c.sx * dt;
      c.y += c.sy * dt;
      c.morph += c.morphSpeed * dt;
      if (c.x > 1.15) c.x = -0.15;
      if (c.y < -0.1) c.y = 1.1;
      if (c.y > 1.1) c.y = -0.1;

      const px = c.x * w, py = c.y * h;
      const sz = c.size * w * (0.9 + Math.sin(c.morph) * 0.1);
      const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
      g.addColorStop(0, `rgba(75, 165, 195, ${c.alpha})`);
      g.addColorStop(0.6, `rgba(75, 165, 195, ${c.alpha * 0.3})`);
      g.addColorStop(1, "rgba(75, 165, 195, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);
    }

    /* Current lines */
    ctx.lineWidth = 0.5;
    for (const cur of currents) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${cur.alpha})`;
      for (let x = 0; x <= w; x += 4) {
        const nx = x / w;
        const y = (cur.y + Math.sin((nx / cur.wl) * Math.PI * 2 + cur.phase + t * cur.speed) * cur.amp) * h;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    /* Shimmer glints */
    for (const g of glints) {
      g.life += dt;
      if (g.life > g.dur) {
        g.life = 0;
        g.x = Math.random();
        g.y = Math.random();
        g.dur = 2 + Math.random() * 3;
      }
      const p = g.life / g.dur;
      g.alpha = p < 0.1 ? p / 0.1 : p > 0.9 ? (1 - p) / 0.1 : 1;
      g.alpha *= 0.12;
      const px = g.x * w, py = g.y * h;
      const sg = ctx.createRadialGradient(px, py, 0, px, py, 3);
      sg.addColorStop(0, `rgba(200, 220, 255, ${g.alpha})`);
      sg.addColorStop(1, "rgba(200, 220, 255, 0)");
      ctx.fillStyle = sg;
      ctx.fillRect(px - 3, py - 3, 6, 6);
    }
  });

  return <canvas ref={canvasRef} className="section-canvas" />;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CANVAS 2: Forest Canopy — available for other sections
 * ═══════════════════════════════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ForestCanvas() {
  const leaves = useRef(
    Array.from({ length: 14 }, () => ({
      x: Math.random(), y: Math.random(),
      size: 0.05 + Math.random() * 0.1,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      driftX: (Math.random() - 0.5) * 0.008,
      driftY: 0.002 + Math.random() * 0.005,
      depth: Math.random(),
      hue: 30 + Math.random() * 40,
      sat: 50 + Math.random() * 30,
    }))
  ).current;

  const canvasRef = useCanvas((ctx, w, h, t, dt) => {
    ctx.fillStyle = "#0A0E1A";
    ctx.fillRect(0, 0, w, h);

    /* Faint ambient green glow */
    const ag = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.5);
    ag.addColorStop(0, "rgba(40, 90, 50, 0.06)");
    ag.addColorStop(1, "rgba(40, 90, 50, 0)");
    ctx.fillStyle = ag;
    ctx.fillRect(0, 0, w, h);

    for (const lf of leaves) {
      lf.x += lf.driftX * dt;
      lf.y += lf.driftY * dt;
      lf.rotation += lf.rotSpeed * dt;
      if (lf.y > 1.15) { lf.y = -0.15; lf.x = Math.random(); }
      if (lf.x < -0.15) lf.x = 1.15;
      if (lf.x > 1.15) lf.x = -0.15;

      const px = lf.x * w, py = lf.y * h;
      const sz = lf.size * w;
      const alpha = lf.depth < 0.3 ? 0.12 : lf.depth < 0.6 ? 0.2 : 0.35;
      const blur = lf.depth < 0.3 ? 0.6 : 1;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(lf.rotation);
      ctx.scale(blur, blur);
      ctx.globalAlpha = alpha;

      /* Leaf shape — organic ellipse */
      ctx.beginPath();
      ctx.ellipse(0, 0, sz * 0.4, sz, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${lf.hue + 120}, ${lf.sat}%, ${18 + lf.depth * 12}%)`;
      ctx.fill();

      /* Leaf vein */
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(0, sz);
      ctx.strokeStyle = `rgba(200, 255, 200, 0.06)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  });

  return <canvas ref={canvasRef} className="section-canvas" />;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CANVAS 3: Spatial Pipeline — vivid dark-theme river with status particles
 * ═══════════════════════════════════════════════════════════════════════════ */
const STAGES = ["PUBLISHED", "APPLICATIONS", "AI SCORED", "SHORTLISTED", "INTERVIEW", "AWARDED"];
const STATUS_COLORS = [
  "74, 140, 106",  // Recommended (green)
  "75, 130, 180",  // Active (blue)
  "175, 148, 63",  // Caution (amber)
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PipelineCanvas() {
  const caustics = useRef(
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 2, y: 0.3 + Math.random() * 0.35,
      size: 0.03 + Math.random() * 0.07,
      alpha: 0.12 + Math.random() * 0.08,
      speed: 0.012 + Math.random() * 0.018,
      drift: (Math.random() - 0.5) * 0.002,
    }))
  ).current;

  const particles = useRef(
    Array.from({ length: 18 }, () => {
      const colorIdx = Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 1 : 2;
      return {
        x: Math.random() * 1.5,
        y: 0.42 + (Math.random() - 0.5) * 0.2,
        size: 5 + Math.random() * 7,
        speed: 0.015 + Math.random() * 0.025,
        color: STATUS_COLORS[colorIdx],
        pulse: Math.random() * Math.PI * 2,
        alpha: 0.6 + Math.random() * 0.25,
      };
    })
  ).current;

  const currents = useRef(
    Array.from({ length: 9 }, (_, i) => ({
      y: 0.35 + i * 0.035,
      amp: 0.006 + Math.random() * 0.008,
      wl: 0.1 + Math.random() * 0.12,
      speed: 0.4 + Math.random() * 0.3,
      alpha: 0.06 + Math.random() * 0.04,
      phase: Math.random() * Math.PI * 2,
    }))
  ).current;

  const glints = useRef(
    Array.from({ length: 10 }, () => ({
      x: Math.random(), y: 0.35 + Math.random() * 0.3,
      life: Math.random() * 3, dur: 2 + Math.random() * 2,
      size: 1 + Math.random() * 1.5,
    }))
  ).current;

  const canvasRef = useCanvas((ctx, w, h, t, dt) => {
    ctx.fillStyle = "#0A0E1A";
    ctx.fillRect(0, 0, w, h);

    /* River bed — teal gradient, darker and more saturated */
    const riverTop = h * 0.25, riverBot = h * 0.72;
    const rg = ctx.createLinearGradient(0, riverTop, 0, riverBot);
    rg.addColorStop(0, "rgba(40, 120, 150, 0)");
    rg.addColorStop(0.15, "rgba(40, 120, 150, 0.06)");
    rg.addColorStop(0.35, "rgba(50, 140, 170, 0.14)");
    rg.addColorStop(0.5, "rgba(55, 150, 180, 0.18)");
    rg.addColorStop(0.65, "rgba(50, 140, 170, 0.14)");
    rg.addColorStop(0.85, "rgba(40, 120, 150, 0.06)");
    rg.addColorStop(1, "rgba(40, 120, 150, 0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, riverTop, w, riverBot - riverTop);

    /* Bank edges — subtle light borders */
    ctx.strokeStyle = "rgba(230, 232, 240, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, riverTop + (riverBot - riverTop) * 0.08);
    ctx.lineTo(w, riverTop + (riverBot - riverTop) * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, riverBot - (riverBot - riverTop) * 0.08);
    ctx.lineTo(w, riverBot - (riverBot - riverTop) * 0.08);
    ctx.stroke();

    /* Caustic blobs — brighter for dark bg */
    for (const c of caustics) {
      c.x += c.speed * dt;
      c.y += c.drift * dt;
      if (c.x > 1.15) c.x = -0.15;
      if (c.y < 0.28 || c.y > 0.72) c.drift *= -1;
      const px = c.x * w, py = c.y * h, sz = c.size * w;
      const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
      g.addColorStop(0, `rgba(120, 200, 220, ${c.alpha})`);
      g.addColorStop(0.6, `rgba(80, 160, 190, ${c.alpha * 0.3})`);
      g.addColorStop(1, "rgba(80, 160, 190, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);
    }

    /* Current lines — subtle white */
    ctx.lineWidth = 0.6;
    for (const cur of currents) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(230, 232, 240, ${cur.alpha})`;
      for (let x = 0; x <= w; x += 3) {
        const nx = x / w;
        const y = (cur.y + Math.sin((nx / cur.wl) * Math.PI * 2 + cur.phase + t * cur.speed) * cur.amp) * h;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    /* Shimmer glints */
    for (const g of glints) {
      g.life += dt;
      if (g.life > g.dur) {
        g.life = 0; g.x = Math.random(); g.y = 0.35 + Math.random() * 0.3;
      }
      const fade = 1 - Math.abs(g.life / g.dur - 0.5) * 2;
      if (fade > 0) {
        ctx.beginPath();
        ctx.arc(g.x * w, g.y * h, g.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 232, 240, ${fade * 0.15})`;
        ctx.fill();
      }
    }

    /* Bottleneck zone at ~55% (AI Scored stage) — slight narrowing */
    const bx = w * 0.45, bw = w * 0.12;
    const bg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bg.addColorStop(0, "rgba(175, 148, 63, 0)");
    bg.addColorStop(0.5, "rgba(175, 148, 63, 0.04)");
    bg.addColorStop(1, "rgba(175, 148, 63, 0)");
    ctx.fillStyle = bg;
    ctx.fillRect(bx, riverTop, bw, riverBot - riverTop);

    /* Particles — color-coded with glow */
    for (const p of particles) {
      p.x += p.speed * dt;
      p.pulse += dt * 1.5;
      /* Slow down in bottleneck zone */
      const inBottleneck = p.x > 0.42 && p.x < 0.58;
      const effSpeed = inBottleneck ? p.speed * 0.5 : p.speed;
      p.x += (effSpeed - p.speed) * dt;
      if (p.x > 1.15) { p.x = -0.05; p.y = 0.42 + (Math.random() - 0.5) * 0.2; }
      const px = p.x * w, py = p.y * h;
      const a = p.alpha + Math.sin(p.pulse) * 0.1;
      /* Outer glow */
      const gl = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
      gl.addColorStop(0, `rgba(${p.color}, ${a * 0.3})`);
      gl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(px - p.size * 3, py - p.size * 3, p.size * 6, p.size * 6);
      /* Core particle */
      ctx.beginPath();
      ctx.arc(px, py, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${a})`;
      ctx.fill();
    }

    /* Stage labels — clear and legible */
    ctx.textAlign = "center";
    ctx.font = "500 10px 'DM Sans', sans-serif";
    ctx.letterSpacing = "2.5px";
    STAGES.forEach((label, i) => {
      const x = (w * 0.08) + (i / (STAGES.length - 1)) * (w * 0.84);
      ctx.fillStyle = `rgba(230, 232, 240, 0.4)`;
      ctx.fillText(label, x, h * 0.2);
    });
  });

  return <canvas ref={canvasRef} className="section-canvas" />;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CANVAS 5: Emblem Glow + Star Field — The Vision background
 * ═══════════════════════════════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function VisionCanvas() {
  const stars = useRef(
    Array.from({ length: 35 }, () => ({
      x: Math.random(), y: Math.random(),
      size: 1 + Math.random(),
      dx: (Math.random() - 0.5) * 0.003,
      dy: (Math.random() - 0.5) * 0.003,
      alpha: 0.02 + Math.random() * 0.03,
    }))
  ).current;

  const canvasRef = useCanvas((ctx, w, h, t) => {
    ctx.fillStyle = "#0A0E1A";
    ctx.fillRect(0, 0, w, h);

    /* Breathing radial glow behind emblem area */
    const pulse = 0.04 + Math.sin(t * 0.4) * 0.02;
    const g = ctx.createRadialGradient(w / 2, h * 0.38, 0, w / 2, h * 0.38, w * 0.25);
    g.addColorStop(0, `rgba(92, 111, 181, ${pulse})`);
    g.addColorStop(0.5, `rgba(92, 111, 181, ${pulse * 0.3})`);
    g.addColorStop(1, "rgba(92, 111, 181, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* Star particles */
    for (const s of stars) {
      s.x += s.dx * 0.016;
      s.y += s.dy * 0.016;
      if (s.x < 0) s.x = 1;
      if (s.x > 1) s.x = 0;
      if (s.y < 0) s.y = 1;
      if (s.y > 1) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 232, 240, ${s.alpha})`;
      ctx.fill();
    }
  });

  return <canvas ref={canvasRef} className="section-canvas" />;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Typewriter — types text character by character, triggers once on scroll
 * ═══════════════════════════════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Typewriter({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [started, text, speed]);

  return (
    <>
      <p ref={ref} className="nav4-typewriter">
        {displayed}
        {!done && <span className="tw-cursor">|</span>}
      </p>
      <p className={`section-label nav4-label ${done ? "nav4-label-show" : ""}`}>
        Navigator AI
      </p>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SCROLL OBSERVER — reveals sections on scroll
 * ═══════════════════════════════════════════════════════════════════════════ */
function useScrollReveal() {
  useEffect(() => {
    const sections = document.querySelectorAll(".cin-section");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("s-visible");
            e.target.classList.remove("s-exiting");
          } else if (e.boundingClientRect.top < 0) {
            e.target.classList.add("s-exiting");
          }
        });
      },
      { threshold: 0.25 }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);
}

/* Parallax offset */
function useParallax() {
  useEffect(() => {
    const canvases = document.querySelectorAll<HTMLElement>(".section-canvas");
    const onScroll = () => {
      // scrollY used implicitly via getBoundingClientRect
      canvases.forEach((c) => {
        const rect = c.parentElement?.getBoundingClientRect();
        if (!rect) return;
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.15;
        c.style.translate = `0px ${offset}px`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SECTION 4 — Scroll-driven Three-Act Showcase
 *   300 vh tall section with a sticky inner viewport.
 *   Scroll progress (0-1) maps to acts 0 / 1 / 2.
 *   No timers, no wheel hijacking — native browser scroll only.
 * ═══════════════════════════════════════════════════════════════════════════ */
function useActScroll(sectionRef: React.RefObject<HTMLElement | null>, actCount = 3) {
  const [activeAct, setActiveAct] = useState(0);
  const actRef = useRef(0);

  const goToAct = useCallback((index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const sectionTop = section.offsetTop;
    const scrollableHeight = section.offsetHeight - window.innerHeight;
    const targetScroll = sectionTop + (index / (actCount - 1)) * scrollableHeight;
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  }, [sectionRef, actCount]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    /* Visibility toggle via IntersectionObserver */
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) section.classList.add("s4-visible");
      },
      { threshold: 0.05 },
    );
    obs.observe(section);

    /* Scroll → act mapping */
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const scrollableHeight = sectionHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      // How far through the section have we scrolled? (0 at top, 1 at bottom)
      const progress = Math.min(1, Math.max(0, -rect.top / scrollableHeight));

      // Map progress to act index
      const raw = progress * actCount;
      const act = Math.min(actCount - 1, Math.floor(raw));

      if (act !== actRef.current) {
        actRef.current = act;
        setActiveAct(act);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // set initial act on mount

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [sectionRef, actCount]);

  return { activeAct, goToAct };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [navOnLight, setNavOnLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const s4Ref = useRef<HTMLElement>(null);
  const { activeAct, goToAct } = useActScroll(s4Ref);

  /* Act 1 — word-by-word reveal */
  const [revealedWords, setRevealedWords] = useState(0);
  const wordTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Act 2 — pipeline entrance phase (0=hidden, 1=river, 2=stages, 3=particles, 4=message, 5=label) */
  const [pipelinePhase, setPipelinePhase] = useState(0);
  const pipelineTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Act 3 — role card stagger + label */
  const [revealedCards, setRevealedCards] = useState(0);
  const [rolesLabelShow, setRolesLabelShow] = useState(false);
  const roleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    wordTimers.current.forEach(clearTimeout);
    wordTimers.current = [];
    if (activeAct === 0) {
      setRevealedWords(0);
      NAV_MESSAGE.forEach((_, i) => {
        wordTimers.current.push(setTimeout(() => setRevealedWords(i + 1), 800 + i * 120));
      });
    } else {
      setRevealedWords(0);
    }
    return () => wordTimers.current.forEach(clearTimeout);
  }, [activeAct]);

  useEffect(() => {
    pipelineTimers.current.forEach(clearTimeout);
    pipelineTimers.current = [];
    if (activeAct === 1) {
      setPipelinePhase(0);
      pipelineTimers.current.push(setTimeout(() => setPipelinePhase(1), 100));   // river
      pipelineTimers.current.push(setTimeout(() => setPipelinePhase(2), 300));   // stages
      pipelineTimers.current.push(setTimeout(() => setPipelinePhase(3), 600));   // particles
      pipelineTimers.current.push(setTimeout(() => setPipelinePhase(4), 1200));  // message
      pipelineTimers.current.push(setTimeout(() => setPipelinePhase(5), 1600));  // label
    } else {
      setPipelinePhase(0);
    }
    return () => pipelineTimers.current.forEach(clearTimeout);
  }, [activeAct]);

  useEffect(() => {
    roleTimers.current.forEach(clearTimeout);
    roleTimers.current = [];
    if (activeAct === 2) {
      setRevealedCards(0);
      setRolesLabelShow(false);
      [0, 1, 2].forEach((_, i) => {
        roleTimers.current.push(setTimeout(() => setRevealedCards(i + 1), 300 + i * 200));
      });
      roleTimers.current.push(setTimeout(() => setRolesLabelShow(true), 1200));
    } else {
      setRevealedCards(0);
      setRolesLabelShow(false);
    }
    return () => roleTimers.current.forEach(clearTimeout);
  }, [activeAct]);

  useScrollReveal();
  useParallax();

  const handleScroll = useCallback(() => {
    if (window.scrollY <= 50) { setNavOnLight(false); return; }
    const sections = document.querySelectorAll("[data-theme]");
    let overLight = false;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 80 && rect.bottom > 80) {
        overLight = section.getAttribute("data-theme") === "light";
        break;
      }
    }
    setNavOnLight(overLight);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="landing-root">
      {/* ═══ NAVBAR (RR three-column: MENU | emblem | REQUEST ACCESS) ═══ */}
      <nav className={`landing-nav ${navOnLight ? "nav-scrolled" : ""}`}>
        <div className="nav-left" onClick={() => setMenuOpen((o) => !o)}>
          <div className="nav-hamburger">
            <span className={`ham-line ${menuOpen ? "ham-top-open" : ""}`} />
            <span className={`ham-line ${menuOpen ? "ham-mid-open" : ""}`} />
            <span className={`ham-line ${menuOpen ? "ham-bot-open" : ""}`} />
          </div>
          <span className="nav-menu-label">Menu</span>
        </div>
        <div className="nav-center">
          <img src="/emblem_white_transparent.png" alt="iFundOS" className="nav-logo" />
        </div>
        <div className="nav-right">
          <a href="#access" className="nav-cta">Request Access</a>
        </div>
      </nav>

      <div className={`nav-dropdown ${menuOpen ? "nav-dropdown-open" : ""}`}>
        {NAV_ITEMS.map((item) => (
          <a key={item} className="nav-dropdown-link" href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{item}</a>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 1 — HERO (RR Spectre: image + title + CTA only)
       * ═══════════════════════════════════════════════════════════ */}
      <section className="cin-section s-visible hero-section" id="overview" data-theme="dark">
        <img src="/forest-hero.png" alt="" className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">iFundOS</h1>
          <Link href="/login" className="hero-cta">Discover More</Link>
        </div>
        <div className="scroll-indicator">
          <div className="scroll-line" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 2 — THE PLATFORM
       * ═══════════════════════════════════════════════════════════ */}
      <section className="cin-section" id="technology" data-theme="dark">
        <video className="section-video" autoPlay muted loop playsInline>
          <source src="https://github.com/chandanavinodhiran-hub/ifundos/releases/download/v1.0-assets/section2.mp4" type="video/mp4" />
        </video>
        <div className="s2-overlay" />
        <div className="s-text text-bl">
          <p className="section-label s-el" style={{ transitionDelay: "0s" }}>The Platform</p>
          <h2 className="s-el cin-headline" style={{ transitionDelay: "0.15s" }}>
            Where sovereign institutions<br />meet intelligence.
          </h2>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 3 — SPATIAL PIPELINE
       * ═══════════════════════════════════════════════════════════ */}
      <section className="cin-section s3-section" data-theme="dark">
        <video className="section-video" autoPlay muted loop playsInline>
          <source src="https://github.com/chandanavinodhiran-hub/ifundos/releases/download/v1.0-assets/Video.Project.16.mp4" type="video/mp4" />
        </video>
        <div className="s2-overlay" />
        <div className="s-text text-bl">
          <p className="section-label s-el" style={{ transitionDelay: "0.8s" }}>Spatial Pipeline</p>
          <h2 className="s-el cin-headline" style={{ transitionDelay: "1.0s" }}>
            Every application flows<br />through living intelligence.
          </h2>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 4 — THREE-ACT SHOWCASE
       * ═══════════════════════════════════════════════════════════ */}
      <section className="s4-section" ref={s4Ref} data-theme="dark">
        <div className="s4-sticky">
        {/* Act 1: Navigator AI */}
        <div className={`act ${activeAct === 0 ? "act-active" : ""}`}>
          <div className="act-content">
            <div className="navigator-glow" />
            <div className="navigator-particles">
              {PARTICLES.map((p, i) => (
                <div key={i} className="navigator-particle"
                  style={{ opacity: p.opacity, animation: `orbit${i} ${p.speed}s linear infinite` }} />
              ))}
            </div>
            <div className="navigator-sapling">
              <svg width="100" height="200" viewBox="0 0 60 120">
                <path d="M30 120 L30 55" stroke="rgba(74,140,106,0.6)" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M30 75 Q20 65 15 50" stroke="rgba(74,140,106,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M30 65 Q40 55 45 42" stroke="rgba(74,140,106,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <ellipse cx="15" cy="45" rx="10" ry="14" fill="rgba(74,140,106,0.35)" />
                <ellipse cx="30" cy="35" rx="12" ry="16" fill="rgba(60,130,90,0.4)" />
                <ellipse cx="45" cy="38" rx="10" ry="13" fill="rgba(74,140,106,0.3)" />
                <ellipse cx="22" cy="28" rx="9" ry="12" fill="rgba(50,120,75,0.3)" />
                <ellipse cx="38" cy="25" rx="9" ry="12" fill="rgba(60,130,90,0.35)" />
                <ellipse cx="30" cy="18" rx="8" ry="11" fill="rgba(74,140,106,0.3)" />
              </svg>
            </div>
            <div className="navigator-message">
              <p className="navigator-message-text">
                {NAV_MESSAGE.map((word, i) => (
                  <span key={i} className={`word ${i < revealedWords ? "revealed" : ""}`}>{word} </span>
                ))}
              </p>
            </div>
            <div className="navigator-label">NAVIGATOR AI</div>
          </div>
        </div>

        {/* Act 2: Spatial Pipeline */}
        <div className={`act ${activeAct === 1 ? "act-active" : ""}`}>
          <div className="act-content">
            {/* Stage labels */}
            <div className="pipeline-stages">
              {PIPELINE_STAGES.map((s, i) => (
                <span key={s} className={`pipeline-stage ${pipelinePhase >= 2 ? "pipeline-stage-show" : ""}`}
                  style={{ transitionDelay: `${i * 0.1}s` }}>{s}</span>
              ))}
            </div>

            {/* River container */}
            <div className={`pipeline-river-container ${pipelinePhase >= 1 ? "pipeline-river-show" : ""}`}>
              <svg className="pipeline-river" viewBox="0 0 1200 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(75,165,195,0.3)" />
                    <stop offset="40%" stopColor="rgba(75,165,195,0.5)" />
                    <stop offset="50%" stopColor="rgba(75,165,195,0.6)" />
                    <stop offset="60%" stopColor="rgba(75,165,195,0.45)" />
                    <stop offset="100%" stopColor="rgba(75,165,195,0.25)" />
                  </linearGradient>
                  <filter id="caustic">
                    <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="1">
                      <animate attributeName="seed" from="1" to="10" dur="8s" repeatCount="indefinite" />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" scale="6" />
                  </filter>
                </defs>
                <path d="M0,40 C100,40 150,40 200,45 C300,50 350,55 400,70 C450,80 480,90 500,92 C520,94 530,95 550,95 C570,95 580,94 600,92 C620,90 650,80 700,70 C750,55 800,50 900,45 C1000,40 1100,40 1200,40 L1200,160 C1100,160 1000,160 900,155 C800,150 750,145 700,130 C650,120 620,110 600,108 C580,106 570,105 550,105 C530,105 520,106 500,108 C480,110 450,120 400,130 C350,145 300,150 200,155 C150,160 100,160 0,160 Z"
                  fill="url(#riverGrad)" filter="url(#caustic)" />
              </svg>

              {/* Flow lines */}
              <div className="pipeline-flow-lines">
                {FLOW_LINES.map((fl, i) => (
                  <div key={i} className="flow-line" style={{ top: `${fl.top}%`, animationDelay: `${fl.delay}s` }} />
                ))}
              </div>

              {/* Application particles */}
              <div className="pipeline-particles">
                {PIPELINE_DOTS.map((d, i) => (
                  <div key={i}
                    className={`pipeline-dot particle-${d.status} ${pipelinePhase >= 3 ? "pipeline-dot-show" : ""}`}
                    style={{ left: `${d.left}%`, top: `${d.top}%`, animationDelay: `${d.delay}s`,
                      transitionDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            </div>

            {/* Message card */}
            <div className={`pipeline-message ${pipelinePhase >= 4 ? "pipeline-message-show" : ""}`}>
              <p className="pipeline-message-text">13 applications across 6 stages. 3 recommended. 2 cautioned. 1 rejected.</p>
            </div>

            {/* Label */}
            <div className={`pipeline-label ${pipelinePhase >= 5 ? "pipeline-label-show" : ""}`}>SPATIAL PIPELINE</div>
          </div>
        </div>

        {/* Act 3: Three Roles */}
        <div className={`act ${activeAct === 2 ? "act-active" : ""}`}>
          <div className="act-content">
            <div className="roles-container">
              {/* Fund Manager */}
              <div className={`role-card ${revealedCards >= 1 ? "role-revealed" : ""}`}>
                <div className="role-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="6" width="16" height="16" rx="3" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                    <rect x="26" y="6" width="16" height="16" rx="3" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                    <rect x="6" y="26" width="16" height="16" rx="3" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                    <rect x="26" y="26" width="16" height="16" rx="3" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                  </svg>
                </div>
                <h3 className="role-title">Fund Manager</h3>
                <p className="role-description">Fatimah sees the full pipeline, makes billion-SAR decisions with AI-backed confidence.</p>
              </div>

              {/* Contractor */}
              <div className={`role-card ${revealedCards >= 2 ? "role-revealed" : ""}`}>
                <div className="role-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="4" width="24" height="32" rx="3" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                    <line x1="14" y1="12" x2="26" y2="12" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                    <line x1="14" y1="18" x2="26" y2="18" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                    <line x1="14" y1="24" x2="22" y2="24" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                    <circle cx="33" cy="33" r="7" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" />
                    <line x1="38" y1="38" x2="43" y2="43" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="role-title">Contractor</h3>
                <p className="role-description">Omar tracks his application, gets matched to opportunities, sees his AI score in real time.</p>
              </div>

              {/* Auditor */}
              <div className={`role-card ${revealedCards >= 3 ? "role-revealed" : ""}`}>
                <div className="role-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M24 4L40 12V26C40 36 32 44 24 44C16 44 8 36 8 26V12L24 4Z" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" fill="none" />
                    <path d="M16 24L22 30L34 18" stroke="rgba(230,232,240,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <h3 className="role-title">Auditor</h3>
                <p className="role-description">Ibrahim monitors every decision, flags divergence from AI, ensures full accountability.</p>
              </div>
            </div>

            <div className={`roles-label ${rolesLabelShow ? "roles-label-show" : ""}`}>THREE PERSPECTIVES, ONE PLATFORM</div>
          </div>
        </div>

        {/* Dot Navigation */}
        <div className="act-dots">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              className={`act-dot ${activeAct === i ? "act-dot-active" : ""}`}
              onClick={() => goToAct(i)}
              aria-label={`Go to act ${i + 1}`}
            />
          ))}
        </div>
        </div>{/* end .s4-sticky */}
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 5 — THE VISION
       * ═══════════════════════════════════════════════════════════ */}
      <section className="cin-section" id="about" data-theme="dark">
        <video className="section-video" autoPlay muted loop playsInline>
          <source src="https://github.com/chandanavinodhiran-hub/ifundos/releases/download/v1.0-assets/Video.Project.18.mp4" type="video/mp4" />
        </video>
        <div className="s2-overlay" />
        <div className="s-text vision-layout">
          <img src="/emblem_white_transparent.png" alt="" className="vision-emblem s-el" style={{ transitionDelay: "0s" }} />
          <div className="vision-bottom">
            <h2 className="s-el cin-headline" style={{ transitionDelay: "0.15s", textAlign: "center" }}>
              Built for the Saudi Green Initiative.
            </h2>
            <p className="section-label s-el" style={{ transitionDelay: "0.3s", textAlign: "center" }}>
              SAR 188 Billion in Environmental Stewardship
            </p>
            <p className="s-el powered-by" style={{ transitionDelay: "0.5s" }}>
              Powered by Iozera Technologies
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 6 — REQUEST ACCESS
       * ═══════════════════════════════════════════════════════════ */}
      <section className="cin-section" id="access" data-theme="dark">
        <img src="/section6-bg.png" alt="" className="section-video" style={{ objectFit: "cover" }} />
        <div className="s2-overlay" />
        <div className="s-text access-center">
          <h2 className="s-el cin-headline" style={{ transitionDelay: "0s", textAlign: "center" }}>
            Request Access
          </h2>
          <form className="access-form s-el" style={{ transitionDelay: "0.15s" }} onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Full Name" className="access-input" />
            <input type="text" placeholder="Organization" className="access-input" />
            <input type="email" placeholder="Email Address" className="access-input" />
            <button type="submit" className="access-submit">Submit</button>
          </form>
        </div>
      </section>

      {/* ═══ STYLES ═══ */}
      <style>{`
        /* ── Root ── */
        .landing-root {
          background: ${C.bg};
          color: rgba(230, 232, 240, 0.9);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        html { scroll-behavior: smooth; }

        /* ── Navbar (RR three-column grid) ── */
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: grid; grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 28px 48px;
          background: transparent;
          transition: background 0.4s ${C.easeContent}, backdrop-filter 0.4s ${C.easeContent};
          opacity: 0;
          animation: fadeIn 0.6s ${C.easeContent} 0.3s forwards;
        }
        .nav-scrolled {
          background: rgba(10, 14, 26, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .nav-left {
          justify-self: start;
          display: flex; align-items: center; gap: 12px;
          cursor: pointer;
        }
        .nav-hamburger {
          display: flex; flex-direction: column; gap: 5px; width: 22px;
        }
        .ham-line { display:block; width:100%; height:1px; background:rgba(230,232,240,0.7); transition:all 0.4s ${C.easeContent}; }
        .nav-left:hover .ham-line { background:rgba(230,232,240,0.95); }
        .ham-top-open { transform:rotate(45deg) translate(4px,4px); }
        .ham-mid-open { opacity:0; }
        .ham-bot-open { transform:rotate(-45deg) translate(4px,-4px); }
        .nav-menu-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400; letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(230, 232, 240, 0.7);
          transition: color 0.4s ${C.easeContent};
        }
        .nav-left:hover .nav-menu-label { color: rgba(230, 232, 240, 0.95); }
        .nav-center { justify-self: center; }
        .nav-logo {
          height: 36px; width: auto;
          opacity: 0.85;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.1));
          transition: opacity 0.4s ${C.easeContent};
        }
        .nav-logo:hover { opacity: 1; }
        .nav-right { justify-self: end; display: flex; align-items: center; }
        .nav-cta {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400; letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(230, 232, 240, 0.7);
          background: transparent; border: none;
          cursor: pointer; padding: 0;
          text-decoration: none; position: relative;
          transition: color 0.4s ${C.easeContent};
        }
        .nav-cta::after {
          content: ''; position: absolute; bottom: -4px; left: 50%;
          width: 0; height: 1px;
          background: rgba(230, 232, 240, 0.5);
          transition: width 0.4s ${C.easeContent}, left 0.4s ${C.easeContent};
        }
        .nav-cta:hover { color: rgba(230, 232, 240, 0.95); }
        .nav-cta:hover::after { width: 100%; left: 0; }

        /* ── Dropdown ── */
        .nav-dropdown { position:fixed; top:80px; left:48px; background:rgba(10,14,26,0.96); backdrop-filter:blur(24px); padding:0 40px; border-radius:4px; z-index:99; display:flex; flex-direction:column; gap:0; max-height:0; overflow:hidden; opacity:0; transition:all 0.4s ${C.easeContent}; border:1px solid transparent; }
        .nav-dropdown-open { max-height:280px; opacity:1; padding:28px 40px; gap:24px; border-color:${C.borderFaint}; }
        .nav-dropdown-link { position:relative; color:rgba(230,232,240,0.3); font-size:13px; font-weight:400; letter-spacing:3px; text-transform:uppercase; text-decoration:none; cursor:pointer; transition:color 0.4s ${C.easeHover}; }
        .nav-dropdown-link:hover { color:rgba(230,232,240,0.7); }
        .nav-dropdown-link::after { content:''; position:absolute; bottom:-4px; left:50%; width:0; height:1px; background:rgba(230,232,240,0.4); transition:width 0.4s ${C.easeHover}, left 0.4s ${C.easeHover}; }
        .nav-dropdown-link:hover::after { width:100%; left:0; }

        /* ════════════════════════════════════════════════════════════
         * GLOBAL SECTION PATTERN
         * ════════════════════════════════════════════════════════════ */
        .cin-section {
          width: 100%;
          height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
        }

        .section-canvas, .section-video {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          display: block;
          will-change: transform;
        }
        .section-canvas {
          animation: kenBurns 15s ease-in-out infinite alternate;
        }
        @keyframes kenBurns {
          from { scale: 1; }
          to { scale: 1.04; }
        }

        .section-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(
            to bottom,
            rgba(10, 14, 26, 0.4) 0%,
            rgba(10, 14, 26, 0.05) 30%,
            rgba(10, 14, 26, 0.05) 60%,
            rgba(10, 14, 26, 0.6) 100%
          );
          z-index: 1;
          pointer-events: none;
        }

        .s-text {
          position: relative;
          z-index: 2;
        }

        /* ── Scroll reveal ── */
        .s-el {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s-visible .s-el {
          opacity: 1;
          transform: translateY(0);
        }
        .s-exiting .s-el {
          opacity: 0;
          transform: translateY(-30px);
          transition-duration: 0.6s;
        }

        /* Text shadow for legibility over video */
        .cin-headline, .hero-title, .hero-sub, .section-label {
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        }

        .cin-headline {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 200;
          letter-spacing: 2px;
          color: rgba(230, 232, 240, 0.85);
          line-height: 1.25;
          margin: 0;
        }

        .section-label {
          font-size: 11px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: rgba(230, 232, 240, 0.35);
          margin-bottom: 20px;
          margin: 16px 0 0 0;
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 1 — HERO (RR Spectre)
         * ════════════════════════════════════════════════════════════ */
        .hero-section { width: 100vw; height: 100vh; }

        .hero-image {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center center;
          will-change: transform;
          opacity: 0;
          animation:
            imageReveal 1.8s ${C.easeContent} 0s forwards,
            kenBurns 18s ${C.easeContent} 1.8s infinite alternate;
        }
        @keyframes imageReveal {
          0% { opacity: 0; scale: 1.06; }
          100% { opacity: 1; scale: 1.0; }
        }

        .hero-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; z-index: 2;
          background:
            linear-gradient(to bottom, rgba(10,14,26,0.35) 0%, rgba(10,14,26,0.05) 20%, transparent 35%),
            linear-gradient(to top, rgba(10,14,26,0.62) 0%, rgba(10,14,26,0.3) 30%, transparent 55%),
            linear-gradient(rgba(10,14,26,0.08), rgba(10,14,26,0.08));
        }

        .hero-content {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 10;
          padding-top: 0;
          margin-top: -6vh;
        }

        .hero-title {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(48px, 7vw, 80px);
          font-weight: 200;
          letter-spacing: clamp(12px, 3vw, 35px);
          color: rgba(230, 232, 240, 0.9);
          text-shadow: 0 2px 30px rgba(0, 0, 0, 0.25);
          margin: 0 0 36px 0;
          opacity: 0; transform: translateY(25px);
          animation: fadeInUp 1s ${C.easeContent} 0.6s forwards;
        }

        .hero-cta {
          display: inline-block;
          background: rgba(235, 232, 225, 0.92);
          color: rgba(20, 24, 36, 0.85);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 4px; text-transform: uppercase;
          padding: 14px 44px;
          border-radius: 36px; border: none;
          cursor: pointer; text-decoration: none;
          transition: all 0.5s ${C.easeContent};
          opacity: 0; transform: translateY(20px);
          animation: fadeInUp 0.8s ${C.easeContent} 1.0s forwards;
        }
        .hero-cta:hover {
          background: rgba(235, 232, 225, 1.0);
          transform: translateY(-1px);
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
        }

        /* ── Scroll indicator ── */
        .scroll-indicator {
          position: absolute; bottom: 36px; left: 50%;
          transform: translateX(-50%); z-index: 10;
          opacity: 0;
          animation: fadeIn 0.8s ${C.easeContent} 2s forwards;
        }
        .scroll-line {
          width: 1px; height: 48px;
          background: linear-gradient(to bottom, rgba(230,232,240,0.4), rgba(230,232,240,0));
          animation: scrollPulse 2.5s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.15; transform: scaleY(0.7); }
          50% { opacity: 0.4; transform: scaleY(1.0); }
        }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION TEXT POSITIONS
         * ════════════════════════════════════════════════════════════ */
        .text-bl {
          position: absolute;
          bottom: 96px;
          left: 72px;
          z-index: 10;
          max-width: 600px;
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 2 — OVERLAY (directional bottom-left gradient)
         * ════════════════════════════════════════════════════════════ */
        .s2-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; z-index: 2;
          background:
            linear-gradient(to bottom, rgba(10,14,26,0.3) 0%, transparent 25%),
            linear-gradient(to top right, rgba(10,14,26,0.6) 0%, rgba(10,14,26,0.3) 25%, transparent 50%);
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 3 — SPATIAL PIPELINE (dark bg, no overlay)
         * ════════════════════════════════════════════════════════════ */
        .s3-section { background: #0A0E1A; }

        /* ════════════════════════════════════════════════════════════
         * SECTION 4 — THREE-ACT SHOWCASE
         * ════════════════════════════════════════════════════════════ */
        .s4-section {
          position: relative;
          width: 100%;
          height: 300vh;
          background: #0A0E1A;
          margin: 0;
          padding: 0;
          opacity: 0;
          transition: opacity 0.8s ${C.easeContent};
        }
        .s4-section.s4-visible {
          opacity: 1;
        }

        /* Sticky inner viewport — stays fixed while user scrolls through 300 vh */
        .s4-sticky {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        /* ── Act layers ── */
        .act {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 1.5s ${C.easeContent}, visibility 1.5s ${C.easeContent};
          z-index: 1;
        }
        .act-active {
          opacity: 1;
          visibility: visible;
          z-index: 2;
        }
        .act-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 48px;
        }

        /* ── Dot navigation ── */
        .act-dots {
          position: absolute;
          bottom: 48px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 14px;
          z-index: 10;
        }
        .act-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(230, 232, 240, 0.3);
          background: transparent;
          cursor: pointer;
          padding: 0;
          transition: all 0.5s ${C.easeContent};
        }
        .act-dot-active {
          background: rgba(230, 232, 240, 0.7);
          border-color: rgba(230, 232, 240, 0.7);
        }
        .act-dot:hover {
          border-color: rgba(230, 232, 240, 0.6);
        }

        /* ── Act 1: Navigator AI ── */
        .navigator-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -55%);
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(75,165,130,0.1) 0%, rgba(75,165,130,0.04) 40%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          animation: glowPulse 5s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -55%) scale(1.0); }
          50% { opacity: 1.0; transform: translate(-50%, -55%) scale(1.1); }
        }

        .navigator-particles {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -55%);
          width: 0; height: 0;
          z-index: 2;
        }
        .navigator-particle {
          position: absolute;
          width: 3px; height: 3px;
          background: rgba(75,165,130,0.5);
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(75,165,130,0.3);
        }
        ${PARTICLES.map((p, i) => `
        @keyframes orbit${i} {
          0%   { transform: rotate(${p.start}deg) translateX(${p.radius}px) rotate(-${p.start}deg); }
          100% { transform: rotate(${p.start + 360}deg) translateX(${p.radius}px) rotate(-${p.start + 360}deg); }
        }`).join("")}

        .navigator-sapling {
          position: relative;
          z-index: 3;
          animation: saplingBreathe 4s ease-in-out infinite;
        }
        @keyframes saplingBreathe {
          0%, 100% { transform: scale(1.0); filter: brightness(1.0); }
          50% { transform: scale(1.04); filter: brightness(1.2); }
        }

        .navigator-message {
          background: rgba(230,232,240,0.03);
          border: 1px solid rgba(230,232,240,0.06);
          border-radius: 16px;
          padding: 32px 40px;
          max-width: 520px;
          text-align: center;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          margin-top: 36px;
          position: relative;
          z-index: 3;
        }
        .navigator-message-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.7;
          color: rgba(230,232,240,0.6);
          margin: 0;
        }
        .navigator-message-text .word {
          opacity: 0;
          display: inline;
          transition: opacity 0.3s ${C.easeContent};
        }
        .navigator-message-text .word.revealed {
          opacity: 1;
        }

        .navigator-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(230,232,240,0.2);
          margin-top: 24px;
          position: relative;
          z-index: 3;
        }

        /* ── Act 2: Spatial Pipeline ── */
        .pipeline-stages {
          display: flex;
          justify-content: space-between;
          width: 100%;
          max-width: 1100px;
          padding: 0 48px;
          margin-bottom: 24px;
        }
        .pipeline-stage {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(230,232,240,0.3);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ${C.easeContent}, transform 0.6s ${C.easeContent};
        }
        .pipeline-stage-show { opacity: 1; transform: translateY(0); }

        .pipeline-river-container {
          position: relative;
          width: 100%;
          max-width: 1100px;
          height: 220px;
          margin: 0 auto;
          opacity: 0;
          transition: opacity 1s ${C.easeContent};
        }
        .pipeline-river-show { opacity: 1; }
        .pipeline-river { width: 100%; height: 100%; }

        .pipeline-flow-lines {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none; overflow: hidden;
        }
        .flow-line {
          position: absolute;
          height: 1px; width: 150px;
          background: linear-gradient(to right, transparent, rgba(230,232,240,0.08), transparent);
          animation: flowDrift 6s linear infinite;
        }
        @keyframes flowDrift {
          0%   { transform: translateX(-200px); }
          100% { transform: translateX(1300px); }
        }

        .pipeline-particles {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none;
        }
        .pipeline-dot {
          position: absolute;
          width: 10px; height: 10px;
          border-radius: 50%;
          animation: particleFloat 3s ease-in-out infinite;
          opacity: 0;
          transition: opacity 0.5s ${C.easeContent};
          transform: translate(-50%, -50%);
        }
        .pipeline-dot-show { opacity: 1; }

        .particle-recommended {
          background: rgba(74,140,106,0.85);
          box-shadow: 0 0 8px rgba(74,140,106,0.4);
        }
        .particle-caution {
          background: rgba(175,148,63,0.85);
          box-shadow: 0 0 8px rgba(175,148,63,0.4);
        }
        .particle-active {
          background: rgba(75,130,180,0.85);
          box-shadow: 0 0 8px rgba(75,130,180,0.4);
        }
        .particle-rejected {
          background: rgba(150,90,90,0.5);
          box-shadow: 0 0 6px rgba(150,90,90,0.2);
        }
        @keyframes particleFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-4px); }
        }

        .pipeline-message {
          background: rgba(230,232,240,0.03);
          border: 1px solid rgba(230,232,240,0.06);
          border-radius: 16px;
          padding: 24px 36px;
          max-width: 580px;
          text-align: center;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          margin-top: 32px;
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .pipeline-message-show { opacity: 1; transform: translateY(0); }
        .pipeline-message-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.7;
          color: rgba(230,232,240,0.5);
          margin: 0;
        }

        .pipeline-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(230,232,240,0.2);
          margin-top: 20px;
          text-align: center;
          opacity: 0;
          transition: opacity 0.6s ${C.easeContent};
        }
        .pipeline-label-show { opacity: 1; }

        /* ── Act 3: Three Roles ── */
        .roles-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 960px;
          width: 100%;
          padding: 0 48px;
        }

        .role-card {
          background: rgba(230,232,240,0.03);
          border: 1px solid rgba(230,232,240,0.06);
          border-radius: 20px;
          padding: 40px 32px;
          text-align: center;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: 0;
          transform: translateY(30px);
        }
        .role-card.role-revealed {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .role-card.role-revealed:hover {
          background: rgba(230,232,240,0.05);
          border-color: rgba(230,232,240,0.1);
          transform: translateY(-4px);
        }

        .role-icon {
          width: 48px; height: 48px;
          margin: 0 auto 24px;
          opacity: 0.5;
        }

        .role-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          font-weight: 300;
          letter-spacing: 1px;
          color: rgba(230,232,240,0.85);
          margin: 0 0 16px;
        }
        .role-description {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.7;
          color: rgba(230,232,240,0.4);
          margin: 0;
        }

        .roles-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(230,232,240,0.2);
          margin-top: 48px;
          text-align: center;
          opacity: 0;
          transition: opacity 0.8s ${C.easeContent};
        }
        .roles-label-show { opacity: 1; }

        /* ════════════════════════════════════════════════════════════
         * SECTION 5 — VISION
         * ════════════════════════════════════════════════════════════ */
        .vision-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: center;
          padding: 0 24px;
        }
        .vision-emblem {
          width: 200px;
          height: 200px;
          object-fit: contain;
          animation: breathe 6s ease-in-out infinite;
          filter: drop-shadow(0 0 40px rgba(92, 111, 181, 0.06));
          margin-bottom: 60px;
        }
        .vision-bottom { display: flex; flex-direction: column; align-items: center; }
        .powered-by {
          margin-top: 40px;
          font-size: 9px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(230, 232, 240, 0.12);
          text-align: center;
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 6 — REQUEST ACCESS
         * ════════════════════════════════════════════════════════════ */
        .access-center {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .access-form {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
          max-width: 400px;
          margin-top: 40px;
        }

        .access-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(230, 232, 240, 0.12);
          padding: 14px 0;
          color: rgba(230, 232, 240, 0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          outline: none;
          transition: border-color 0.4s ${C.easeHover};
          width: 100%;
        }
        .access-input::placeholder { color: rgba(230, 232, 240, 0.2); }
        .access-input:focus { border-bottom-color: rgba(230, 232, 240, 0.4); }

        .access-submit {
          margin-top: 32px;
          border: 1px solid rgba(230, 232, 240, 0.2);
          background: transparent;
          padding: 14px 48px;
          color: rgba(230, 232, 240, 0.5);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 3px;
          cursor: pointer;
          transition: all 0.4s ${C.easeHover};
          align-self: flex-start;
        }
        .access-submit:hover {
          background: rgba(230, 232, 240, 0.05);
          border-color: rgba(230, 232, 240, 0.4);
          color: rgba(230, 232, 240, 0.8);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .landing-nav { padding:16px 24px; }
          .nav-menu-label { display:none; }
          .nav-cta { display:none; }
          .nav-logo { height:28px; }
          .nav-dropdown { left:24px; top:64px; }
          .hero-title { font-size:clamp(36px, 10vw, 42px); letter-spacing:clamp(10px, 3vw, 14px); }
          .hero-cta { padding:14px 36px; font-size:11px; }
          .scroll-indicator { display:none; }
          .cin-headline { font-size:clamp(24px, 6vw, 28px); }
          .text-bl { left:32px; right:32px; bottom:64px; }
          .vision-emblem { width:120px; height:120px; }
          .act-content { padding:32px 24px; }
          .pipeline-stages { padding:0 16px; }
          .pipeline-stage { font-size:8px; letter-spacing:1.5px; }
          .pipeline-river-container { height:160px; }
          .pipeline-dot { width:7px; height:7px; }
          .pipeline-message { max-width:90vw; padding:20px 24px; }
          .pipeline-message-text { font-size:13px; }
          .navigator-glow { width:240px; height:240px; }
          .navigator-sapling svg { width:80px; height:160px; }
          .navigator-message { max-width:90vw; padding:24px 28px; }
          .navigator-message-text { font-size:14px; }
          .roles-container { grid-template-columns:1fr; gap:16px; padding:0 24px; }
          .role-card { padding:28px 24px; }
          .access-form { max-width:320px; padding:0 24px; }
        }
      `}</style>
    </div>
  );
}
