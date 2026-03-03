"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Cpu, CheckCircle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

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

function activityDotColor(action: string, role: string): string {
  const a = action.toLowerCase();
  if (a.includes("shortlist") || a.includes("register") || a.includes("complete")) return "rgba(74, 140, 106, 0.85)";
  if (a.includes("score") || a.includes("ai")) return "rgba(92, 111, 181, 0.85)";
  if (a.includes("login") || a.includes("auth")) return "rgba(30, 34, 53, 0.4)";
  if (role === "FUND_MANAGER") return "rgba(92, 111, 181, 0.7)";
  if (role === "CONTRACTOR") return "rgba(75, 165, 195, 0.7)";
  if (role === "AUDITOR") return "rgba(184, 148, 63, 0.7)";
  return "rgba(30, 34, 53, 0.3)";
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
  const statusColor = aiStatus === "operational" ? "rgba(74, 140, 106, 0.85)" : aiStatus === "processing" ? "#5C6FB5" : aiStatus === "degraded" ? "rgba(175, 148, 63, 0.85)" : "#9c4a4a";
  const statusLabel = aiStatus === "operational" ? "Operational" : aiStatus === "processing" ? "Processing" : aiStatus === "degraded" ? "Degraded" : "Offline";

  const lastScoringAgo = stats.lastScoringEvent
    ? relativeTime(stats.lastScoringEvent.timestamp)
    : "Never";

  return (
    <div className="desktop:flex desktop:gap-8">
      {/* ── Primary Zone ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5 desktop:max-w-[720px] pb-[100px] desktop:pb-0">
        {/* Greeting */}
        <div className="relative mb-8 animate-in-1">
          <p className="greeting-date">
            {dayName}, {dateStr}
          </p>
          <div className="mt-1">
            <span className="greeting-prefix">{greeting},</span>{" "}
            <span className="greeting-name greeting-underline">{firstName}</span>
          </div>
          <p className="text-[13px] mt-0.5" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
            Platform Administrator · Saudi Green Initiative
          </p>
        </div>

        {/* Action Items Strip — 3 standalone inset wells */}
        <div className="grid grid-cols-3 gap-4 animate-in-2">
          {[
            {
              label: "PENDING INVITES",
              value: stats.pendingInvites,
              color: stats.pendingInvites > 0 ? "rgba(175, 148, 63, 0.85)" : "rgba(30, 34, 53, 0.75)",
            },
            {
              label: "ACTIVE TODAY",
              value: stats.activeToday,
              color: "rgba(30, 34, 53, 0.75)",
            },
            {
              label: "ISSUES",
              value: stats.issueCount,
              color: stats.issueCount > 0 ? "rgba(175, 148, 63, 0.85)" : "rgba(30, 34, 53, 0.75)",
            },
          ].map((well) => (
            <div
              key={well.label}
              className="p-5 text-center rounded-[18px]"
              style={{
                background: "rgba(228, 231, 238, 0.5)",
                boxShadow:
                  "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
              }}
            >
              <AnimatedCounter
                end={well.value}
                duration={1000}
                className="font-light text-[36px] leading-none tabular-nums"
                style={{ color: well.color, fontFamily: "'DM Sans', sans-serif" }}
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
                {well.label}
              </p>
            </div>
          ))}
        </div>

        {/* AI Engine Banner — raised neumorphic card with green accent */}
        <div
          className="relative rounded-[20px] p-5 overflow-hidden animate-in-3"
          style={{
            background: "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(12px)",
            borderTop: "1.5px solid rgba(255, 255, 255, 0.8)",
            borderLeft: "1.5px solid rgba(255, 255, 255, 0.7)",
            borderBottom: "1.5px solid rgba(255, 255, 255, 0.15)",
            borderRight: "1.5px solid rgba(255, 255, 255, 0.15)",
            boxShadow:
              "10px 10px 25px rgba(155, 161, 180, 0.4), -10px -10px 25px rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* Green left accent */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "3.5px",
              background: "rgba(74, 140, 106, 0.75)",
              boxShadow: "0 0 6px rgba(74, 140, 106, 0.12)",
              borderRadius: "20px 0 0 20px",
            }}
          />
          <div className="flex gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(228, 231, 238, 0.5)",
                boxShadow:
                  "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
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
                <h3
                  className="text-[15px]"
                  style={{ color: "rgba(30, 34, 53, 0.85)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}
                >
                  AI Engine: {statusLabel}
                </h3>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: statusColor,
                    boxShadow: aiStatus === "operational" ? `0 0 8px rgba(74, 140, 106, 0.4)` : "none",
                  }}
                />
              </div>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                Last scoring run: <span className="font-semibold" style={{ color: "var(--accent)" }}>{lastScoringAgo}</span>
                {" · "}
                {stats.scoredAppCount} application{stats.scoredAppCount !== 1 ? "s" : ""} scored
              </p>
              {aiStatus !== "operational" && (
                <p
                  className="text-[12px] mt-2 font-semibold cursor-pointer"
                  style={{ color: "rgba(175, 148, 63, 0.85)" }}
                  onClick={() => router.push("/admin/system")}
                >
                  Investigate →
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Activity Stream — mobile/tablet only */}
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
    <div
      className="rounded-[20px] p-5"
      style={{
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(12px)",
        borderTop: "1.5px solid rgba(255, 255, 255, 0.8)",
        borderLeft: "1.5px solid rgba(255, 255, 255, 0.7)",
        borderBottom: "1.5px solid rgba(255, 255, 255, 0.15)",
        borderRight: "1.5px solid rgba(255, 255, 255, 0.15)",
        boxShadow:
          "10px 10px 25px rgba(155, 161, 180, 0.4), -10px -10px 25px rgba(255, 255, 255, 0.8)",
      }}
    >
      <h2
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "2.5px",
          color: "rgba(30, 34, 53, 0.5)",
          fontFamily: "'DM Sans', sans-serif",
          textTransform: "uppercase" as const,
          marginBottom: "16px",
        }}
      >
        Activity Stream
      </h2>
      <div className="relative">
        <div
          style={{
            maxHeight: "520px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(155,161,180,0.25) transparent",
            paddingRight: "2px",
          }}
        >
          {events.slice(0, 20).map((event, idx) => (
            <button
              key={event.id}
              className="w-full flex items-start gap-3 cursor-pointer text-left"
              style={{
                padding: "13px 0",
                borderBottom:
                  idx < Math.min(events.length, 20) - 1
                    ? "1px solid rgba(30, 34, 53, 0.06)"
                    : "none",
              }}
              onClick={() => router.push("/admin/users")}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ background: activityDotColor(event.action, event.actor?.role ?? "") }}
              />
              <span
                className="flex-1 min-w-0 text-[13px] leading-snug"
                style={{ color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}
              >
                {event.actor?.name ?? "System"} — {formatAction(event.action)}
              </span>
              <span
                className="shrink-0 whitespace-nowrap"
                style={{
                  fontSize: "11px",
                  color: "rgba(30, 34, 53, 0.3)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  paddingRight: "16px",
                }}
              >
                {relativeTime(event.timestamp)}
              </span>
            </button>
          ))}
          {(!events || events.length === 0) && (
            <p className="text-[13px] py-6 text-center" style={{ color: "rgba(30, 34, 53, 0.3)" }}>
              No recent activity
            </p>
          )}
        </div>
        {/* Bottom fade gradient */}
        {events.length > 8 && (
          <div
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40px",
              background: "linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.55))",
              pointerEvents: "none",
              marginTop: "-40px",
            }}
          />
        )}
      </div>
    </div>
  );
}
