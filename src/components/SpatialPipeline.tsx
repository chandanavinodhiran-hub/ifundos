"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Stage {
  label: string;
  count: number;
  xPercent: number;
  width: number;
}

/** Application data shape coming from the API / parent component */
export interface PipelineApplication {
  id: string;
  name: string;
  score: number | null;
  stage:
    | "published"
    | "applications"
    | "ai_scored"
    | "shortlisted"
    | "interview"
    | "awarded";
  status: "active" | "recommended" | "caution" | "rejected";
  grantAmount: number; // SAR — determines particle size
}

interface Particle {
  id: string;
  applicationName: string;
  score: number | null;
  stage: number;
  t: number;
  offsetY: number;
  speed: number;
  radius: number;
  phase: number;
  status: "active" | "recommended" | "caution" | "rejected";
}

export interface SpatialPipelineProps {
  applications: PipelineApplication[];
  fundName: string;
  fundBudget: number; // total SAR
  onApplicationClick: (id: string) => void;
}

interface HoverInfo {
  particle: Particle;
  x: number;
  y: number;
}

/* ── Layer 4: Micro-particle type ──────────────────────────────────── */
interface MicroParticle {
  t: number;
  offsetY: number;
  speed: number;
  alpha: number;
  radius: number;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const STAGES_DEF: Omit<Stage, "count">[] = [
  { label: "PUBLISHED",    xPercent: 0.06, width: 140 },
  { label: "APPLICATIONS", xPercent: 0.20, width: 125 },
  { label: "AI SCORED",    xPercent: 0.40, width: 36  },
  { label: "SHORTLISTED",  xPercent: 0.58, width: 70  },
  { label: "INTERVIEW",    xPercent: 0.78, width: 110 },
  { label: "AWARDED",      xPercent: 0.94, width: 140 },
];

const STAGE_MAP: Record<PipelineApplication["stage"], number> = {
  published: 0,
  applications: 1,
  ai_scored: 2,
  shortlisted: 3,
  interview: 4,
  awarded: 5,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Deterministic hash for consistent random values per application */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getStatusColor(status: Particle["status"], alpha: number): string {
  switch (status) {
    case "recommended": return `rgba(72, 181, 170, ${alpha})`;
    case "caution":     return `rgba(184, 148, 63, ${alpha})`;
    case "rejected":    return `rgba(180, 90, 90, ${alpha})`;
    case "active":      return `rgba(58, 124, 195, ${alpha})`;
    default:            return `rgba(58, 124, 195, ${alpha})`;
  }
}

function getWetStatusColor(status: Particle["status"]): string {
  switch (status) {
    case "recommended": return "rgba(60, 135, 110, 0.80)";
    case "caution":     return "rgba(165, 145, 70, 0.75)";
    case "rejected":    return "rgba(150, 90, 90, 0.40)";
    case "active":      return "rgba(70, 115, 170, 0.80)";
    default:            return "rgba(70, 115, 170, 0.80)";
  }
}

/** Solid status color for tooltip text */
function getStatusSolid(status: Particle["status"]): string {
  switch (status) {
    case "recommended": return "#3A8A6A";
    case "caution":     return "#9B8C41";
    case "rejected":    return "#8C5A5A";
    case "active":      return "#4A6FA5";
    default:            return "#4A6FA5";
  }
}

/** Status background tint for tooltip pill */
function getStatusBg(status: Particle["status"]): string {
  switch (status) {
    case "recommended": return "rgba(58, 138, 106, 0.1)";
    case "caution":     return "rgba(155, 140, 65, 0.1)";
    case "rejected":    return "rgba(140, 90, 90, 0.1)";
    case "active":      return "rgba(74, 111, 165, 0.1)";
    default:            return "rgba(74, 111, 165, 0.1)";
  }
}

/** Gradient color for flow lines & micro-particles */
function _getRiverGradientColor(t: number, alpha: number): string {
  const r = Math.round(58 + (72 - 58) * t);
  const g = Math.round(124 + (181 - 124) * t);
  const b = Math.round(195 + (170 - 195) * t);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
void _getRiverGradientColor;

/** Format SAR budget for display */
function formatBudget(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B SAR`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function SpatialPipeline({
  applications,
  fundName,
  fundBudget,
  onApplicationClick,
}: SpatialPipelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const particlePosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  /* Tooltip state — only updates on hover CHANGE (not every frame) */
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  /* ── Layer 4: Micro-particles ref (initialized once) ──────────── */
  const microParticlesRef = useRef<MicroParticle[]>(
    Array.from({ length: 30 }, () => ({
      t: Math.random(),
      offsetY: (Math.random() - 0.5) * 0.6,
      speed: 0.001 + Math.random() * 0.003,
      alpha: 0.08,
      radius: 1 + Math.random(),
    }))
  );

  /* ── Layer 5: Convert applications → particles (deterministic) ── */
  const particles: Particle[] = useMemo(() => {
    return applications.map((app) => {
      const h = hashCode(app.id);
      return {
        id: app.id,
        applicationName: app.name,
        score: app.score,
        stage: STAGE_MAP[app.stage],
        t: 0,
        offsetY: ((h % 100) / 100 - 0.5) * 0.7,
        speed: 0.15 + ((h % 50) / 50) * 0.25,
        radius: Math.max(6, Math.min(12, 6 + (app.grantAmount / Math.max(fundBudget, 1)) * 60)),
        phase: (h % 628) / 100,
        status: app.status,
      };
    });
  }, [applications, fundBudget]);

  /* ── Dynamic stage counts from real data ─────────────────────── */
  const stageCounts = useMemo(() => {
    const counts = new Array(STAGES_DEF.length).fill(0);
    applications.forEach((app) => {
      if (app.status !== "rejected") {
        counts[STAGE_MAP[app.stage]]++;
      }
    });
    return counts;
  }, [applications]);

  const STAGES: Stage[] = STAGES_DEF.map((def, i) => ({
    ...def,
    count: stageCounts[i],
  }));

  /* ── River width interpolation (full width at edges) ─────────── */
  function getRiverHalfWidth(t: number): number {
    // Before first stage → use first stage width
    if (t <= STAGES[0].xPercent) return STAGES[0].width / 2;
    // After last stage → use last stage width
    if (t >= STAGES[STAGES.length - 1].xPercent) return STAGES[STAGES.length - 1].width / 2;

    for (let s = 0; s < STAGES.length - 1; s++) {
      if (t >= STAGES[s].xPercent && t <= STAGES[s + 1].xPercent) {
        const localT =
          (t - STAGES[s].xPercent) /
          (STAGES[s + 1].xPercent - STAGES[s].xPercent);
        const smooth = localT * localT * (3 - 2 * localT);
        return (STAGES[s].width + (STAGES[s + 1].width - STAGES[s].width) * smooth) / 2;
      }
    }
    return STAGES[0].width / 2;
  }

  /* ── Mouse handlers ────────────────────────────────────────────── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredRef.current = null;
    setHoverInfo(null);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredRef.current) {
      onApplicationClick(hoveredRef.current);
    }
  }, [onApplicationClick]);

  /* FIX 2: Track canvas readiness for fade-in */
  const [canvasReady, setCanvasReady] = useState(false);

  /* ── Animation loop (FIX 2: deferred via double-rAF) ───────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let cancelled = false;

    const draw = () => {
      time += 0.016;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const W = rect.width;
      const H = rect.height;
      const centerY = H * 0.62;
      const padLeft = 0;
      const padRight = 0;
      const labelInset = 24; // text inset from edges
      const riverLen = W - padLeft - padRight;

      /* ── Bank points ───────────────────────────────────────────── */
      const numPts = 200;
      const topBank: [number, number][] = [];
      const bottomBank: [number, number][] = [];

      for (let i = 0; i <= numPts; i++) {
        const t = i / numPts;
        const x = padLeft + t * riverLen;
        const hw = getRiverHalfWidth(t);
        const wobble =
          Math.sin(t * Math.PI * 6) * 3 + Math.sin(t * Math.PI * 10) * 1.5;
        topBank.push([x, centerY - hw + wobble]);
        bottomBank.push([x, centerY + hw - wobble]);
      }

      /* ── Path helpers ──────────────────────────────────────────── */
      const traceRiver = () => {
        ctx.beginPath();
        ctx.moveTo(topBank[0][0], topBank[0][1]);
        for (let i = 1; i < topBank.length; i++) {
          const p = topBank[i - 1], c = topBank[i];
          ctx.quadraticCurveTo(p[0], p[1], (p[0] + c[0]) / 2, (p[1] + c[1]) / 2);
        }
        const lt = topBank[topBank.length - 1];
        ctx.lineTo(lt[0], lt[1]);
        const lb = bottomBank[bottomBank.length - 1];
        ctx.lineTo(lb[0], lb[1]);
        for (let i = bottomBank.length - 2; i >= 0; i--) {
          const p = bottomBank[i + 1], c = bottomBank[i];
          ctx.quadraticCurveTo(p[0], p[1], (p[0] + c[0]) / 2, (p[1] + c[1]) / 2);
        }
        ctx.closePath();
      };

      const traceTop = () => {
        ctx.beginPath();
        ctx.moveTo(topBank[0][0], topBank[0][1]);
        for (let i = 1; i < topBank.length; i++) {
          const p = topBank[i - 1], c = topBank[i];
          ctx.quadraticCurveTo(p[0], p[1], (p[0] + c[0]) / 2, (p[1] + c[1]) / 2);
        }
      };

      const traceBottom = () => {
        ctx.beginPath();
        ctx.moveTo(bottomBank[0][0], bottomBank[0][1]);
        for (let i = 1; i < bottomBank.length; i++) {
          const p = bottomBank[i - 1], c = bottomBank[i];
          ctx.quadraticCurveTo(p[0], p[1], (p[0] + c[0]) / 2, (p[1] + c[1]) / 2);
        }
      };

      /* ═══════════════════════════════════════════════════════════════
         PHASE 1 — OPAQUE WATER BASE + CAUSTICS + FLOW LINES + MICRO
         ═══════════════════════════════════════════════════════════════ */
      ctx.clearRect(0, 0, W, H);

      ctx.save();
      traceRiver();
      ctx.clip();

      /* ── River base: pale edges → vibrant teal center — bright, magical ── */
      const solidBase = ctx.createLinearGradient(
        padLeft, centerY - 80, padLeft, centerY + 80
      );
      solidBase.addColorStop(0,    "rgba(200, 230, 238, 0.90)");
      solidBase.addColorStop(0.18, "rgba(165, 220, 232, 0.88)");
      solidBase.addColorStop(0.38, "rgba(130, 210, 225, 0.85)");
      solidBase.addColorStop(0.50, "rgba(120, 205, 222, 0.85)");
      solidBase.addColorStop(0.62, "rgba(130, 210, 225, 0.85)");
      solidBase.addColorStop(0.82, "rgba(165, 220, 232, 0.88)");
      solidBase.addColorStop(1,    "rgba(200, 230, 238, 0.90)");
      ctx.fillStyle = solidBase;
      ctx.fill();

      /* ── Bottleneck LUMINANCE — energy concentrating at the narrows ── */
      const bottleneckGlow = ctx.createLinearGradient(padLeft, 0, W - padRight, 0);
      bottleneckGlow.addColorStop(0,    "rgba(0, 0, 0, 0)");
      bottleneckGlow.addColorStop(0.28, "rgba(0, 0, 0, 0)");
      bottleneckGlow.addColorStop(0.34, "rgba(180, 240, 250, 0.08)");
      bottleneckGlow.addColorStop(0.40, "rgba(180, 240, 250, 0.15)");
      bottleneckGlow.addColorStop(0.46, "rgba(180, 240, 250, 0.08)");
      bottleneckGlow.addColorStop(0.52, "rgba(0, 0, 0, 0)");
      bottleneckGlow.addColorStop(1,    "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bottleneckGlow;
      ctx.fill();

      /* ── Edge feather — soft blend into card background ── */
      const feather = ctx.createLinearGradient(
        padLeft, centerY - 80, padLeft, centerY + 80
      );
      feather.addColorStop(0,    "rgba(237, 240, 245, 0.40)");
      feather.addColorStop(0.06, "rgba(237, 240, 245, 0)");
      feather.addColorStop(0.94, "rgba(237, 240, 245, 0)");
      feather.addColorStop(1,    "rgba(237, 240, 245, 0.40)");
      ctx.fillStyle = feather;
      ctx.fill();

      /* ── Caustic blobs — white on teal, 25-60px ── */
      /* Wide sections: α 0.10-0.16 · Bottleneck: α 0.20-0.25, larger, more luminous */
      for (let c = 0; c < 35; c++) {
        const cxT = (c / 35 + time * 0.018 + Math.sin(c * 1.7) * 0.08) % 1.0;
        const cyR = 0.3 + Math.sin(time * 0.5 + c * 2.3) * 0.28;
        const cx = padLeft + cxT * riverLen;
        const hw = getRiverHalfWidth(cxT);
        const cy = centerY + (cyR - 0.5) * hw * 1.2;
        const inBottleneck = cxT > 0.30 && cxT < 0.50;
        const sz = inBottleneck
          ? 35 + Math.sin(time * 0.8 + c * 1.1) * 25  // 35-60px at bottleneck
          : 25 + Math.sin(time * 0.8 + c * 1.1) * 17; // 25-42px elsewhere
        let br = inBottleneck
          ? 0.20 + Math.sin(time * 1.5 + c * 2.7) * 0.025 // α 0.175-0.225
          : 0.10 + Math.sin(time * 1.5 + c * 2.7) * 0.03; // α 0.07-0.13
        br = Math.min(br, 0.26);
        if (br > 0.03) {
          const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz);
          cg.addColorStop(0,   `rgba(255, 255, 255, ${br})`);
          cg.addColorStop(0.35, `rgba(220, 248, 255, ${br * 0.5})`);
          cg.addColorStop(1,   "rgba(220, 248, 255, 0)");
          ctx.fillStyle = cg;
          ctx.fillRect(cx - sz, cy - sz, sz * 2, sz * 2);
        }
      }

      /* ── Bottleneck center-line glow — bioluminescent energy concentration ── */
      {
        const bnLeft  = padLeft + 0.30 * riverLen;
        const bnRight = padLeft + 0.50 * riverLen;
        const bnMid   = (bnLeft + bnRight) / 2;
        const bnHalf  = (bnRight - bnLeft) / 2;
        const pulseA  = 0.10 + Math.sin(time * 1.2) * 0.05;
        const glowG   = ctx.createRadialGradient(
          bnMid, centerY, 0, bnMid, centerY, bnHalf * 1.2
        );
        glowG.addColorStop(0,   `rgba(180, 240, 250, ${pulseA})`);
        glowG.addColorStop(0.5, `rgba(180, 240, 250, ${pulseA * 0.4})`);
        glowG.addColorStop(1,   "rgba(180, 240, 250, 0)");
        ctx.fillStyle = glowG;
        ctx.fillRect(bnLeft - 20, centerY - 30, bnRight - bnLeft + 40, 60);
      }

      /* ── Layer 4: Flow lines — 7 white lines, 0.12-0.18 opacity, ~35px/s ── */
      const numFlowLines = 7;
      const flowPts = 140;
      for (let f = 0; f < numFlowLines; f++) {
        const lineOffset = (f - (numFlowLines - 1) / 2) * 10;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= flowPts; i++) {
          const t = i / flowPts;
          const x = padLeft + t * riverLen;
          const hw = getRiverHalfWidth(t);
          if (Math.abs(lineOffset) > hw * 0.65) continue;
          // Layered sine waves moving left-to-right (~35 px/s)
          const w1 = Math.sin(t * Math.PI * 3.5 - time * 1.3 + f * 0.9) * 4;
          const w2 = Math.sin(t * Math.PI * 6   - time * 1.8 + f * 2.1) * 1.8;
          const w3 = Math.sin(t * Math.PI * 11  - time * 0.7 + f * 3.4) * 0.7;
          const y = centerY + lineOffset + w1 + w2 + w3;
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
        const dist = Math.abs(f - 3) / 3;  // 0 at center, 1 at edges
        const flowAlpha = 0.15 + Math.sin(time * 0.25 + f * 1.1) * 0.03 - dist * 0.04;
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(flowAlpha, 0.10)})`;
        ctx.lineWidth = 1.0 - dist * 0.3;
        ctx.stroke();
      }

      /* ── Layer 4: 30 micro dust particles — white, 1-2px, drifting with current ── */
      microParticlesRef.current.forEach((mp) => {
        mp.t += mp.speed;
        if (mp.t > 1.05) {
          mp.t = -0.05;
          mp.offsetY = (Math.random() - 0.5) * 0.6;
        }
        const mpX = padLeft + mp.t * riverLen;
        const hw = getRiverHalfWidth(Math.max(0, Math.min(1, mp.t)));
        const mpY = centerY + mp.offsetY * hw;
        ctx.beginPath();
        ctx.arc(mpX, mpY, mp.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${mp.alpha})`;
        ctx.fill();
      });

      ctx.restore(); // end Phase 1 clip

      /* ═══════════════════════════════════════════════════════════════
         PHASE 1b — EMPTY STATE (if no applications)
         ═══════════════════════════════════════════════════════════════ */
      if (particles.length === 0) {
        ctx.font = '400 14px "DM Sans", sans-serif';
        ctx.fillStyle = "rgba(30, 34, 48, 0.3)";
        ctx.textAlign = "center";
        ctx.fillText("No applications yet", W / 2, centerY - 4);
        ctx.font = '400 11px "DM Sans", sans-serif';
        ctx.fillStyle = "rgba(30, 34, 48, 0.2)";
        ctx.fillText(
          "Applications will appear as particles flowing through the pipeline",
          W / 2,
          centerY + 16
        );
      }

      /* ═══════════════════════════════════════════════════════════════
         PHASE 2 — SUBMERGED PARTICLES + HIT DETECTION
         ═══════════════════════════════════════════════════════════════ */
      const mouse = mouseRef.current;
      let newHovered: string | null = null;
      let newHoverPos: { x: number; y: number } | null = null;

      particles.forEach((p) => {
        const stageStart = STAGES[p.stage].xPercent;
        const stageEnd =
          p.stage < STAGES.length - 1
            ? STAGES[p.stage + 1].xPercent
            : 1.0;
        const stageMiddle = (stageStart + stageEnd) / 2;
        const currentT = stageMiddle + Math.sin(time * p.speed + p.phase) * 0.015;

        const px = padLeft + currentT * riverLen;
        const hw = getRiverHalfWidth(currentT);
        const bob = Math.sin(time * 1.5 + p.phase) * 2;

        const isRejected = p.status === "rejected";
        let py: number;
        if (isRejected) {
          const edgeDir = p.offsetY > 0 ? 1 : -1;
          py = centerY + edgeDir * hw * 0.85 + bob;
        } else {
          py = centerY + p.offsetY * hw + bob;
        }

        const drawR = p.radius;

        // Store position for tooltip
        particlePosRef.current.set(p.id, { x: px, y: py });

        // Hit-test
        if (mouse) {
          const dx = mouse.x - px, dy = mouse.y - py;
          if (dx * dx + dy * dy < (drawR + 6) * (drawR + 6)) {
            newHovered = p.id;
            newHoverPos = { x: px, y: py };
          }
        }

        const isHovered = hoveredRef.current === p.id;

        /* ── REJECTED — faded + X mark, drifting to bank edge ───── */
        if (isRejected && !isHovered) {
          const fadeAlpha = 0.30 + Math.sin(time * 0.5 + p.phase) * 0.08;

          // Blurred shadow on riverbed
          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.14)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 6;
          ctx.beginPath();
          ctx.arc(px, py, drawR * 0.85, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
          ctx.fill();
          ctx.restore();

          // Faded particle body
          ctx.beginPath();
          ctx.arc(px, py, drawR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 90, 90, ${fadeAlpha})`;
          ctx.fill();

          // Wet-edge stroke
          ctx.beginPath();
          ctx.arc(px, py, drawR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(20, 55, 80, ${0.12 * fadeAlpha / 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Teal water tint
          ctx.beginPath();
          ctx.arc(px, py, drawR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 170, 195, ${0.08 * fadeAlpha / 0.3})`;
          ctx.fill();

          // Small X mark
          const crossSize = drawR * 0.4;
          ctx.beginPath();
          ctx.moveTo(px - crossSize, py - crossSize);
          ctx.lineTo(px + crossSize, py + crossSize);
          ctx.moveTo(px + crossSize, py - crossSize);
          ctx.lineTo(px - crossSize, py + crossSize);
          ctx.strokeStyle = `rgba(255, 255, 255, ${fadeAlpha * 0.6})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          return;
        }

        if (isHovered) {
          /* ── HOVERED: rising to surface — strong water ripples ── */

          // Large soft glow underneath everything
          ctx.beginPath();
          ctx.arc(px, py, drawR + 35, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.fill();

          // 5 expanding white ripple rings — thick and bright
          for (let r = 0; r < 5; r++) {
            const ripR = drawR + 10 + r * 12 + Math.sin(time * 3 + r * 0.5) * 4;
            const ripAlpha = 0.7 - r * 0.12;
            ctx.beginPath();
            ctx.arc(px, py, ripR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${ripAlpha})`;
            ctx.lineWidth = 2.5 - r * 0.3;
            ctx.stroke();
          }

          // Bright inner glow (rising to surface)
          ctx.beginPath();
          ctx.arc(px, py, drawR + 6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
          ctx.fill();

          // Main particle (brighter, slightly larger)
          ctx.beginPath();
          ctx.arc(px, py, drawR + 2, 0, Math.PI * 2);
          ctx.fillStyle = getStatusColor(p.status, 1);
          ctx.fill();

          // Strong specular highlight
          ctx.beginPath();
          ctx.arc(px - drawR * 0.2, py - drawR * 0.2, drawR * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fill();

        } else {
          /* ── SUBMERGED: wet stone with shadow, stroke, top-light ── */

          /* AI SCORED (stage 2): subtle pulsing WHITE glow */
          if (p.stage === 2) {
            const pulseAlpha = 0.12 + Math.sin(time * 2.5 + p.phase) * 0.08;
            const pulseRadius = drawR + 8 + Math.sin(time * 2.5 + p.phase) * 4;
            ctx.beginPath();
            ctx.arc(px, py, pulseRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(pulseAlpha, 0.04)})`;
            ctx.fill();
          }

          /* Shadow on riverbed — +3px right, +6px down, slightly blurred */
          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
          ctx.shadowBlur = 5;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 6;
          ctx.beginPath();
          ctx.arc(px, py, drawR * 0.85, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
          ctx.fill();
          ctx.restore();

          /* Main particle body (wet stone) */
          ctx.beginPath();
          ctx.arc(px, py, drawR, 0, Math.PI * 2);
          ctx.fillStyle = getWetStatusColor(p.status);
          ctx.fill();

          /* Dark wet-edge stroke — rgba(20, 55, 80, 0.18), 1px */
          ctx.beginPath();
          ctx.arc(px, py, drawR, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(20, 55, 80, 0.18)";
          ctx.lineWidth = 1;
          ctx.stroke();

          /* Water tint overlay */
          ctx.beginPath();
          ctx.arc(px, py, drawR, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(100, 170, 195, 0.10)";
          ctx.fill();

          /* Caustic shimmer */
          const causticP = Math.sin(time * 1.8 + p.phase * 3) * 0.5 + 0.5;
          if (causticP > 0.3) {
            ctx.beginPath();
            ctx.arc(
              px - drawR * 0.2 + Math.sin(time * 0.7 + p.phase) * drawR * 0.15,
              py - drawR * 0.25 + Math.cos(time * 0.5 + p.phase) * drawR * 0.1,
              drawR * 0.45,
              0, Math.PI * 2
            );
            ctx.fillStyle = `rgba(255, 255, 255, ${causticP * 0.22})`;
            ctx.fill();
          }

          /* Soft underwater top-light — rgba(200, 235, 250, 0.2) on upper portion */
          ctx.beginPath();
          ctx.arc(px - drawR * 0.15, py - drawR * 0.18, drawR * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(200, 235, 250, 0.20)";
          ctx.fill();
        }
      });

      // Update hover state ONLY when it changes (not every frame)
      if (newHovered !== hoveredRef.current) {
        hoveredRef.current = newHovered;
        if (newHovered && newHoverPos) {
          const p = particles.find(pp => pp.id === newHovered)!;
          const hp = newHoverPos as { x: number; y: number };
          setHoverInfo({ particle: p, x: hp.x, y: hp.y });
        } else {
          setHoverInfo(null);
        }
      } else if (newHovered && newHoverPos) {
        const hp = newHoverPos as { x: number; y: number };
        particlePosRef.current.set(newHovered, hp);
      }

      /* ═══════════════════════════════════════════════════════════════
         PHASE 3 — WATER SURFACE EFFECTS
         ═══════════════════════════════════════════════════════════════ */
      ctx.save();
      traceRiver();
      ctx.clip();

      ctx.fillStyle = "rgba(160, 210, 225, 0.04)";
      ctx.fill();

      /* ── Surface flow lines — white current lines, α 0.12-0.18 ── */
      const linePts = 140;
      for (let c = 0; c < 7; c++) {
        const ratio = (c + 1) / 8;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= linePts; i++) {
          const t = i / linePts;
          const x = padLeft + t * riverLen;
          const hw = getRiverHalfWidth(t);
          const yOff = (ratio - 0.5) * 2 * hw * 0.65;
          const w1 = Math.sin(t * Math.PI * 3   - time * 1.4 + c * 0.9) * 3.5;
          const w2 = Math.sin(t * Math.PI * 5.5 - time * 1.9 + c * 1.7) * 1.5;
          const w3 = Math.sin(t * Math.PI * 10  - time * 0.8 + c * 3.1) * 0.6;
          const y = centerY + yOff + w1 + w2 + w3;
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
        const dist = Math.abs(ratio - 0.5) * 2;
        const alpha = 0.14 - dist * 0.05 + Math.sin(time * 0.3 + c) * 0.02;
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(alpha, 0.08)})`;
        ctx.lineWidth = 1.2 - dist * 0.4;
        ctx.stroke();
      }

      /* ── 20 shimmer glints — clustered denser at bottleneck ── */
      for (let s = 0; s < 20; s++) {
        // Bias distribution toward bottleneck (0.30-0.50)
        let rawT = ((s / 20) + time * 0.02 + Math.sin(s * 2.1) * 0.04) % 1.0;
        // Every 3rd glint is pulled toward bottleneck zone
        if (s % 3 === 0) {
          rawT = 0.30 + (rawT * 0.20); // confine to 0.30-0.50
        }
        const sT = rawT;
        const hw = getRiverHalfWidth(sT);
        const sx = padLeft + sT * riverLen;
        const sy = centerY + Math.sin(time * 0.5 + s * 1.8) * hw * 0.35;

        const fadePeriod = 2.0 + (s % 5) * 0.5;
        const fadePhase = s * 1.73 + 0.5;
        const fade = Math.max(0, Math.sin(time * (Math.PI / fadePeriod) + fadePhase));
        if (fade < 0.05) continue;

        const inBn = sT > 0.28 && sT < 0.52;
        const gW = inBn ? 4 + (s % 4) : 3 + (s % 4);     // slightly larger at bottleneck
        const gH = 1 + (s % 2) * 0.5;
        const glintAlpha = fade * (inBn ? 0.45 : 0.35);    // brighter at bottleneck

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(Math.sin(time * 0.15 + s) * 0.12);

        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, gW * 2);
        glow.addColorStop(0, `rgba(255, 255, 255, ${glintAlpha * 0.5})`);
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(-gW * 2, -gW * 2, gW * 4, gW * 4);

        ctx.beginPath();
        ctx.ellipse(0, 0, gW, gH, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha})`;
        ctx.fill();

        ctx.restore();
      }

      /* ── Top bank highlight — bright edge catching light ── */
      traceTop();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.50)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      /* ── Outer top bank edge glow — surface light catch ── */
      traceTop();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 3;
      ctx.stroke();

      /* ── Bottom bank soft shadow ── */
      traceBottom();
      ctx.strokeStyle = "rgba(20, 80, 110, 0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* ═══════════════════════════════════════════════════════════════
         PHASE 4 — STAGE MARKERS + HEADER
         ═══════════════════════════════════════════════════════════════ */
      STAGES.forEach((stage) => {
        const x = padLeft + stage.xPercent * riverLen;
        const labelY = centerY - 90;

        // Subtle dashed vertical guide line
        ctx.beginPath();
        ctx.setLineDash([3, 4]);
        ctx.moveTo(x, labelY + 6);
        ctx.lineTo(x, centerY + 80);
        ctx.strokeStyle = "rgba(58, 124, 195, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // Stage label
        ctx.font = '600 11px "DM Sans", sans-serif';
        ctx.letterSpacing = "1.5px";
        ctx.fillStyle = stage.count > 0
          ? "rgba(30, 34, 53, 0.6)"
          : "rgba(30, 34, 53, 0.35)";
        ctx.textAlign = "center";
        ctx.fillText(stage.label, x, labelY);
        ctx.letterSpacing = "0px";

      });

      ctx.font = '600 12px "DM Sans", sans-serif';
      ctx.letterSpacing = "3px";
      ctx.fillStyle = "rgba(30, 34, 53, 0.55)";
      ctx.textAlign = "left";
      ctx.fillText("PIPELINE", labelInset, 20);
      ctx.letterSpacing = "0px";

      if (fundName) {
        ctx.font = '500 14px "DM Sans", sans-serif';
        ctx.fillStyle = "rgba(30, 34, 53, 0.6)";
        ctx.textAlign = "right";
        ctx.fillText(fundName, W - labelInset, 19);
      }
      if (fundBudget > 0) {
        ctx.font = '400 12px "JetBrains Mono", monospace';
        ctx.fillStyle = "rgba(30, 34, 53, 0.4)";
        ctx.textAlign = "right";
        ctx.fillText(formatBudget(fundBudget), W - labelInset, 35);
      }

      canvas.style.cursor = hoveredRef.current ? "pointer" : "default";
      animId = requestAnimationFrame(draw);
    };

    /* FIX 2: Defer canvas init 2 frames after mount so first paint isn't blocked */
    const startId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          draw();
          setCanvasReady(true);
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(startId);
      cancelAnimationFrame(animId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particles, fundName, fundBudget]);

  /* ── Tooltip position: above or below particle ─────────────────── */
  const tooltipPos = hoverInfo
    ? particlePosRef.current.get(hoverInfo.particle.id) ?? { x: hoverInfo.x, y: hoverInfo.y }
    : null;
  const showAbove = tooltipPos ? tooltipPos.y > 80 : true;

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div
      className="pipeline-container"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <div style={{ position: "relative", overflow: "visible" }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{
            width: "100%",
            height: "330px",
            display: "block",
            opacity: canvasReady ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        />

        {/* ── Frosted Glass Tooltip ────────────────────────────────── */}
        {hoverInfo && tooltipPos && (
          <div
            style={{
              position: "absolute",
              left: tooltipPos.x,
              top: showAbove ? tooltipPos.y - 100 : tooltipPos.y + 28,
              transform: "translateX(-50%)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: 16,
                padding: "14px 18px",
                minWidth: 190,
                border: "1px solid rgba(120, 185, 210, 0.25)",
                boxShadow:
                  "0 8px 32px rgba(60, 130, 170, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
              }}
            >
              {/* Application name */}
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1E2235",
                  marginBottom: 8,
                  whiteSpace: "nowrap",
                }}
              >
                {hoverInfo.particle.applicationName}
              </div>

              {/* Score + Status */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {hoverInfo.particle.score !== null ? (
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 24,
                      fontWeight: 300,
                      color: getStatusSolid(hoverInfo.particle.status),
                    }}
                  >
                    {hoverInfo.particle.score}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(30, 34, 53, 0.3)",
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Pending
                  </span>
                )}
                <span
                  style={{
                    fontSize: 8,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: getStatusSolid(hoverInfo.particle.status),
                    marginLeft: "auto",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: getStatusBg(hoverInfo.particle.status),
                  }}
                >
                  {hoverInfo.particle.status}
                </span>
              </div>

              {/* Stage label */}
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(30, 34, 53, 0.35)",
                  marginTop: 8,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {STAGES[hoverInfo.particle.stage].label}
              </div>
            </div>

            {/* Arrow — frosted glass to match */}
            <div
              style={{
                position: "absolute",
                ...(showAbove ? { bottom: -6 } : { top: -6 }),
                left: "50%",
                transform: `translateX(-50%) rotate(${showAbove ? 45 : 225}deg)`,
                width: 12,
                height: 12,
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRight: "1px solid rgba(120, 185, 210, 0.25)",
                borderBottom: "1px solid rgba(120, 185, 210, 0.25)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
