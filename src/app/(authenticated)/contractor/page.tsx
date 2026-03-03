"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import DynamicShadowCard from "@/components/DynamicShadowCard";
import {
  Loader2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Application {
  id: string;
  rfpId: string;
  status: string;
  proposedBudget: number;
  compositeScore: number | null;
  questionnaireStatus: string;
  createdAt: string;
  submittedAt: string | null;
  rfp: { title: string; deadline: string | null };
}

interface Deadline {
  id: string;
  title: string;
  deadline: string;
}

interface OrgInfo {
  name: string;
  trustTier: string;
  preQualificationScore: number;
  capitalization: number | null;
  businessCategories: string | null;
  certifications: string | null;
}

interface ContractorStats {
  organization: OrgInfo | null;
  openRfps: number;
  applications: Application[];
  activeContracts: number;
  pendingMilestones: number;
  totalReceived: number;
  statusCounts: Record<string, number>;
  upcomingDeadlines: Deadline[];
  appliedRfpIds: string[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const TIER_LABELS: Record<string, { label: string; dot: string }> = {
  T0: { label: "Unrated", dot: "#9a9488" },
  T1: { label: "Bronze", dot: "rgba(160, 130, 100, 0.6)" },
  T2: { label: "Silver", dot: "#8a8275" },
  T3: { label: "Gold", dot: "#5C6FB5" },
  T4: { label: "Platinum", dot: "#7a7265" },
};

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Mini sapling for empty state                                        */
/* ------------------------------------------------------------------ */

function drawMiniSapling(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const W = 36;
  const H = 36;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.scale(dpr, dpr);

  const cx = W / 2;

  /* Ground shadow */
  const shadowGrad = ctx.createRadialGradient(cx, 32, 0, cx, 32, 8);
  shadowGrad.addColorStop(0, "rgba(40, 80, 45, 0.08)");
  shadowGrad.addColorStop(1, "rgba(40, 80, 45, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 32, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  /* Seed body */
  const seedCY = 28;
  ctx.beginPath();
  ctx.ellipse(cx, seedCY, 5, 4, 0, 0, Math.PI * 2);
  const seedGrad = ctx.createRadialGradient(cx - 1.5, seedCY - 1.5, 0, cx, seedCY, 5);
  seedGrad.addColorStop(0, "rgba(115, 185, 120, 0.90)");
  seedGrad.addColorStop(0.4, "rgba(95, 170, 100, 0.85)");
  seedGrad.addColorStop(1, "rgba(55, 120, 65, 0.90)");
  ctx.fillStyle = seedGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(40, 95, 50, 0.25)";
  ctx.lineWidth = 0.4;
  ctx.stroke();

  /* Stem */
  const stemBaseY = seedCY - 3.5;
  const stemTopY = 12;
  const stemGrad = ctx.createLinearGradient(0, stemBaseY, 0, stemTopY);
  stemGrad.addColorStop(0, "rgba(75, 145, 80, 0.80)");
  stemGrad.addColorStop(1, "rgba(90, 165, 95, 0.85)");
  ctx.beginPath();
  ctx.moveTo(cx - 0.5, stemBaseY);
  ctx.bezierCurveTo(cx - 0.8, stemBaseY - 4, cx + 0.8, stemTopY + 4, cx + 0.3, stemTopY);
  ctx.lineTo(cx + 0.8, stemTopY);
  ctx.bezierCurveTo(cx + 1.2, stemTopY + 4, cx - 0.3, stemBaseY - 4, cx + 0.5, stemBaseY);
  ctx.closePath();
  ctx.fillStyle = stemGrad;
  ctx.fill();

  /* Left leaf */
  drawMiniLeaf(ctx, cx - 0.5, stemTopY + 1, -0.6, 7);
  /* Right leaf */
  drawMiniLeaf(ctx, cx + 0.5, stemTopY + 1, 0.5, 6.5);
}

function drawMiniLeaf(
  ctx: CanvasRenderingContext2D,
  jx: number, jy: number,
  angle: number, length: number
) {
  ctx.save();
  ctx.translate(jx, jy);
  ctx.rotate(angle);

  const lw = length * 0.35;
  const lh = length;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(lw * 0.6, -lh * 0.15, lw * 1.1, -lh * 0.45, lw * 0.4, -lh * 0.85);
  ctx.bezierCurveTo(lw * 0.1, -lh * 0.95, -lw * 0.05, -lh * 0.92, -lw * 0.2, -lh * 0.8);
  ctx.bezierCurveTo(-lw * 0.9, -lh * 0.4, -lw * 0.5, -lh * 0.12, 0, 0);
  ctx.closePath();

  const leafGrad = ctx.createLinearGradient(-lw * 0.3, 0, lw * 0.5, -lh);
  leafGrad.addColorStop(0, "rgba(80, 160, 90, 0.85)");
  leafGrad.addColorStop(0.5, "rgba(65, 145, 75, 0.88)");
  leafGrad.addColorStop(1, "rgba(50, 130, 60, 0.90)");
  ctx.fillStyle = leafGrad;
  ctx.fill();

  ctx.strokeStyle = "rgba(35, 95, 45, 0.25)";
  ctx.lineWidth = 0.3;
  ctx.stroke();

  /* Midrib */
  ctx.beginPath();
  ctx.moveTo(0, -0.5);
  ctx.bezierCurveTo(lw * 0.15, -lh * 0.3, lw * 0.1, -lh * 0.6, lw * 0.1, -lh * 0.82);
  ctx.strokeStyle = "rgba(40, 100, 50, 0.30)";
  ctx.lineWidth = 0.3;
  ctx.stroke();

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ContractorHome() {
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const saplingCanvasRef = useRef<HTMLCanvasElement>(null);
  const saplingDrawn = useRef(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  /* Draw mini sapling for empty state */
  useEffect(() => {
    if (saplingCanvasRef.current && !saplingDrawn.current) {
      drawMiniSapling(saplingCanvasRef.current);
      saplingDrawn.current = true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (!stats) return null;

  const org = stats.organization;
  const trustTier = org?.trustTier ?? "T0";
  const tierInfo = TIER_LABELS[trustTier] || TIER_LABELS.T0;
  const firstName = session?.user?.name?.split(" ")[0] ?? org?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeApps = stats.applications.filter(
    (a) => !["DRAFT", "REJECTED"].includes(a.status)
  ).length;

  const pulse = buildPulse(stats);
  const timeline = buildTimeline(stats);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).toUpperCase();

  return (
    <>
      {/* ── Atmosphere backgrounds — directional light + edge vignette ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: "radial-gradient(ellipse at 12% 8%, rgba(242, 245, 252, 1.0), #E8EBF2 50%, #DDDFE8)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: "radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(200, 204, 218, 0.45) 100%)",
        }}
      />

      <div className="relative pb-[100px] desktop:pb-0" style={{ zIndex: 1 }}>
        {/* Full-width greeting row */}
        <div className="animate-in-1 mb-6">
          <p
            className="hidden sm:block"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2.5,
              color: "rgba(30, 34, 53, 0.4)",
              marginBottom: 8,
            }}
          >
            {dateStr}
          </p>
          <div
            className="greeting-title"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 32,
              fontWeight: 300,
              color: "rgba(30, 34, 53, 0.85)",
            }}
          >
            {greeting}, {firstName}
          </div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "rgba(30, 34, 53, 0.4)",
              marginTop: 4,
            }}
          >
            {org?.name ?? "Your Organization"}
          </p>
          <div className="mt-3">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                background: "rgba(160, 130, 100, 0.08)",
                border: "1px solid rgba(160, 130, 100, 0.15)",
                borderRadius: 20,
                padding: "4px 12px",
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: tierInfo.dot }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(160, 130, 100, 0.7)",
                }}
              >
                {tierInfo.label} · {trustTier}
              </span>
            </span>
          </div>
        </div>

        {/* Two equal columns: 50/50 on desktop */}
        <div className="desktop:flex desktop:gap-6">

          {/* ══════════ LEFT COLUMN (50%) ══════════ */}
          <div className="desktop:w-1/2 space-y-5">

            {/* Navigator Insight / Pulse */}
            {pulse ? (
              <DynamicShadowCard onClick={() => router.push(pulse.href)} intensity={2} className="animate-in-2">
                <Card
                  variant="neu-raised"
                  className={`p-5 cursor-pointer action-card ${pulse.accent} relative overflow-hidden`}
                  onClick={() => router.push(pulse.href)}
                >
                  <div className="flex items-start gap-3 relative z-[1]">
                    <div className="shrink-0 mt-0.5">
                      <pulse.icon className="w-5 h-5" style={{ color: pulse.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                        {pulse.title}
                      </p>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                        {pulse.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0 mt-1" style={{ color: "var(--text-tertiary)" }} />
                  </div>
                </Card>
              </DynamicShadowCard>
            ) : (
              <div
                className="animate-in-2"
                style={{
                  padding: 24,
                  borderRadius: 20,
                  background: "rgba(255, 255, 255, 0.75)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow:
                    "8px 8px 20px rgba(165, 170, 185, 0.25), -8px -8px 20px rgba(255, 255, 255, 0.8), 0 0 20px rgba(74, 140, 106, 0.06)",
                  borderLeft: "3px solid rgba(74, 140, 106, 0.3)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "8px 8px 24px rgba(165, 170, 185, 0.3), -8px -8px 24px rgba(255, 255, 255, 0.85), 0 0 30px rgba(74, 140, 106, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "8px 8px 20px rgba(165, 170, 185, 0.25), -8px -8px 20px rgba(255, 255, 255, 0.8), 0 0 20px rgba(74, 140, 106, 0.06)";
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 sapling-bob">
                    <div className="sapling-stem-flex">
                      <canvas
                        ref={saplingCanvasRef}
                        style={{ display: "block", pointerEvents: "none", width: 28, height: 28 }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 2,
                        color: "rgba(30, 34, 53, 0.4)",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Navigator Insight
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 400,
                        color: "rgba(30, 34, 53, 0.6)",
                        lineHeight: 1.6,
                        marginBottom: 12,
                      }}
                    >
                      {(() => {
                        const topApp = stats.applications.find((a) => a.compositeScore !== null);
                        if (topApp) {
                          const score = Math.round(topApp.compositeScore!);
                          const status = topApp.status === "SHORTLISTED" ? "shortlisted" : topApp.status === "IN_REVIEW" ? "under review" : "submitted";
                          return `Your application scored ${score} and is ${status}. Review committees typically decide within 10\u201315 days.${stats.openRfps > 0 ? ` While you wait \u2014 there\u2019s ${stats.openRfps} open RFP${stats.openRfps > 1 ? "s" : ""} matching your profile.` : ""}`;
                        }
                        if (stats.openRfps > 0) {
                          return `There ${stats.openRfps === 1 ? "is" : "are"} ${stats.openRfps} open RFP${stats.openRfps > 1 ? "s" : ""} matching your profile. Browse opportunities to find the right fit for your organization.`;
                        }
                        return "No urgent actions right now. We\u2019ll notify you when new opportunities matching your profile become available.";
                      })()}
                    </p>
                    {stats.openRfps > 0 && (
                      <button
                        onClick={() => router.push("/contractor/rfps")}
                        className="cursor-pointer inline-flex items-center gap-1"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "rgba(74, 140, 106, 0.7)",
                          background: "none",
                          border: "none",
                          padding: 0,
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "rgba(74, 140, 106, 0.9)";
                          const arrow = e.currentTarget.querySelector(".insight-arrow") as HTMLElement;
                          if (arrow) arrow.style.transform = "translateX(2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "rgba(74, 140, 106, 0.7)";
                          const arrow = e.currentTarget.querySelector(".insight-arrow") as HTMLElement;
                          if (arrow) arrow.style.transform = "translateX(0)";
                        }}
                      >
                        View matching opportunities{" "}
                        <span
                          className="insight-arrow"
                          style={{ display: "inline-block", transition: "transform 0.2s ease" }}
                        >
                          →
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stat cards — inset neumorphism */}
            <div className="grid grid-cols-3 gap-3 animate-in-3">
              {[
                { label: "ACTIVE", value: activeApps, isMoney: false },
                { label: "CONTRACTS", value: stats.activeContracts, isMoney: false },
                { label: "PENDING", value: stats.totalReceived, isMoney: true },
              ].map((well) => (
                <div
                  key={well.label}
                  style={{
                    padding: "16px 12px",
                    borderRadius: 18,
                    background: "rgba(228, 231, 238, 0.5)",
                    boxShadow:
                      "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 2.5,
                      color: "rgba(30, 34, 53, 0.5)",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {well.label}
                  </p>
                  {well.isMoney ? (
                    <>
                      <p
                        style={{
                          fontSize: "clamp(22px, 5.5vw, 32px)",
                          fontWeight: 300,
                          color: "rgba(30, 34, 53, 0.75)",
                          lineHeight: 1,
                        }}
                      >
                        {formatSAR(well.value)}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(30, 34, 53, 0.4)", marginTop: 4 }}>SAR</p>
                    </>
                  ) : (
                    <p
                      style={{
                        fontSize: "clamp(22px, 5.5vw, 32px)",
                        fontWeight: 300,
                        color: "rgba(30, 34, 53, 0.75)",
                        lineHeight: 1,
                      }}
                    >
                      <AnimatedCounter end={well.value} duration={800} />
                    </p>
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* ══════════ RIGHT COLUMN (50%) ══════════ */}
          <div className="desktop:w-1/2 space-y-5 mt-5 desktop:mt-0">

            {/* Application Status Tracker */}
            <ApplicationTracker
              applications={stats.applications}
              onNavigate={(href) => router.push(href)}
            />

            {/* Recent Activity */}
            {timeline.length > 0 && (
              <div
                className="animate-in-3"
                style={{
                  padding: 20,
                  borderRadius: 18,
                  background: "rgba(255, 255, 255, 0.45)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  boxShadow: "0 4px 16px rgba(30, 34, 53, 0.06)",
                }}
              >
                <h2
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 2.5,
                    color: "rgba(30, 34, 53, 0.4)",
                    marginBottom: 14,
                  }}
                >
                  RECENT ACTIVITY
                </h2>
                <div className="space-y-0">
                  {timeline.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 py-2.5"
                      style={{
                        borderBottom: i < timeline.length - 1 ? "1px solid rgba(160,166,185,0.12)" : "none",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: item.dotColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(30, 34, 53, 0.75)" }}>
                          {item.text}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(30, 34, 53, 0.35)", whiteSpace: "nowrap" }}>
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Application Status Tracker (right column)                           */
/* ------------------------------------------------------------------ */

const TRACKER_STEPS = ["Submitted", "Scored", "Review", "Decision"] as const;

function statusToStep(status: string): number {
  switch (status) {
    case "SUBMITTED": return 0;
    case "SCORING": return 1;
    case "IN_REVIEW": return 1;
    case "SHORTLISTED": return 2;
    case "APPROVED":
    case "AWARDED": return 3;
    case "REJECTED": return 3;
    default: return 0;
  }
}

function ApplicationTracker({
  applications,
  onNavigate,
}: {
  applications: Application[];
  onNavigate: (href: string) => void;
}) {
  const topApp = applications.find(
    (a) => !["DRAFT", "REJECTED"].includes(a.status) && a.compositeScore !== null
  ) ?? applications.find((a) => !["DRAFT"].includes(a.status));

  if (!topApp) return null;

  const currentStep = statusToStep(topApp.status);
  const aiScore = topApp.compositeScore ? Math.round(topApp.compositeScore) : null;
  const title = topApp.rfp.title;

  return (
    <div
      className="animate-in-2 cursor-pointer"
      onClick={() => onNavigate("/contractor/applications")}
      style={{
        padding: 20,
        borderRadius: 18,
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow:
          "6px 6px 16px rgba(165, 170, 185, 0.2), -6px -6px 16px rgba(255, 255, 255, 0.75)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "6px 6px 20px rgba(165, 170, 185, 0.25), -6px -6px 20px rgba(255, 255, 255, 0.8)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "6px 6px 16px rgba(165, 170, 185, 0.2), -6px -6px 16px rgba(255, 255, 255, 0.75)";
      }}
    >
      {/* Header */}
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 2,
          color: "rgba(30, 34, 53, 0.4)",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        Application Status
      </p>

      {/* Project title */}
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "rgba(30, 34, 53, 0.8)",
          lineHeight: 1.4,
          marginBottom: 18,
        }}
      >
        {title}
      </p>

      {/* Progress tracker — horizontal steps */}
      <div className="flex items-start gap-0 stepper-mobile" style={{ marginBottom: 20 }}>
        {TRACKER_STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isFuture = i > currentStep;
          const dotSize = isCompleted ? 30 : isCurrent ? 34 : 24;

          return (
            <div key={step} className="flex-1 flex flex-col items-center" style={{ position: "relative" }}>
              {/* Connector line (before dot, except first) */}
              {i > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 15,
                    right: "50%",
                    width: "100%",
                    height: 2,
                    borderRadius: 1,
                    background: isCompleted || isCurrent
                      ? "linear-gradient(90deg, rgba(74, 140, 106, 0.5), rgba(74, 140, 106, 0.3))"
                      : "rgba(30, 34, 53, 0.08)",
                    zIndex: 0,
                  }}
                />
              )}

              {/* Dot */}
              <div
                className={isCurrent ? "tracker-dot-pulse" : undefined}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isCompleted
                    ? "rgba(74, 140, 106, 0.8)"
                    : isCurrent
                      ? "rgba(75, 165, 195, 0.12)"
                      : "rgba(228, 231, 238, 0.6)",
                  boxShadow: isCurrent
                    ? "0 0 8px rgba(75, 165, 195, 0.3)"
                    : isCompleted
                      ? "0 0 8px rgba(74, 140, 106, 0.2)"
                      : "inset 2px 2px 4px rgba(155, 161, 180, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)",
                  border: isCurrent ? "2px solid rgba(75, 165, 195, 0.4)" : "none",
                }}
              >
                {isCompleted && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isCurrent && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "rgba(75, 165, 195, 0.8)",
                    }}
                  />
                )}
                {isFuture && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "rgba(30, 34, 53, 0.12)",
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: isCompleted
                    ? "rgba(74, 140, 106, 0.7)"
                    : isCurrent
                      ? "rgba(75, 165, 195, 0.8)"
                      : "rgba(30, 34, 53, 0.35)",
                  marginTop: 8,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>

      {/* AI Score — teal circle outline */}
      {aiScore !== null && (
        <div className="flex items-center gap-3" style={{ padding: "8px 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: "2.5px solid rgba(75, 165, 195, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(75, 165, 195, 0.04)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 500,
                color: "rgba(75, 165, 195, 0.9)",
                letterSpacing: -0.5,
                lineHeight: 1,
              }}
            >
              {aiScore}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: "rgba(75, 165, 195, 0.6)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "rgba(30, 34, 53, 0.4)" }}>
                AI SCORE
              </span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(30, 34, 53, 0.35)", marginTop: 2 }}>
              Composite evaluation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pulse builder                                                       */
/* ------------------------------------------------------------------ */

interface PulseItem {
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  title: string;
  subtitle: string;
  href: string;
  urgency: number;
}

function buildPulse(stats: ContractorStats): PulseItem | null {
  const items: PulseItem[] = [];

  for (const app of stats.applications) {
    if (app.questionnaireStatus === "PENDING" || app.status === "QUESTIONNAIRE_PENDING") {
      items.push({
        accent: "accent-left-green",
        icon: AlertTriangle,
        iconColor: "rgba(75, 165, 195, 0.8)",
        title: `Action required: Complete questionnaire`,
        subtitle: `Interview questionnaire for "${app.rfp.title}" is waiting for your response.`,
        href: `/contractor/applications/${app.id}/questionnaire`,
        urgency: 0,
      });
    } else if (app.status === "IN_REVIEW" && app.compositeScore !== null) {
      items.push({
        accent: "accent-left-purple",
        icon: Sparkles,
        iconColor: "#5C6FB5",
        title: `Your application for ${app.rfp.title.replace(/\s*—.*$/, "")} was scored`,
        subtitle: `AI Score: ${Math.round(app.compositeScore)} — View score breakdown →`,
        href: "/contractor/applications",
        urgency: 1,
      });
    } else if (app.status === "APPROVED") {
      items.push({
        accent: "accent-left-green",
        icon: CheckCircle2,
        iconColor: "#5CA03E",
        title: `Application approved!`,
        subtitle: `Your proposal for "${app.rfp.title}" has been approved. Check your contracts.`,
        href: "/contractor/contracts",
        urgency: 2,
      });
    }
  }

  items.sort((a, b) => a.urgency - b.urgency);
  return items[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Timeline builder                                                    */
/* ------------------------------------------------------------------ */

interface TimelineItem {
  id: string;
  text: string;
  dotColor: string;
  time: string;
}

function buildTimeline(stats: ContractorStats): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const app of stats.applications) {
    if (app.compositeScore !== null) {
      items.push({
        id: `scored-${app.id}`,
        text: `AI scored your application for ${app.rfp.title}`,
        dotColor: "#5C6FB5",
        time: app.submittedAt ? relativeTime(app.submittedAt) : relativeTime(app.createdAt),
      });
    }
    if (app.submittedAt) {
      items.push({
        id: `submitted-${app.id}`,
        text: `Application submitted for ${app.rfp.title}`,
        dotColor: "#5CA03E",
        time: relativeTime(app.submittedAt),
      });
    }
  }

  items.push({
    id: "registered",
    text: "Registration completed",
    dotColor: "#5CA03E",
    time: "Feb 15",
  });

  return items.slice(0, 5);
}
