"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle, Diamond, Shield } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import DynamicShadowCard from "@/components/DynamicShadowCard";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface PlatformAction {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  timestamp: string;
}

interface AuditorStats {
  totalEvents: number;
  platformActions: PlatformAction[];
  decisionsThisWeek: number;
  concordance: { aligned: number; divergent: number; flagged: number };
  anomaly: {
    contractorName: string;
    rfpTitle: string;
    score: number | null;
    status: string;
    fmName: string;
  } | null;
  fmName: string;
  programs: { id: string; name: string }[];
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

function actionDotColor(actorRole: string): string {
  if (actorRole === "AI") return "#5C6FB5";
  if (actorRole === "FUND_MANAGER") return "#5CA03E";
  if (actorRole === "CONTRACTOR") return "#7B8DC8";
  if (actorRole === "AUDITOR") return "#b87a3f";
  return "#B0B4C2";
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function AuditorHome() {
  const [stats, setStats] = useState<AuditorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Auditor";

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

  /* ── Inject ALIN encoding events into activity stream ── */
  const alinEvents: PlatformAction[] = [
    {
      id: "alin-1",
      actor: "GreenBuild Saudi",
      actorRole: "CONTRACTOR",
      action: "ALIN credential encoded — texture verified",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: "alin-2",
      actor: "EcoRestore Ltd",
      actorRole: "CONTRACTOR",
      action: "ALIN credential encoded — disbursement unlocked",
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
      id: "alin-3",
      actor: "Desert Bloom Co",
      actorRole: "CONTRACTOR",
      action: "ALIN encoding reminder — pending 3 days",
      timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
  ];
  const enrichedActions = [...stats.platformActions];
  if (enrichedActions.length >= 6) {
    enrichedActions.splice(2, 0, alinEvents[0]);
    enrichedActions.splice(5, 0, alinEvents[1]);
    enrichedActions.splice(8, 0, alinEvents[2]);
  } else {
    enrichedActions.push(...alinEvents);
  }

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const programCount = stats.programs?.length ?? 0;
  const hasAnomaly = stats.anomaly !== null;

  return (
    <div className="desktop:grid desktop:gap-6" style={{ gridTemplateColumns: "1fr 360px" }}>
      {/* ══════════ LEFT COLUMN ══════════ */}
      <div className="min-w-0 space-y-5 auditor-home-scroll">
        {/* Greeting */}
        <div className="relative animate-in-1">
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
            {dayName}, {dateStr}
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
            {greeting}, <span style={{ fontWeight: 400 }}>{firstName}</span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "rgba(30, 34, 53, 0.5)",
              marginTop: 2,
            }}
          >
            Internal Auditor · Saudi Green Initiative
          </p>

          {/* Monitoring pill — Fix #4: subtle background tint */}
          <div
            className="inline-block mt-3"
            style={{
              background: "rgba(92, 111, 181, 0.08)",
              border: "1px solid rgba(92, 111, 181, 0.15)",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(30, 34, 53, 0.6)",
            }}
          >
            Monitoring {programCount} program · 1 fund manager
          </div>
        </div>

        {/* Stat Cards — Fix #3: inset neumorphism, left-aligned, full width */}
        <div className="grid grid-cols-3 gap-4 animate-in-2">
          {[
            {
              label: "ACTIVE FLAGS",
              value: stats.concordance.flagged,
              color: stats.concordance.flagged > 0 ? "#9c4a4a" : "rgba(30, 34, 53, 0.75)",
            },
            {
              label: "PENDING REVIEWS",
              value: stats.concordance.divergent,
              color: stats.concordance.divergent > 0 ? "#5C6FB5" : "rgba(30, 34, 53, 0.75)",
            },
            {
              label: "DECISIONS",
              value: stats.decisionsThisWeek,
              color: "rgba(30, 34, 53, 0.75)",
            },
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
              <AnimatedCounter
                end={well.value}
                duration={1000}
                style={{
                  display: "block",
                  fontSize: 36,
                  fontWeight: 300,
                  lineHeight: 1,
                  color: well.color,
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 2.5,
                  color: "rgba(30, 34, 53, 0.5)",
                  lineHeight: 1,
                  marginTop: 8,
                }}
              >
                {well.label}
              </p>
            </div>
          ))}
        </div>

        {/* Anomaly Card — Fix #1: inset neumorphism when no anomaly */}
        {hasAnomaly ? (
          <DynamicShadowCard onClick={() => router.push("/audit/decisions")} intensity={2} className="animate-in-3">
            <div
              className="relative rounded-[18px] p-4 cursor-pointer overflow-hidden"
              style={{
                background: "var(--bg-light)",
                boxShadow: "var(--raise)",
                borderLeft: "3px solid rgba(184, 122, 63, 0.4)",
              }}
              onClick={() => router.push("/audit/decisions")}
            >
              <div className="flex gap-3 relative z-[1]">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(228, 231, 238, 0.5)",
                    boxShadow: "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
                  }}
                >
                  <Diamond className="w-5 h-5" style={{ color: "#b87a3f" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                    {stats.anomaly!.fmName} rejected an AI-recommended applicant
                  </h3>
                  <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {stats.anomaly!.contractorName} scored{" "}
                    <span className="font-semibold" style={{ color: "var(--accent)" }}>
                      {Math.round(stats.anomaly!.score ?? 0)}
                    </span>{" "}
                    (Recommend) but was rejected. This is the first divergent decision for this RFP.
                  </p>
                  <p className="text-[12px] mt-2 font-semibold" style={{ color: "#b87a3f" }}>
                    Investigate →
                  </p>
                </div>
              </div>
            </div>
          </DynamicShadowCard>
        ) : (
          <div
            className="animate-in-3"
            style={{
              borderRadius: 18,
              padding: 16,
              background: "rgba(228, 231, 238, 0.5)",
              boxShadow:
                "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
              borderLeft: "3px solid rgba(92, 160, 62, 0.3)",
            }}
          >
            <div className="flex gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(92, 160, 62, 0.08)",
                  borderRadius: 12,
                }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: "#5CA03E" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                  No anomalies detected
                </h3>
                <p style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                  All {stats.decisionsThisWeek} decisions this week aligned with AI recommendations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ALIN Encoding Status Card */}
        <div
          className="animate-in-4"
          style={{
            borderRadius: 18,
            padding: 16,
            background: "rgba(228, 231, 238, 0.5)",
            boxShadow:
              "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4" style={{ color: "rgba(74, 140, 106, 0.7)" }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2.5,
                color: "rgba(30, 34, 53, 0.5)",
              }}
            >
              ALIN ENCODING STATUS
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "ENCODED", value: 4, color: "rgba(74, 140, 106, 0.9)" },
              { label: "PENDING", value: 1, color: "rgba(175, 148, 63, 0.9)" },
              { label: "FLAGGED", value: 0, color: "var(--text-tertiary)" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  textAlign: "center",
                  padding: "10px 8px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.5)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 24,
                    fontWeight: 300,
                    lineHeight: 1,
                    color: s.color,
                  }}
                >
                  {s.value}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    color: "rgba(30, 34, 53, 0.45)",
                    marginTop: 6,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: 11,
              lineHeight: 1.5,
              color: "rgba(30, 34, 53, 0.45)",
              marginTop: 10,
            }}
          >
            ALIN credential textures protect disbursement integrity across enrolled contractors.
          </p>
        </div>

        {/* Activity Stream — mobile/tablet only */}
        <div className="desktop:hidden">
          <ActivityStream actions={enrichedActions} router={router} />
        </div>
      </div>

      {/* ══════════ RIGHT COLUMN — Activity Stream (desktop only) ══════════ */}
      <div className="hidden desktop:block desktop:self-start desktop:sticky desktop:top-0">
        <ActivityStream actions={enrichedActions} router={router} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity Stream subcomponent — Fix #5 possessive, Fix #6 polish    */
