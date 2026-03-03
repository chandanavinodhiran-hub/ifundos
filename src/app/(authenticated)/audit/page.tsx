"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle, Diamond } from "lucide-react";
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

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const programCount = stats.programs?.length ?? 0;
  const hasAnomaly = stats.anomaly !== null;

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
            Internal Auditor · Saudi Green Initiative
          </p>
          {/* Audit scope pill */}
          <div
            className="inline-block mt-2 px-3 py-1.5 rounded-full text-[10px] font-medium"
            style={{
              color: "var(--text-secondary)",
              background: "var(--bg-dark)",
              boxShadow: "var(--press)",
            }}
          >
            Monitoring {programCount} program · 1 fund manager
          </div>
        </div>

        {/* Flags Strip — 3 standalone inset wells */}
        <div className="grid grid-cols-3 gap-4 animate-in-2">
          {[
            {
              label: "ACTIVE FLAGS",
              value: stats.concordance.flagged,
              color: stats.concordance.flagged > 0 ? "#9c4a4a" : "var(--text-primary)",
            },
            {
              label: "PENDING REVIEWS",
              value: stats.concordance.divergent,
              color: stats.concordance.divergent > 0 ? "var(--accent)" : "var(--text-primary)",
            },
            {
              label: "DECISIONS",
              value: stats.decisionsThisWeek,
              color: "var(--text-primary)",
            },
          ].map((well) => (
            <div
              key={well.label}
              className="p-5 text-center rounded-[18px]"
              style={{
                background: "rgba(228,231,238,0.5)",
                boxShadow: "inset 8px 8px 20px rgba(155,161,180,0.35), inset -8px -8px 20px rgba(255,255,255,0.7)",
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
          ))}
        </div>

        {/* Anomaly Card — with corner seal */}
        {hasAnomaly ? (
          <DynamicShadowCard onClick={() => router.push("/audit/decisions")} intensity={2} className="animate-in-3">
            <div
              className="relative rounded-[18px] p-4 accent-left-amber cursor-pointer overflow-hidden"
              style={{
                background: "var(--bg-light)",
                boxShadow: "var(--raise)",
              }}
              onClick={() => router.push("/audit/decisions")}
            >
              <div className="flex gap-3 relative z-[1]">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--bg-dark)",
                    boxShadow: "var(--press)",
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
          <DynamicShadowCard intensity={1} className="animate-in-3">
            <div
              className="relative rounded-[18px] p-4 accent-left-green"
              style={{
                background: "var(--bg-light)",
                boxShadow: "var(--raise)",
              }}
            >
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--bg-dark)",
                    boxShadow: "var(--press)",
                  }}
                >
                  <CheckCircle className="w-5 h-5" style={{ color: "#5CA03E" }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                    No anomalies detected
                  </h3>
                  <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    All {stats.decisionsThisWeek} decisions this week aligned with AI recommendations.
                  </p>
                </div>
              </div>
            </div>
          </DynamicShadowCard>
        )}

        {/* Activity Stream — mobile/tablet only */}
        <div className="desktop:hidden activity-zone">
          <ActivityStream actions={stats.platformActions} router={router} />
        </div>
      </div>

      {/* ── Side Zone (desktop only) ─────────────────────────── */}
      <div className="hidden desktop:block desktop:w-[340px] desktop:shrink-0 desktop:sticky desktop:top-0 desktop:self-start space-y-5 pt-1 activity-zone">
        <ActivityStream actions={stats.platformActions} router={router} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity Stream subcomponent                                        */
/* ------------------------------------------------------------------ */
function ActivityStream({ actions, router }: { actions: PlatformAction[]; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="activity-stream-card">
      <h2 className="activity-zone-title mb-4">
        Activity Stream
      </h2>
      <div className="activity-stream-scroll relative">
        <div className="activity-stream-list">
          {actions.slice(0, 20).map((pa, idx) => (
            <button
              key={pa.id}
              className="w-full flex items-start gap-3 cursor-pointer text-left"
              style={{
                padding: "13px 0",
                borderBottom: idx < Math.min(actions.length, 20) - 1 ? "1px solid rgba(30,34,53,0.06)" : "none",
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
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ background: actionDotColor(pa.actorRole) }}
              />
              <span className="flex-1 min-w-0 activity-zone-event leading-snug">
                {pa.actor} — {pa.action}
              </span>
              <span className="activity-zone-time shrink-0 whitespace-nowrap">
                {relativeTime(pa.timestamp)}
              </span>
            </button>
          ))}
          {(!actions || actions.length === 0) && (
            <p className="text-[13px] py-6 text-center" style={{ color: "var(--text-tertiary)" }}>
              No recent activity
            </p>
          )}
        </div>
        {/* Bottom fade gradient for overflow */}
        <div className="activity-stream-fade" />
      </div>
    </div>
  );
}
