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

const NAV_MESSAGE_WORDS = "Your application scored 91. This matches the profile of your last 4 approved grants.".split(" ");

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
 * MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [navOnLight, setNavOnLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          <img src="/emblem_white_transparent.png" alt="iFundOS" className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ cursor: "pointer" }} />
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
       * SECTION 4 — NAVIGATOR AI
       * ═══════════════════════════════════════════════════════════ */}
      <section className="cin-section section-navigator" data-theme="dark">
        {/* Floating ambient motes */}
        <div className="nav-motes">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="nav-mote" style={{
              left: `${8 + (i * 7.5) % 84}%`,
              animationDelay: `${i * 1.3}s`,
              animationDuration: `${8 + (i % 4) * 2}s`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              opacity: 0.15 + (i % 3) * 0.08,
            }} />
          ))}
        </div>
        <div className="navigator-center">
          <div className="navigator-glow s-el" style={{ transitionDelay: "0s" }} />
          <div className="navigator-sapling s-el" style={{ transitionDelay: "0.2s" }}>
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
          <div className="navigator-message s-el" style={{ transitionDelay: "0.5s" }}>
            <p className="navigator-message-text">
              {NAV_MESSAGE_WORDS.map((word, i) => (
                <span key={i} className="nav-word" style={{ animationDelay: `${0.8 + i * 0.12}s` }}>
                  {word}{" "}
                </span>
              ))}
            </p>
          </div>
          <div className="navigator-label s-el" style={{ transitionDelay: "0.8s" }}>NAVIGATOR AI</div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 5 — THE VISION
       * ═══════════════════════════════════════════════════════════ */}
      <section className="cin-section" id="about" data-theme="dark">
        <video className="section-video" autoPlay muted loop playsInline>
          <source src="https://github.com/chandanavinodhiran-hub/ifundos/releases/download/v1.0-assets/Video.Project.18.mp4" type="video/mp4" />
        </video>
        <div className="vision-gradient" />
        <div className="s-text text-bl">
          <h2 className="s-el cin-headline" style={{ transitionDelay: "0.15s" }}>
            Built for the Saudi Green Initiative.
          </h2>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 6 — REQUEST ACCESS
       * ═══════════════════════════════════════════════════════════ */}
      <section className="cin-section" id="access" data-theme="dark">
        <img src="/section6-bg.png" alt="" className="section-video" style={{ objectFit: "cover" }} />
        <div className="access-overlay" />
        <div className="s-text access-center">
          <div className="access-card s-el" style={{ transitionDelay: "0s" }}>
            <h2 className="access-title">Request Access</h2>
            <form className="access-form" onSubmit={(e) => e.preventDefault()}>
              <div className="access-field">
                <label className="access-label">Full Name</label>
                <input type="text" placeholder="Your full name" className="access-input" />
              </div>
              <div className="access-field">
                <label className="access-label">Email Address</label>
                <input type="email" placeholder="you@organization.sa" className="access-input" />
              </div>
              <div className="access-field">
                <label className="access-label">Organization</label>
                <input type="text" placeholder="Your organization" className="access-input" />
              </div>
              <div className="access-field">
                <label className="access-label">Role</label>
                <input type="text" placeholder="Fund Manager, Contractor, or Auditor" className="access-input" />
              </div>
              <button type="submit" className="access-submit">Request Access →</button>
            </form>
            <p className="access-footer">Sovereign institutions and qualified contractors only.</p>
          </div>
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
          height: 47px; width: auto;
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
         * SECTION 4 — NAVIGATOR AI
         * ════════════════════════════════════════════════════════════ */
        .section-navigator {
          background: #0A0E1A;
        }
        .navigator-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .navigator-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -45%);
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(75,165,130,0.1) 0%, rgba(75,165,130,0.04) 40%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          animation: glowPulse 5s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -45%) scale(1.0); }
          50% { opacity: 1.0; transform: translate(-50%, -45%) scale(1.1); }
        }
        .navigator-sapling {
          width: 100px; height: auto;
          position: relative;
          z-index: 3;
          margin-bottom: 36px;
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

        /* Word-by-word reveal */
        .nav-word {
          display: inline-block;
          margin-right: 0.3em;
          opacity: 0;
          filter: blur(4px);
          animation: wordReveal 0.5s ${C.easeContent} forwards;
        }
        .s-visible .nav-word {
          animation: wordReveal 0.5s ${C.easeContent} forwards;
        }
        @keyframes wordReveal {
          to { opacity: 1; filter: blur(0); }
        }

        /* Floating ambient motes */
        .nav-motes {
          position: absolute; inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }
        .nav-mote {
          position: absolute;
          bottom: -10px;
          border-radius: 50%;
          background: rgba(75,165,130,0.4);
          animation: moteFloat linear infinite;
        }
        @keyframes moteFloat {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 5 — VISION
         * ════════════════════════════════════════════════════════════ */
        .vision-gradient {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; z-index: 2;
          background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 60%);
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 6 — REQUEST ACCESS (glassmorphic card)
         * ════════════════════════════════════════════════════════════ */
        .access-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.45);
          pointer-events: none; z-index: 2;
        }
        .access-center {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .access-card {
          position: relative; z-index: 3;
          background: rgba(10, 15, 26, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 22px;
          padding: 48px 52px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 24px 48px rgba(0,0,0,0.3);
        }
        .access-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 34px;
          font-weight: 300;
          color: rgba(255,255,255,0.92);
          text-align: center;
          margin: 0 0 32px;
          letter-spacing: 0.5px;
        }
        .access-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .access-field { display: flex; flex-direction: column; gap: 6px; }
        .access-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .access-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 11px;
          padding: 15px 16px;
          color: rgba(255,255,255,0.85);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.3s ${C.easeHover}, background 0.3s ${C.easeHover};
        }
        .access-input::placeholder { color: rgba(255,255,255,0.25); }
        .access-input:focus {
          border-color: rgba(130, 90, 220, 0.35);
          background: rgba(255,255,255,0.06);
        }
        .access-submit {
          margin-top: 8px;
          width: 100%;
          padding: 16px;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 1px;
          cursor: pointer;
          background: linear-gradient(135deg,
            rgba(130, 90, 220, 0.35),
            rgba(90, 140, 210, 0.30),
            rgba(75, 185, 195, 0.35));
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: rgba(225, 218, 255, 0.95);
          border: 1px solid rgba(160, 130, 240, 0.20);
          box-shadow: 0 0 30px rgba(120, 90, 220, 0.10);
          transition: all 0.3s ${C.easeHover};
        }
        .access-submit:hover {
          transform: translateY(-1px);
          background: linear-gradient(135deg,
            rgba(130, 90, 220, 0.45),
            rgba(90, 140, 210, 0.40),
            rgba(75, 185, 195, 0.45));
          border-color: rgba(180, 150, 255, 0.30);
          box-shadow: 0 0 40px rgba(120, 90, 220, 0.15);
        }
        .access-footer {
          margin: 20px 0 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          text-align: center;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .landing-nav { padding:16px 24px; }
          .nav-menu-label { display:none; }
          .nav-cta { display:none; }
          .nav-logo { height:36px; }
          .nav-dropdown { left:24px; top:64px; }
          .hero-title { font-size:clamp(36px, 10vw, 42px); letter-spacing:clamp(10px, 3vw, 14px); }
          .hero-cta { padding:14px 36px; font-size:11px; }
          .scroll-indicator { display:none; }
          .cin-headline { font-size:clamp(24px, 6vw, 28px); }
          .text-bl { left:32px; right:32px; bottom:64px; }
          .navigator-glow { width:240px; height:240px; }
          .navigator-sapling svg { width:80px; height:160px; }
          .navigator-message { max-width:90vw; padding:24px 28px; }
          .navigator-message-text { font-size:14px; }
          .access-card { margin:0 20px; padding:36px 28px; }
          .access-title { font-size:28px; margin-bottom:24px; }
        }
      `}</style>
    </div>
  );
}
