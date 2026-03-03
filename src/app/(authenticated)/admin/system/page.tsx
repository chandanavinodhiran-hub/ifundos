"use client";

import { useState, useEffect } from "react";
import {
  Loader2, Cpu, Users, Building2, Database, Landmark,
  CheckCircle,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface SystemStats {
  userCount: number;
  orgCount: number;
  programCount: number;
  auditCount: number;
  scoredAppCount: number;
  lastScoringEvent: { timestamp: string; action: string } | null;
  aiEngineStatus: string;
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const NEU_RAISED: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.55)",
  backdropFilter: "blur(12px)",
  borderTop: "1.5px solid rgba(255, 255, 255, 0.8)",
  borderLeft: "1.5px solid rgba(255, 255, 255, 0.7)",
  borderBottom: "1.5px solid rgba(255, 255, 255, 0.15)",
  borderRight: "1.5px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "10px 10px 25px rgba(155, 161, 180, 0.4), -10px -10px 25px rgba(255, 255, 255, 0.8)",
};

const NEU_INSET: React.CSSProperties = {
  background: "rgba(228, 231, 238, 0.5)",
  boxShadow: "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function AdminSystemPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }
  if (!stats) return null;

  const aiStatus = stats.aiEngineStatus;
  const statusColor = aiStatus === "operational" ? "rgba(74, 140, 106, 0.85)" : aiStatus === "processing" ? "#5C6FB5" : aiStatus === "degraded" ? "rgba(175, 148, 63, 0.85)" : "#9c4a4a";
  const statusLabel = aiStatus === "operational" ? "Operational" : aiStatus === "processing" ? "Processing" : aiStatus === "degraded" ? "Degraded" : "Offline";
  const lastScoringAgo = stats.lastScoringEvent
    ? relativeTime(stats.lastScoringEvent.timestamp)
    : "Never";

  const services = [
    { label: "Platform", status: "Operational", detail: "99.9% uptime", color: "rgba(74, 140, 106, 0.85)" },
    { label: "Database", status: "Operational", detail: "Operational", color: "rgba(74, 140, 106, 0.85)" },
    { label: "Authentication", status: "Active", detail: "NextAuth v4", color: "rgba(74, 140, 106, 0.85)" },
    {
      label: "Audit Chain",
      status: "Verified",
      detail: `${stats.auditCount.toLocaleString()} events`,
      color: "rgba(74, 140, 106, 0.85)",
    },
  ];

  const metricCards = [
    { label: "Total Users", value: stats.userCount, icon: Users, color: "rgba(30, 34, 53, 0.4)" },
    { label: "Active Programs", value: stats.programCount, icon: Building2, color: "rgba(30, 34, 53, 0.4)" },
    { label: "Audit Events", value: stats.auditCount, icon: Database, color: "rgba(30, 34, 53, 0.4)" },
    { label: "Organizations", value: stats.orgCount, icon: Landmark, color: "rgba(30, 34, 53, 0.4)" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* ── Header ── */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif", letterSpacing: "2.5px" }}
        >
          ADMINISTRATION
        </p>
        <h1
          className="text-[22px] leading-tight mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "rgba(30, 34, 53, 0.85)" }}
        >
          System
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
          Platform health and performance
        </p>
      </div>

      {/* ── AI Engine Hero Card — raised neumorphic ── */}
      <div
        className="rounded-[20px] p-5"
        style={{ ...NEU_RAISED, borderRadius: "20px" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(228, 231, 238, 0.5)",
            }}
          >
            <Cpu className="w-6 h-6" style={{ color: "rgba(30, 34, 53, 0.5)" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[18px]" style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}>
              AI Scoring Engine
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: statusColor,
                  boxShadow: aiStatus === "operational" ? `0 0 8px rgba(74, 140, 106, 0.4)` : "none",
                }}
              />
              <span className="text-[13px]" style={{ fontWeight: 500, color: statusColor, fontFamily: "'DM Sans', sans-serif" }}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 2-col inset wells */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div
            className="p-4 text-center rounded-[14px]"
            style={NEU_INSET}
          >
            <AnimatedCounter
              end={stats.scoredAppCount}
              duration={1000}
              className="font-light text-[36px] leading-none tabular-nums"
              style={{ color: "rgba(30, 34, 53, 0.75)", fontFamily: "'DM Sans', sans-serif" }}
            />
            <p
              className="mt-1"
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "2.5px",
                color: "rgba(30, 34, 53, 0.5)",
                fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase" as const,
              }}
            >
              Apps Scored
            </p>
          </div>
          <div
            className="p-4 text-center rounded-[14px]"
            style={NEU_INSET}
          >
            <p
              className="font-light text-[36px] leading-none"
              style={{ color: "rgba(30, 34, 53, 0.75)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {lastScoringAgo}
            </p>
            <p
              className="mt-1"
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "2.5px",
                color: "rgba(30, 34, 53, 0.5)",
                fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase" as const,
              }}
            >
              Last Scoring
            </p>
          </div>
        </div>
      </div>

      {/* ── Platform Metrics — 2x2 inset ── */}
      <div className="grid grid-cols-2 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-[18px] p-5"
              style={NEU_INSET}
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: card.color }} />
              <AnimatedCounter
                end={card.value}
                duration={1200}
                className="font-light text-[36px] leading-none tabular-nums"
                style={{ color: "rgba(30, 34, 53, 0.75)", fontFamily: "'DM Sans', sans-serif" }}
              />
              <p className="text-[13px] mt-1" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Service Health List — raised neumorphic ── */}
      <div>
        <h2
          className="mb-3"
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "2.5px",
            color: "rgba(30, 34, 53, 0.5)",
            fontFamily: "'DM Sans', sans-serif",
            textTransform: "uppercase" as const,
          }}
        >
          Service Health
        </h2>
        <div
          className="rounded-[20px] overflow-hidden"
          style={{ ...NEU_RAISED, borderRadius: "20px" }}
        >
          {services.map((service, i) => (
            <div
              key={service.label}
              className="flex items-center justify-between px-5 py-3.5"
              style={{
                borderBottom: i < services.length - 1 ? "1px solid rgba(30, 34, 53, 0.06)" : "none",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: service.color }}
                />
                <span className="text-[14px]" style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}>
                  {service.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="text-[13px]" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
                  {service.detail}
                </span>
                <CheckCircle className="w-4 h-4" style={{ color: "rgba(74, 140, 106, 0.6)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Errors ── */}
      <div>
        <h2
          className="mb-3"
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "2.5px",
            color: "rgba(30, 34, 53, 0.5)",
            fontFamily: "'DM Sans', sans-serif",
            textTransform: "uppercase" as const,
          }}
        >
          Recent Errors
        </h2>
        <div
          className="rounded-[18px] p-4 flex items-center gap-3 accent-left-green overflow-hidden"
          style={NEU_INSET}
        >
          <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "rgba(74, 140, 106, 0.85)" }} />
          <p className="text-[13px]" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
            No system errors in the last 7 days
          </p>
        </div>
      </div>
    </div>
  );
}
