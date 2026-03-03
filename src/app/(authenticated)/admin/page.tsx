"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Cpu, CheckCircle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import DynamicShadowCard from "@/components/DynamicShadowCard";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface AuditActivity {
  id: string;
  action: string;
  timestamp: string;
  actor?: { name: string | null; email: string; role: string };
}

interface AdminStats {
  userCount: number;
  orgCount: number;
  programCount: number;
  auditCount: number;
  scoredAppCount: number;
  lastScoringEvent: { timestamp: string; action: string } | null;
  pendingInvites: number;
  activeToday: number;
  issueCount: number;
  aiEngineStatus: string;
  roleCountMap: Record<string, number>;
  adminName: string;
  recentActivity: AuditActivity[];
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

function roleDotColor(role: string): string {
  if (role === "FUND_MANAGER") return "#5CA03E";
  if (role === "CONTRACTOR") return "#7B8DC8";
  if (role === "AUDITOR") return "#b87a3f";
  if (role === "ADMIN") return "#1E2235";
  return "#B0B4C2";
}

function formatAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Auth ", "")
    .replace("Ai ", "AI ");
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function AdminHome() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const firstName = stats?.adminName?.split(" ")[0] ?? "Admin";

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

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const aiStatus = stats.aiEngineStatus;
  const statusColor = aiStatus === "operational" ? "#5CA03E" : aiStatus === "processing" ? "#5C6FB5" : aiStatus === "degraded" ? "#b87a3f" : "#9c4a4a";
  const statusLabel = aiStatus === "operational" ? "Operational" : aiStatus === "processing" ? "Processing" : aiStatus === "degraded" ? "Degraded" : "Offline";
  const accentClass = aiStatus === "operational" || aiStatus === "processing" ? "accent-left-green" : "accent-left-amber";

  const lastScoringAgo = stats.lastScoringEvent
    ? relativeTime(stats.lastScoringEvent.timestamp)
    : "Never";

  return (
    <div className="desktop:flex desktop:gap-8">
      {/* ── Primary Zone ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5 desktop:max-w-[720px] pb-[100px] desktop:pb-0">
        {/* Greeting + Vision 2030 watermark */}
        <div className="relative mb-8 animate-in-1">
          <p className="greeting-date">
            {dayName}, {dateStr}
          </p>
          <div className="mt-1">
            <span className="greeting-prefix">{greeting},</span>{" "}
            <span className="greeting-name greeting-underline">{firstName}</span>
          </div>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Platform Administrator · Saudi Green Initiative
          </p>
        </div>

        {/* Action Items Strip — 3 inset wells */}
        <div className="grid grid-cols-3 gap-3 animate-in-2">
          {[
            {
              label: "PENDING INVITES",
              value: stats.pendingInvites,
              color: stats.pendingInvites > 0 ? "#b87a3f" : "var(--text-primary)",
            },
            {
              label: "ACTIVE TODAY",
              value: stats.activeToday,
              color: "var(--text-primary)",
            },
            {
              label: "ISSUES",
              value: stats.issueCount,
              color: stats.issueCount > 0 ? "#9c4a4a" : "var(--text-primary)",
            },
          ].map((well) => (
            <DynamicShadowCard key={well.label} inset intensity={2} className="p-3 text-center rounded-[18px]">
              <div
                className="p-3 text-center rounded-[18px]"
                style={{
                  background: "var(--bg-dark)",
                  boxShadow: "var(--press)",
                }}
              >
                <AnimatedCounter
                  end={well.value}
                  duration={1000}
                  className="font-display font-light text-[36px] leading-none tabular-nums"
                  style={{ color: well.color }}
                />
                <p className="text-eyebrow mt-1">
                  {well.label}
                </p>
              </div>
            </DynamicShadowCard>
          ))}
        </div>

        {/* System Pulse Card — with corner seal */}
        <DynamicShadowCard intensity={2} className="animate-in-3">
          <div
            className={`relative rounded-[18px] p-4 ${accentClass} overflow-hidden`}
            style={{
              background: "var(--bg-light)",
              boxShadow: "var(--raise)",
            }}
          >
            <div className="flex gap-3 relative z-[1]">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "var(--bg-dark)",
                  boxShadow: "var(--press)",
                }}
              >
                {aiStatus === "operational" ? (
                  <CheckCircle className="w-5 h-5" style={{ color: statusColor }} />
                ) : (
                  <Cpu className="w-5 h-5" style={{ color: statusColor }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                    AI Engine: {statusLabel}
                  </h3>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background: statusColor,
                      boxShadow: aiStatus === "operational" ? `0 0 8px ${statusColor}60` : "none",
                    }}
                  />
                </div>
                <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Last scoring run: <span className="font-semibold" style={{ color: "var(--accent)" }}>{lastScoringAgo}</span>
                  {" · "}
                  {stats.scoredAppCount} application{stats.scoredAppCount !== 1 ? "s" : ""} scored
                </p>
                {aiStatus !== "operational" && (
                  <p
                    className="text-[12px] mt-2 font-semibold cursor-pointer"
                    style={{ color: "#b87a3f" }}
                    onClick={() => router.push("/admin/system")}
                  >
                    Investigate →
                  </p>
                )}
              </div>
            </div>
          </div>
        </DynamicShadowCard>

        {/* Activity Stream — mobile/tablet only (on desktop it's in the side zone) */}
        <div className="desktop:hidden">
          <ActivityStream events={stats.recentActivity} router={router} />
        </div>
      </div>

      {/* ── Side Zone (desktop only) ─────────────────────────── */}
      <div className="hidden desktop:block desktop:w-[340px] desktop:shrink-0 desktop:sticky desktop:top-0 desktop:self-start space-y-5 pt-1 activity-zone">
        <ActivityStream events={stats.recentActivity} router={router} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity Stream subcomponent                                        */
/* ------------------------------------------------------------------ */
function ActivityStream({ events, router }: { events: AuditActivity[]; router: ReturnType<typeof useRouter> }) {
  return (
    <div>
      <h2 className="activity-zone-title mb-3">
        Activity Stream
      </h2>
      <div className="space-y-0">
        {events.slice(0, 20).map((event) => (
          <button
            key={event.id}
            className="w-full flex items-start gap-3 py-2.5 border-b cursor-pointer text-left"
            style={{ borderColor: "rgba(160,166,185,0.12)" }}
            onClick={() => router.push("/admin/users")}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
              style={{ background: roleDotColor(event.actor?.role ?? "") }}
            />
            <span className="flex-1 min-w-0 activity-zone-event leading-snug">
              {event.actor?.name ?? "System"} — {formatAction(event.action)}
            </span>
            <span className="activity-zone-time shrink-0 whitespace-nowrap">
              {relativeTime(event.timestamp)}
            </span>
          </button>
        ))}
        {(!events || events.length === 0) && (
          <p className="text-[13px] py-6 text-center" style={{ color: "var(--text-tertiary)" }}>
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}
