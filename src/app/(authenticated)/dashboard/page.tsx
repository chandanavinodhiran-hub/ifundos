"use client";

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  FileText,
  AlertTriangle,
  ChevronRight,
  X,
} from "lucide-react";
import { playClick } from "@/lib/sounds";
import DynamicShadowCard from "@/components/DynamicShadowCard";
import type { PipelineApplication } from "@/components/SpatialPipeline";

/* FIX 5: Lazy load heavy canvas components */
const SpatialPipeline = lazy(() => import("@/components/SpatialPipeline"));
const LivingIcon = lazy(() =>
  import("@/components/ui/living-icons").then((m) => ({ default: m.LivingIcon }))
);

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Program {
  id: string; name: string; budgetTotal: number; budgetAllocated: number; budgetDisbursed: number; status: string;
}

interface RFPPipeline {
  id: string; title: string; status: string;
  applications: { status: string }[];
}

interface PipelineAppFromAPI {
  id: string;
  status: string;
  compositeScore: number | null;
  proposedBudget: number;
  organization: { name: string };
}

interface Stats {
  openRfps: number;
  applicationsInReview: number;
  activeGrants: number;
  totalDisbursed: number;
  atRiskProjects: number;
  programs: Program[];
  rfpPipelines?: RFPPipeline[];
  pipelineApplications?: PipelineAppFromAPI[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatSARParts(amount: number): { num: number; suffix: string } {
  if (amount === 0) return { num: 0, suffix: "" };
  if (amount >= 1_000_000_000) return { num: amount / 1_000_000_000, suffix: "B" };
  if (amount >= 1_000_000) return { num: amount / 1_000_000, suffix: "M" };
  if (amount >= 1_000) return { num: amount / 1_000, suffix: "K" };
  return { num: amount, suffix: "" };
}

/* ------------------------------------------------------------------ */
/* Map Prisma status → Pipeline stage + particle status                */
/* ------------------------------------------------------------------ */

function mapToPipelineApps(apps: PipelineAppFromAPI[]): PipelineApplication[] {
  return apps.map((app) => {
    // Map Prisma status string → pipeline stage
    let stage: PipelineApplication["stage"] = "applications";
    switch (app.status) {
      case "PUBLISHED":
        stage = "published";
        break;
      case "SUBMITTED":
        stage = "applications";
        break;
      case "SCORING":
      case "IN_REVIEW":
        stage = "ai_scored";
        break;
      case "SHORTLISTED":
      case "QUESTIONNAIRE_PENDING":
      case "QUESTIONNAIRE_SUBMITTED":
        stage = "shortlisted";
        break;
      case "INTERVIEW":
        stage = "interview";
        break;
      case "APPROVED":
        stage = "awarded";
        break;
      case "REJECTED":
        stage = "ai_scored"; // rejected stays in the stage where they were rejected
        break;
      default:
        stage = "applications";
    }

    // Map score + status → particle status
    let status: PipelineApplication["status"] = "active";
    if (app.status === "REJECTED") {
      status = "rejected";
    } else if (app.compositeScore !== null) {
      if (app.compositeScore >= 75) status = "recommended";
      else if (app.compositeScore >= 50) status = "caution";
      else status = "rejected";
    }

    return {
      id: app.id,
      name: app.organization.name,
      score: app.compositeScore !== null ? Math.round(app.compositeScore) : null,
      stage,
      status,
      grantAmount: app.proposedBudget,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Pipeline stages                                                     */
/* ------------------------------------------------------------------ */

const _PIPELINE_STAGES = [
  { key: "rfps", label: "Published" },
  { key: "applications", label: "Applications" },
  { key: "scored", label: "AI Scored" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "grants", label: "Awarded" },
] as const;
void _PIPELINE_STAGES;

/* ------------------------------------------------------------------ */
/* Hover Card definitions                                              */
/* ------------------------------------------------------------------ */

const PIPELINE_HOVER: Record<string, { title: string; desc: string }> = {
  rfps: { title: "Published RFPs", desc: "Active requests for proposals open for contractor submissions." },
  applications: { title: "Applications", desc: "Proposals received from contractors, pending review or scoring." },
  scored: { title: "AI Scored", desc: "Applications evaluated by AI with composite confidence scores." },
  shortlisted: { title: "Shortlisted", desc: "Top candidates selected for further evaluation or interview." },
  interview: { title: "Interview", desc: "Shortlisted contractors invited for final assessment." },
  grants: { title: "Awarded", desc: "Approved grants with active disbursement milestones." },
};

function HoverCard({ target, position }: {
  target: string;
  position: { top: number; left: number };
}) {
  return (
    <div
      className="hover-card"
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -100%)",
        marginTop: -8,
      }}
    >
      {/* Content rendered based on target key */}
      {target === "disbursed" && (
        <>
          <p className="hover-card-title">Total Disbursed</p>
          <p>Total amount released to grantees across all active programs.</p>
        </>
      )}
      {target === "open-rfps" && (
        <>
          <p className="hover-card-title">Open RFPs</p>
          <p>Active requests for proposals currently accepting contractor applications.</p>
        </>
      )}
      {target === "in-review" && (
        <>
          <p className="hover-card-title">In Review</p>
          <p>Applications being evaluated by AI and awaiting fund manager decision.</p>
        </>
      )}
      {target === "grants" && (
        <>
          <p className="hover-card-title">Active Grants</p>
          <p>Grants with disbursement milestones currently in progress.</p>
        </>
      )}
      {PIPELINE_HOVER[target] && !["disbursed", "open-rfps", "in-review", "grants"].includes(target) && (
        <>
          <p className="hover-card-title">{PIPELINE_HOVER[target].title}</p>
          <p>{PIPELINE_HOVER[target].desc}</p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton Components (FIX 1: Render instantly, match real layout)     */
/* ------------------------------------------------------------------ */

function PipelineSkeleton() {
  return (
    <div className="skeleton-card" style={{ height: 330, padding: "24px" }}>
      <div className="skeleton-bar h-2 w-20 mb-5" style={{ opacity: 0.4 }} />
      <div style={{ height: 140 }} />
      <div className="flex items-center justify-between px-4 mt-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="skeleton-circle w-6 h-6" />
            <div className="skeleton-bar h-2 w-10" style={{ opacity: 0.3 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="skeleton-card" style={{ height: 110, padding: "20px 24px" }}>
      <div className="skeleton-bar h-2 w-16 mb-4" style={{ opacity: 0.4 }} />
      <div className="skeleton-bar h-8 w-20 mb-2" style={{ opacity: 0.5 }} />
      <div className="skeleton-bar h-2 w-12" style={{ opacity: 0.3 }} />
    </div>
  );
}

function CTASkeleton() {
  return (
    <div className="skeleton-card" style={{ height: 72, padding: "16px 20px" }}>
      <div className="flex items-center gap-4">
        <div className="skeleton-circle w-10 h-10 shrink-0" />
        <div className="flex-1">
          <div className="skeleton-bar h-3 w-48 mb-2" style={{ opacity: 0.5 }} />
          <div className="skeleton-bar h-2 w-32" style={{ opacity: 0.3 }} />
        </div>
        <div className="skeleton-circle w-8 h-8 shrink-0" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LivingIcon fallback (static icon while canvas loads)                */
/* ------------------------------------------------------------------ */

function LivingIconFallback({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: "radial-gradient(circle at 50% 50%, rgba(130,215,228,0.7), rgba(175,230,238,0.55))",
        border: "0.5px solid rgba(150,215,225,0.3)",
        boxShadow: "inset 2px 2px 6px rgba(100,180,200,0.2), inset -2px -2px 6px rgba(255,255,255,0.3)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Draw briefing leaf — botanical style matching login canopy          */
/* ------------------------------------------------------------------ */

function drawBriefingLeaf(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const W = 32;
  const H = 36;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.scale(dpr, dpr);

  const cx = W / 2;
  const cy = H / 2 - 2;
  const lw = 12;
  const lh = 15;

  /* Leaf shape — teardrop bezier */
  ctx.beginPath();
  ctx.moveTo(cx, cy - lh);
  ctx.bezierCurveTo(cx + lw * 0.5, cy - lh * 0.85, cx + lw, cy - lh * 0.3, cx + lw * 0.85, cy + lh * 0.1);
  ctx.bezierCurveTo(cx + lw * 0.7, cy + lh * 0.45, cx + lw * 0.3, cy + lh * 0.75, cx, cy + lh);
  ctx.bezierCurveTo(cx - lw * 0.3, cy + lh * 0.75, cx - lw * 0.7, cy + lh * 0.45, cx - lw * 0.85, cy + lh * 0.1);
  ctx.bezierCurveTo(cx - lw, cy - lh * 0.3, cx - lw * 0.5, cy - lh * 0.85, cx, cy - lh);
  ctx.closePath();

  /* Gradient fill */
  const grad = ctx.createLinearGradient(cx - lw, cy - lh * 0.5, cx + lw, cy + lh * 0.5);
  grad.addColorStop(0, "rgba(85, 170, 100, 0.90)");
  grad.addColorStop(0.4, "rgba(65, 145, 80, 0.88)");
  grad.addColorStop(1, "rgba(45, 120, 60, 0.92)");
  ctx.fillStyle = grad;
  ctx.fill();

  /* Edge stroke */
  ctx.strokeStyle = "rgba(30, 90, 45, 0.30)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  /* Central midrib */
  ctx.beginPath();
  ctx.moveTo(cx, cy - lh + 1);
  ctx.bezierCurveTo(cx + 0.3, cy - lh * 0.3, cx - 0.3, cy + lh * 0.3, cx, cy + lh - 1);
  ctx.strokeStyle = "rgba(40, 100, 55, 0.35)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  /* Secondary veins (3 pairs) */
  for (let i = 0; i < 3; i++) {
    const t = (i + 1) / 4;
    const vy = cy - lh + t * lh * 2;
    const leafW = lw * Math.sin(t * Math.PI) * 0.75;

    ctx.strokeStyle = "rgba(40, 100, 55, 0.15)";
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(cx, vy);
    ctx.bezierCurveTo(cx + leafW * 0.4, vy - 0.5, cx + leafW * 0.7, vy + 0.3, cx + leafW * 0.85, vy + 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, vy);
    ctx.bezierCurveTo(cx - leafW * 0.4, vy - 0.5, cx - leafW * 0.7, vy + 0.3, cx - leafW * 0.85, vy + 0.8);
    ctx.stroke();
  }

  /* Specular highlight */
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy - 3, 3.5, 2, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
  ctx.fill();

  /* Stem nub at bottom */
  ctx.beginPath();
  ctx.moveTo(cx - 0.5, cy + lh);
  ctx.lineTo(cx, cy + lh + 3);
  ctx.lineTo(cx + 0.5, cy + lh);
  ctx.strokeStyle = "rgba(65, 120, 70, 0.50)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function FundManagerDashboard() {
  /* FIX 4: Independent state for each data section */
  const [stats, setStats] = useState<Stats | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingClosing, setBriefingClosing] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [briefingRead, setBriefingRead] = useState(false);
  const briefingRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const briefingLeafRef = useRef<HTMLCanvasElement>(null);
  const briefingLeafDrawn = useRef(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  /* Draw briefing leaf canvas */
  useEffect(() => {
    if (briefingLeafRef.current && !briefingLeafDrawn.current) {
      drawBriefingLeaf(briefingLeafRef.current);
      briefingLeafDrawn.current = true;
    }
  }, []);

  /* Check if briefing was already read today */
  useEffect(() => {
    const lastRead = localStorage.getItem("briefing-read-date");
    const today = new Date().toDateString();
    if (lastRead === today) setBriefingRead(true);
  }, []);

  const BRIEFING_TEXT = "Good morning, Fatimah. You have 11 applications waiting for you today. Three of them have been sitting longer than your usual review cycle, so those might be worth looking at first. The standout is Tabuk Green Solutions \u2014 scored 91 and looks a lot like the last few projects you approved. Probably a quick yes. On the other end, Abha Cloud Seeding came in at 44 with some familiar red flags. That might be a quick no. Clear those two and you\u2019re down to 9, right on track for the quarter.";

  /* Hover card state — desktop only */
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number } | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHoverEnter = useCallback((key: string, el: HTMLElement) => {
    if (window.innerWidth < 1200) return;                // desktop only
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setHoverPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2,
      });
      setHoverTarget(key);
    }, 300);
  }, []);

  const handleHoverLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = null;
    setHoverTarget(null);
    setHoverPosition(null);
  }, []);

  /* ── Navigator Briefing: typewriter + audio voice ── */
  useEffect(() => {
    if (!briefingOpen || briefingClosing) return;
    setDisplayedText("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayedText(BRIEFING_TEXT.slice(0, i));
      if (i >= BRIEFING_TEXT.length) clearInterval(timer);
    }, 30);

    // Play ElevenLabs MP3 briefing audio
    const audio = new Audio("/navigator-briefing.mp3");
    audio.volume = 0.85;
    audio.play().catch(() => {/* autoplay may be blocked */});
    audioRef.current = audio;

    return () => {
      clearInterval(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [briefingOpen, briefingClosing, BRIEFING_TEXT]);

  const closeBriefing = useCallback(() => {
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setBriefingClosing(true);
    setTimeout(() => {
      setBriefingOpen(false);
      setBriefingClosing(false);
      setDisplayedText("");
    }, 150);
  }, []);

  useEffect(() => {
    if (!briefingOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (briefingRef.current && briefingRef.current.contains(target)) return;
      closeBriefing();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [briefingOpen, closeBriefing]);

  /* FIX 4: Fetch data and show content as it arrives — no artificial delays */
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {/* fail silently — skeleton remains */});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* Build decision feed items — urgency-sorted */
  const decisions: DecisionItem[] = [];

  if (stats && stats.applicationsInReview > 0) {
    decisions.push({
      id: "apps-review",
      icon: FileText,
      title: `${stats.applicationsInReview} application${stats.applicationsInReview !== 1 ? "s" : ""} awaiting decision`,
      subtitle: "Review and shortlist or reject",
      href: "/dashboard/applications",
      urgency: 1,
    });
  }

  if (stats && stats.atRiskProjects > 0) {
    decisions.push({
      id: "at-risk",
      icon: AlertTriangle,
      title: `${stats.atRiskProjects} grant${stats.atRiskProjects !== 1 ? "s" : ""} at risk`,
      subtitle: "Evidence overdue or milestones delayed",
      href: "/dashboard/grants",
      urgency: 0,
    });
  }

  decisions.sort((a, b) => a.urgency - b.urgency);

  const program = stats?.programs?.[0];
  const sarParts = stats ? formatSARParts(stats.totalDisbursed) : null;

  /* River fill percentages — proportional to max active stat value */
  const riverMax = stats ? Math.max(stats.openRfps, stats.applicationsInReview, stats.activeGrants, 1) : 1;
  const rfpFill = stats ? Math.max(0.15, Math.min(1, stats.openRfps / (riverMax * 1.1))) : 0;
  const reviewFill = stats ? Math.max(0.15, Math.min(1, stats.applicationsInReview / (riverMax * 1.1))) : 0;
  const grantsFill = stats ? Math.max(0.15, Math.min(1, stats.activeGrants / (riverMax * 1.1))) : 0;

  return (
    <>
    <div className="max-w-[1200px] mx-auto stagger-children page-enter">
      {/* ── Greeting — renders instantly, no data needed ────────── */}
      <div className="relative animate-in-1" style={{ paddingTop: 8, marginBottom: 20 }}>
        <div className="flex items-start justify-between">
          <div
            className="greeting-title"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 32,
              fontWeight: 300,
              color: "rgba(30, 34, 53, 0.85)",
            }}
          >
            {greeting}, Fatimah
          </div>
          {/* Navigator Briefing trigger — same animation as sapling */}
          <div className="relative group" style={{ marginTop: 4 }}>
            {/* Frosted glass tooltip — above leaf */}
            <span
              className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
              style={{
                padding: "6px 14px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "1px",
                color: "rgba(45, 100, 55, 0.85)",
                background: "rgba(255, 255, 255, 0.80)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(75, 160, 85, 0.15)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                zIndex: 10,
              }}
            >
              Daily Briefing
            </span>
            <div
              ref={triggerRef}
              onClick={() => {
                if (briefingOpen) { closeBriefing(); }
                else {
                  setBriefingOpen(true);
                  setBriefingRead(true);
                  localStorage.setItem("briefing-read-date", new Date().toDateString());
                }
              }}
              className="briefing-leaf-caller cursor-pointer relative"
              role="button"
              tabIndex={0}
              aria-label="Daily Briefing"
            >
              {/* Water ripple rings — concentric expanding circles */}
              {!briefingOpen && (
                <>
                  <div className="briefing-ripple briefing-ripple-1" />
                  <div className="briefing-ripple briefing-ripple-2" />
                  <div className="briefing-ripple briefing-ripple-3" />
                </>
              )}
              <div className="briefing-leaf-inner">
                <canvas
                  ref={briefingLeafRef}
                  style={{ display: "block", pointerEvents: "none" }}
                />
              </div>
              {/* Unread pulsing dot at stem base */}
              {!briefingRead && (
                <div
                  className="briefing-unread-dot"
                  style={{
                    position: "absolute",
                    bottom: 1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Decision CTA cards — show skeleton while loading ───── */}
      <div className="space-y-3 animate-in-2" style={{ marginBottom: 24 }}>
        {stats === null ? (
          /* Show 1 skeleton CTA placeholder while loading */
          <CTASkeleton />
        ) : (
          decisions.map((item) => {
            const isLivingIcon = item.id === "apps-review";
            return (
              <button
                key={item.id}
                onClick={() => { playClick(); router.push(item.href); }}
                className={`w-full text-left cursor-pointer neu-btn-press${isLivingIcon ? " cta-glow rounded-2xl" : ""}`}
              >
                <DynamicShadowCard className="neu-raised p-4 flex items-center gap-4" intensity={2}>
                  <div
                    className={`${isLivingIcon ? "" : "w-10 h-10"} rounded-[14px] flex items-center justify-center shrink-0 overflow-hidden`}
                    style={isLivingIcon ? {
                      width: 54,
                      height: 54,
                      background: "radial-gradient(circle at 50% 50%, rgba(130,215,228,0.7), rgba(175,230,238,0.55))",
                      border: "0.5px solid rgba(150,215,225,0.3)",
                      boxShadow: "inset 2px 2px 6px rgba(100,180,200,0.2), inset -2px -2px 6px rgba(255,255,255,0.3)",
                    } : {
                      background: "var(--bg-dark)",
                      boxShadow: "inset 3px 3px 6px rgba(155,161,180,0.3), inset -3px -3px 6px rgba(255,255,255,0.5), 0 0 14px rgba(92,111,181,0.12)",
                    }}
                  >
                    {item.id === "apps-review" ? (
                      /* FIX 5: Lazy loaded LivingIcon with static fallback */
                      <Suspense fallback={<LivingIconFallback size={54} />}>
                        <LivingIcon type="applications" count={stats!.applicationsInReview} size={54} />
                      </Suspense>
                    ) : (
                      <item.icon className="w-5 h-5 animate-pulse-dot" style={{ color: "var(--accent-light)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{item.subtitle}</p>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0${isLivingIcon ? " cta-chevron" : ""}`}
                    style={isLivingIcon ? {
                      background: "linear-gradient(135deg, rgba(130,90,220,0.18), rgba(75,165,195,0.18))",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(130,100,220,0.12)",
                    } : {
                      background: "var(--bg-light)",
                      boxShadow: "4px 4px 10px rgba(155,161,180,0.3), -4px -4px 10px rgba(255,255,255,0.7)",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: isLivingIcon ? "rgba(100,80,180,0.6)" : "var(--accent)" }} />
                  </div>
                </DynamicShadowCard>
              </button>
            );
          })
        )}
      </div>

      {/* ── Pipeline — hidden on mobile, shows skeleton until data on desktop ── */}
      <div className="animate-in-3 hidden md:block">
        {stats === null ? (
          <PipelineSkeleton />
        ) : (
          /* FIX 5: Lazy loaded SpatialPipeline with skeleton fallback */
          <Suspense fallback={<PipelineSkeleton />}>
            <SpatialPipeline
              applications={mapToPipelineApps(stats.pipelineApplications ?? [])}
              fundName={program?.name ?? "Fund Pipeline"}
              fundBudget={program?.budgetTotal ?? 0}
              onApplicationClick={(id) => router.push(`/dashboard/applications?highlight=${id}`)}
            />
          </Suspense>
        )}

        {/* All on track fallback when no decision items */}
        {stats && decisions.length === 0 && (
          <div className="neu-inset p-5 mt-6">
            <p className="text-sm font-medium text-center" style={{ color: "var(--text-primary)" }}>
              All on track. No urgent items.
            </p>
          </div>
        )}
      </div>

      {/* ── Stat Cards — show skeleton or real data independently ── */}
      <div className="grid grid-cols-2 desktop:grid-cols-4 gap-[14px] mb-6 animate-in-4">
        {stats === null ? (
          /* Skeleton placeholders */
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Disbursed — show dash when 0 */}
            <StatCard label="Disbursed" helper={stats.totalDisbursed === 0 ? <><span className="sm:hidden">None yet</span><span className="hidden sm:inline">No disbursements yet</span></> : "Released"} hoverKey="disbursed" onHoverEnter={handleHoverEnter} onHoverLeave={handleHoverLeave} riverVariant={stats.totalDisbursed === 0 ? "dry" : "water"} riverFill={stats.totalDisbursed > 0 ? Math.min(1, sarParts!.num / 100) : 0}>
              {stats.totalDisbursed === 0 ? (
                <span className="stat-number" style={{ color: "rgba(30, 34, 53, 0.75)", fontSize: 36, fontWeight: 300 }}>—</span>
              ) : (
                <>
                  <span className="stat-number" style={{ color: "rgba(30, 34, 53, 0.75)", fontSize: 36, fontWeight: 300 }}>
                    <AnimatedCounter end={sarParts!.num} decimals={sarParts!.num === 0 ? 0 : 1} duration={1800} delay={0} />
                  </span>
                  {sarParts!.suffix && (
                    <span className="stat-number" style={{ color: "rgba(30, 34, 53, 0.75)", fontSize: 36, fontWeight: 300 }}>
                      {sarParts!.suffix}
                    </span>
                  )}
                  <span className="mono-data ml-1">SAR</span>
                </>
              )}
            </StatCard>

            <StatCard label="Open RFPs" helper="Accepting" hoverKey="open-rfps" onHoverEnter={handleHoverEnter} onHoverLeave={handleHoverLeave} riverVariant={stats.openRfps > 0 ? "water" : "empty"} riverFill={rfpFill}>
              <span className="stat-number" style={{ color: "rgba(30, 34, 53, 0.75)", fontSize: 36, fontWeight: 300 }}>
                <AnimatedCounter end={stats.openRfps} duration={1500} delay={100} />
              </span>
            </StatCard>

            <StatCard
              label="In Review"
              helper="Awaiting"
              hoverKey="in-review"
              onHoverEnter={handleHoverEnter}
              onHoverLeave={handleHoverLeave}
              riverVariant={stats.applicationsInReview > 0 ? "water" : "empty"}
              riverFill={reviewFill}
              intense
            >
              <span className="stat-number" style={{ color: "rgba(30, 34, 53, 0.75)", fontSize: 36, fontWeight: 300 }}>
                <AnimatedCounter end={stats.applicationsInReview} duration={1500} delay={200} />
              </span>
            </StatCard>

            <StatCard
              label="Grants"
              helper={stats.atRiskProjects > 0
                ? <span style={{ color: "#9c4a4a", fontWeight: 600 }}>{stats.atRiskProjects} at risk</span>
                : "On track"
              }
              hoverKey="grants"
              onHoverEnter={handleHoverEnter}
              onHoverLeave={handleHoverLeave}
              riverVariant={stats.activeGrants > 0 ? "water" : "empty"}
              riverFill={grantsFill}
            >
              <span className="stat-number" style={{ color: "rgba(30, 34, 53, 0.75)", fontSize: 36, fontWeight: 300 }}>
                <AnimatedCounter end={stats.activeGrants} duration={1500} delay={300} />
              </span>
            </StatCard>
          </>
        )}
      </div>

      {/* ── Hover Card (desktop only) ────────────────────────── */}
      {hoverTarget && hoverPosition && (
        <HoverCard target={hoverTarget} position={hoverPosition} />
      )}
    </div>

    {/* ── Navigator Briefing Portal — renders above everything ── */}
    {briefingOpen && mounted && createPortal(
      <div
        ref={briefingRef}
        className={briefingClosing ? "briefing-panel-out" : "briefing-panel-in"}
        style={{
          position: "fixed",
          top: triggerRef.current
            ? triggerRef.current.getBoundingClientRect().bottom + 12
            : 80,
          right: 24,
          zIndex: 10000,
          maxWidth: 420,
          width: "calc(100vw - 48px)",
          background: "rgba(255, 255, 255, 0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "0 8px 32px rgba(30, 34, 53, 0.12), 0 2px 8px rgba(30, 34, 53, 0.08)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2C7 4 4 6.5 4 10c0 2.5 2 4.5 5 5 3-0.5 5-2.5 5-5C14 6.5 11 4 9 2z"
                fill="rgba(60, 140, 80, 0.55)"
                stroke="rgba(60, 140, 80, 0.3)"
                strokeWidth="0.5"
              />
              <path d="M9 3.5V14" stroke="rgba(40, 100, 60, 0.35)" strokeWidth="0.5" />
            </svg>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2,
                color: "rgba(30, 34, 53, 0.4)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              NAVIGATOR BRIEFING
            </span>
          </div>
          <button
            onClick={closeBriefing}
            className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            style={{ background: "rgba(30, 34, 53, 0.05)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30, 34, 53, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(30, 34, 53, 0.05)")}
          >
            <X className="w-3 h-3" style={{ color: "rgba(30, 34, 53, 0.4)" }} />
          </button>
        </div>

        {/* Typewriter text */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "rgba(30, 34, 53, 0.75)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {displayedText}
          {displayedText.length < BRIEFING_TEXT.length && (
            <span className="briefing-cursor">|</span>
          )}
        </p>
      </div>,
      document.body
    )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

/* ── Micro-river channel — carved groove at bottom of stat cards ── */

/** Seeded random for deterministic crack/dust placement */
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

/** Draw the empty channel base (inset groove + lip) */
function drawChannelBase(ctx: CanvasRenderingContext2D, x: number, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(200, 205, 215, 0.3)");
  grad.addColorStop(0.5, "rgba(215, 220, 228, 0.15)");
  grad.addColorStop(1, "rgba(200, 205, 215, 0.2)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, 0, w, h);
  ctx.strokeStyle = "rgba(180, 185, 195, 0.2)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x, 0.25);
  ctx.lineTo(x + w, 0.25);
  ctx.stroke();
}

/** Draw dry riverbed: sandy base, cracks, dust specks */
function drawDryRiverbed(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rng = seededRand(42);

  // Sandy base tint
  ctx.fillStyle = "rgba(195, 182, 162, 0.25)";
  ctx.fillRect(0, 0, w, h);

  // Warm overlay
  ctx.fillStyle = "rgba(190, 175, 155, 0.06)";
  ctx.fillRect(0, 0, w, h);

  // 6 crack lines with branches
  for (let c = 0; c < 6; c++) {
    const startX = rng() * w;
    const startY = 1 + rng() * (h - 2);
    ctx.strokeStyle = `rgba(175, 160, 140, ${0.25 + rng() * 0.1})`;
    ctx.lineWidth = 0.5 + rng() * 0.3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let cx = startX;
    let cy = startY;
    const segments = 4 + Math.floor(rng() * 3);
    let branchDone = false;

    for (let s = 0; s < segments; s++) {
      const dx = (rng() - 0.3) * (w * 0.08);
      const dy = (rng() - 0.5) * 3;
      cx += dx;
      cy = Math.max(0.5, Math.min(h - 0.5, cy + dy));
      ctx.lineTo(cx, cy);

      // Branch once per crack
      if (!branchDone && s >= 1 && rng() > 0.5) {
        branchDone = true;
        const bx = cx;
        const by = cy;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx, by);
        const bLen = 2 + Math.floor(rng() * 2);
        let bcx = bx;
        let bcy = by;
        for (let b = 0; b < bLen; b++) {
          bcx += (rng() - 0.4) * (w * 0.05);
          bcy = Math.max(0.5, Math.min(h - 0.5, bcy + (rng() - 0.5) * 2.5));
          ctx.lineTo(bcx, bcy);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
      }
    }
    ctx.stroke();
  }

  // 12 dust specks
  for (let d = 0; d < 12; d++) {
    const dx = rng() * w;
    const dy = rng() * h;
    const dr = 0.5 + rng() * 0.5;
    ctx.fillStyle = "rgba(185, 170, 150, 0.15)";
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw water fill with feathered right edge */
function drawWaterFill(ctx: CanvasRenderingContext2D, w: number, h: number, fillPct: number) {
  const fillW = w * fillPct;
  const feather = Math.min(10, fillW * 0.3);
  const solidW = Math.max(0, fillW - feather);

  // Solid water fill
  if (solidW > 0) {
    const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
    waterGrad.addColorStop(0, "rgba(185, 230, 240, 0.65)");
    waterGrad.addColorStop(0.5, "rgba(130, 215, 228, 0.75)");
    waterGrad.addColorStop(1, "rgba(185, 230, 240, 0.65)");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, solidW, h);
  }

  // Feathered edge — water fading into dry channel
  if (feather > 0 && fillW > 0) {
    for (let i = 0; i < feather; i++) {
      const alpha = 1 - (i / feather);
      const x = solidW + i;
      if (x > w) break;
      const fadeGrad = ctx.createLinearGradient(0, 0, 0, h);
      fadeGrad.addColorStop(0, `rgba(185, 230, 240, ${0.65 * alpha})`);
      fadeGrad.addColorStop(0.5, `rgba(130, 215, 228, ${0.75 * alpha})`);
      fadeGrad.addColorStop(1, `rgba(185, 230, 240, ${0.65 * alpha})`);
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(x, 0, 1, h);
    }
  }
}

/** Pre-render a micro caustic blob to offscreen canvas (same shape approach as pipeline) */
function createMicroBlob(size: number, alpha: number): HTMLCanvasElement {
  const pad = 2;
  const dim = size + pad * 2;
  const c = document.createElement("canvas");
  c.width = dim;
  c.height = dim;
  const ctx = c.getContext("2d")!;
  const cx = dim / 2;
  const cy = dim / 2;
  const r = size / 2;
  const offsets = [
    { dx: 0, dy: 0, rScale: 1.0 },
    { dx: r * 0.15, dy: -r * 0.1, rScale: 0.75 },
  ];
  for (const off of offsets) {
    const grad = ctx.createRadialGradient(
      cx + off.dx, cy + off.dy, 0,
      cx + off.dx, cy + off.dy, r * off.rScale
    );
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.35, `rgba(220, 248, 255, ${alpha * 0.5})`);
    grad.addColorStop(1, "rgba(220, 248, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, dim, dim);
  }
  return c;
}

function MicroRiverChannel({ variant = "empty", fillPercent = 0, intense = false }: {
  variant?: "empty" | "dry" | "water";
  fillPercent?: number;
  intense?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement!;
    const H = 8;

    /* Helper — size canvas with DPR */
    let canvasW = 0;
    function sizeCanvas() {
      const w = parent.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = w * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvasW = w;
    }

    /* ── Static variants (dry / empty) ── */
    if (variant !== "water" || fillPercent <= 0) {
      function drawStatic() {
        sizeCanvas();
        if (variant === "dry") {
          drawChannelBase(ctx!, 0, canvasW, H);
          drawDryRiverbed(ctx!, canvasW, H);
        } else {
          drawChannelBase(ctx!, 0, canvasW, H);
        }
      }
      drawStatic();
      const ro = new ResizeObserver(drawStatic);
      ro.observe(parent);
      return () => ro.disconnect();
    }

    /* ── Animated water variant ── */
    const pct = Math.max(0, Math.min(1, fillPercent));
    sizeCanvas();

    /* Pre-render blob templates — brighter when intense (In Review card) */
    const blobAlpha1 = intense ? 0.16 : 0.12;
    const blobAlpha2 = intense ? 0.18 : 0.14;
    const blobT1 = createMicroBlob(14, blobAlpha1);
    const blobT2 = createMicroBlob(10, blobAlpha2);

    /* 2-3 caustic blobs (intense adds +1) — white, 10-18px, drift L→R at 8-12px/s */
    const blobCount = (pct > 0.5 ? 3 : 2) + (intense ? 1 : 0);
    const blobs: { x: number; y: number; size: number; speed: number; off: HTMLCanvasElement }[] = [];
    for (let i = 0; i < blobCount; i++) {
      blobs.push({
        x: Math.random() * canvasW * pct,
        y: Math.random() * H,
        size: 10 + Math.random() * 8,
        speed: 8 + Math.random() * 4,
        off: i % 2 === 0 ? blobT1 : blobT2,
      });
    }

    /* 3-5 shimmer glints (intense adds +1) — tiny white dots, fade in/out over 1.5-2.5s */
    const glintCount = 3 + Math.floor(Math.random() * 3) + (intense ? 1 : 0);
    const glints: { x: number; y: number; r: number; period: number; phase: number }[] = [];
    for (let i = 0; i < glintCount; i++) {
      glints.push({
        x: Math.random() * canvasW * pct,
        y: 1 + Math.random() * (H - 2),
        r: 1 + Math.random() * 0.5,
        period: 1.5 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2,
      });
    }

    /* Resize flag — set by ResizeObserver, consumed by animation loop */
    let needsResize = false;
    const ro = new ResizeObserver(() => { needsResize = true; });
    ro.observe(parent);

    let lastTime = performance.now();

    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = now / 1000;

      if (needsResize) { sizeCanvas(); needsResize = false; }
      const w = canvasW;
      if (w <= 0) { rafRef.current = requestAnimationFrame(animate); return; }
      const fillW = w * pct;

      ctx!.clearRect(0, 0, w, H);

      /* ── Base: channel groove + water fill ── */
      drawChannelBase(ctx!, 0, w, H);
      drawWaterFill(ctx!, w, H, pct);

      /* Re-draw lip */
      ctx!.strokeStyle = "rgba(180, 185, 195, 0.2)";
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.moveTo(0, 0.25);
      ctx!.lineTo(w, 0.25);
      ctx!.stroke();

      /* ── Clip to water fill area for animated effects ── */
      ctx!.save();
      ctx!.beginPath();
      ctx!.rect(0, 0, fillW, H);
      ctx!.clip();

      /* ── 1. Caustic blobs — drift L→R, loop back at water boundary ── */
      for (const b of blobs) {
        b.x += b.speed * dt;
        if (b.x > fillW + b.size / 2) {
          b.x = -b.size / 2;
          b.y = Math.random() * H;
        }
        const bAlpha = (intense ? 0.14 : 0.10) + Math.sin(t * 1.5 + b.size) * 0.02;
        ctx!.globalAlpha = bAlpha;
        ctx!.drawImage(b.off, b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
      }
      ctx!.globalAlpha = 1;

      /* ── 2. Current line — sine wave flowing L→R at 15px/s ── */
      ctx!.beginPath();
      const lineY = H / 2;
      const amp = 1 + Math.sin(t * 0.3) * 0.5;       // 1-1.5px amplitude
      const period = 40;                               // ~40px wavelength
      const lineShift = t * 15;                        // 15 px/s flow speed
      for (let x = 0; x <= fillW; x += 1) {
        const y = lineY + Math.sin((x - lineShift) * (Math.PI * 2 / period)) * amp;
        if (x === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      const lineAlpha = 0.12 + Math.sin(t * 0.5) * 0.02;
      ctx!.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      /* ── 3. Shimmer glints — fade in to α 0.2 and back out ── */
      for (const g of glints) {
        const fade = Math.max(0, Math.sin(t * (Math.PI / g.period) + g.phase));
        if (fade < 0.05) continue;
        ctx!.beginPath();
        ctx!.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${fade * 0.2})`;
        ctx!.fill();
      }

      ctx!.restore();
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [variant, fillPercent, intense]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 8,
        borderRadius: "0 0 18px 18px",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", borderRadius: "0 0 18px 18px" }} />
    </div>
  );
}

function StatCard({
  label,
  helper,
  children,
  hoverKey,
  onHoverEnter,
  onHoverLeave,
  riverVariant = "empty",
  riverFill = 0,
  intense = false,
}: {
  label: React.ReactNode;
  helper: React.ReactNode;
  glow?: boolean;
  children: React.ReactNode;
  hoverKey?: string;
  onHoverEnter?: (key: string, el: HTMLElement) => void;
  onHoverLeave?: () => void;
  riverVariant?: "empty" | "dry" | "water";
  riverFill?: number;
  intense?: boolean;
}) {
  return (
    <div
      className="flex flex-col fm-stat-card"
      style={{
        position: "relative",
        padding: "20px 24px 26px",
        borderRadius: 18,
        background: "rgba(228, 231, 238, 0.5)",
        boxShadow:
          "inset 8px 8px 20px rgba(155, 161, 180, 0.35), inset -8px -8px 20px rgba(255, 255, 255, 0.7)",
        overflow: "hidden",
      }}
    >
      <div
        onMouseEnter={hoverKey && onHoverEnter ? (e) => onHoverEnter(hoverKey, e.currentTarget) : undefined}
        onMouseLeave={onHoverLeave}
        className="flex flex-col flex-1"
      >
        <p className="leading-tight mb-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(30, 34, 53, 0.5)" }}>{label}</p>
        <div className="flex items-baseline gap-0">{children}</div>
        <p className="mt-1.5" style={{ fontSize: 12, color: "rgba(30, 34, 53, 0.4)" }}>{helper}</p>
      </div>
      {/* Teal glow — water casting cool light upward into card */}
      {riverVariant === "water" && riverFill > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 0,
            right: 0,
            height: 20,
            pointerEvents: "none",
            background: "linear-gradient(to top, rgba(75, 165, 195, 0.04), transparent)",
          }}
          aria-hidden="true"
        />
      )}
      {/* Warm shadow — dry earth radiating warmth upward */}
      {riverVariant === "dry" && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 0,
            right: 0,
            height: 12,
            pointerEvents: "none",
            background: "linear-gradient(to top, rgba(190, 175, 155, 0.03), transparent)",
          }}
          aria-hidden="true"
        />
      )}
      {/* Micro-river channel — carved groove at bottom */}
      <MicroRiverChannel variant={riverVariant} fillPercent={riverFill} intense={intense} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DecisionItem {
  id: string;
  icon: typeof FileText;
  title: string;
  subtitle: string;
  href: string;
  urgency: number;
}
