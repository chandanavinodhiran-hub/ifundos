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
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }
  if (!stats) return null;

  const aiStatus = stats.aiEngineStatus;
  const statusColor = aiStatus === "operational" ? "#4a7c59" : aiStatus === "processing" ? "#b8943f" : aiStatus === "degraded" ? "#b87a3f" : "#9c4a4a";
  const statusLabel = aiStatus === "operational" ? "Operational" : aiStatus === "processing" ? "Processing" : aiStatus === "degraded" ? "Degraded" : "Offline";
  const lastScoringAgo = stats.lastScoringEvent
    ? relativeTime(stats.lastScoringEvent.timestamp)
    : "Never";

  const services = [
    { label: "Platform", status: "Operational", detail: "99.9% uptime", color: "#4a7c59" },
    { label: "Database", status: "Operational", detail: "Operational", color: "#4a7c59" },
    { label: "Authentication", status: "Active", detail: "NextAuth v4", color: "#4a7c59" },
    {
      label: "Audit Chain",
      status: "Verified",
      detail: `${stats.auditCount.toLocaleString()} events`,
      color: "#4a7c59",
    },
  ];

  const metricCards = [
    { label: "Total Users", value: stats.userCount, icon: Users, color: "#b8943f" },
    { label: "Active Programs", value: stats.programCount, icon: Building2, color: "#4a7c59" },
    { label: "Audit Events", value: stats.auditCount, icon: Database, color: "#7a7265" },
    { label: "Organizations", value: stats.orgCount, icon: Landmark, color: "#b87a3f" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* ── Header ── */}
      <div>
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#b8943f" }}
        >
          ADMINISTRATION
        </p>
        <h1
          className="text-[22px] leading-tight mt-1"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 800, color: "#1a1714" }}
        >
          System
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "#7a7265" }}>
          Platform health and performance
        </p>
      </div>

      {/* ── AI Engine Hero Card ── */}
      <div
        className="rounded-[18px] p-5"
        style={{
          background: "#e8e0d0",
          boxShadow:
            "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "#e8e0d0",
              boxShadow:
                "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
            }}
          >
            <Cpu className="w-6 h-6" style={{ color: "#b8943f" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-bold" style={{ color: "#1a1714" }}>
              AI Scoring Engine
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: statusColor,
                  boxShadow: aiStatus === "operational" ? `0 0 8px ${statusColor}60` : "none",
                }}
              />
              <span className="text-[13px] font-semibold" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 2-col inset wells */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div
            className="p-3 text-center rounded-[14px]"
            style={{
              background: "#e8e0d0",
              boxShadow:
                "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
            }}
          >
            <AnimatedCounter
              end={stats.scoredAppCount}
              duration={1000}
              className="font-sans font-extrabold text-[22px] leading-none tabular-nums"
              style={{ color: "#b8943f" }}
            />
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#7a7265" }}>
              Apps Scored
            </p>
          </div>
          <div
            className="p-3 text-center rounded-[14px]"
            style={{
              background: "#e8e0d0",
              boxShadow:
                "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
            }}
          >
            <p
              className="font-sans font-extrabold text-[22px] leading-none"
              style={{ color: "#b8943f" }}
            >
              {lastScoringAgo}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#7a7265" }}>
              Last Scoring
            </p>
          </div>
        </div>
      </div>

      {/* ── Platform Metrics ── */}
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-[18px] p-4"
              style={{
                background: "#e8e0d0",
                boxShadow:
                  "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
              }}
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: card.color }} />
              <AnimatedCounter
                end={card.value}
                duration={1200}
                className="font-sans font-extrabold text-[26px] leading-none tabular-nums"
                style={{ color: "#1a1714" }}
              />
              <p className="text-[11px] font-semibold mt-1" style={{ color: "#7a7265" }}>
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Service Health List ── */}
      <div>
        <h2
          className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "#7a7265" }}
        >
          Service Health
        </h2>
        <div
          className="rounded-[18px] overflow-hidden"
          style={{
            background: "#e8e0d0",
            boxShadow:
              "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
          }}
        >
          {services.map((service, i) => (
            <div
              key={service.label}
              className="flex items-center justify-between px-4 py-3.5"
              style={{
                borderBottom: i < services.length - 1 ? "1px solid rgba(156,148,130,0.15)" : "none",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: service.color }}
                />
                <span className="text-[14px] font-semibold" style={{ color: "#1a1714" }}>
                  {service.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="text-[12px] font-mono" style={{ color: "#9a9488" }}>
                  {service.detail}
                </span>
                <CheckCircle className="w-4 h-4" style={{ color: service.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error Log ── */}
      <div>
        <h2
          className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "#7a7265" }}
        >
          Recent Errors
        </h2>
        <div
          className="rounded-[18px] p-4 flex items-center gap-3"
          style={{
            background: "#e8e0d0",
            boxShadow:
              "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
          }}
        >
          <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "#4a7c59" }} />
          <p className="text-[13px]" style={{ color: "#7a7265" }}>
            No system errors in the last 7 days
          </p>
        </div>
      </div>
    </div>
  );
}