/* ------------------------------------------------------------------ */
function ActivityStream({ actions, router }: { actions: PlatformAction[]; router: ReturnType<typeof useRouter> }) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: 20,
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 4px 16px rgba(30, 34, 53, 0.06)",
      }}
    >
      <h2
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 2.5,
          color: "rgba(30, 34, 53, 0.55)",
          marginBottom: 14,
        }}
      >
        ACTIVITY STREAM
      </h2>
      <div className="relative" style={{ maxHeight: 420, overflowY: "auto" }}>
        <div>
          {actions.slice(0, 20).map((pa, idx) => (
            <button
              key={pa.id}
              className="w-full flex items-start gap-3 cursor-pointer text-left"
              style={{
                padding: "10px 0",
                borderBottom: idx < Math.min(actions.length, 20) - 1 ? "1px solid rgba(30,34,53,0.06)" : "none",
                background: "none",
                border: idx < Math.min(actions.length, 20) - 1 ? undefined : "none",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
              }}
              onClick={() => {
                if (pa.action.includes("Scored") || pa.action.includes("Shortlisted") || pa.action.includes("Rejected") || pa.action.includes("Reviewing")) {
                  router.push("/audit/decisions");
                } else if (pa.action.includes("contract") || pa.action.includes("disbursement")) {
                  router.push("/audit/disbursements");
                }
              }}
            >
              <span
                className="shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: actionDotColor(pa.actorRole),
                  marginTop: 5,
                }}
              />
              <span
                className="flex-1 min-w-0"
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: "rgba(30, 34, 53, 0.75)",
                }}
              >
                {pa.actor} — {pa.action}
              </span>
              <span
                className="shrink-0 whitespace-nowrap"
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "rgba(30, 34, 53, 0.35)",
                }}
              >
                {relativeTime(pa.timestamp)}
              </span>
            </button>
          ))}
          {(!actions || actions.length === 0) && (
            <p style={{ fontSize: 13, padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)" }}>
              No recent activity
            </p>
          )}
        </div>
        {/* Bottom fade gradient for scroll hint */}
        {actions.length > 8 && (
          <div
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              height: 32,
              background: "linear-gradient(transparent, rgba(255, 255, 255, 0.85))",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
