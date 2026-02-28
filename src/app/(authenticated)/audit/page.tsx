"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle, Diamond } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

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
  if (actorRole === "AI") return "#b8943f";          // gold — AI Engine
  if (actorRole === "FUND_MANAGER") return "#4a7c59"; // green — FM
  if (actorRole === "CONTRACTOR") return "#7a7265";   // stone — Contractor
  if (actorRole === "AUDITOR") return "#b87a3f";      // amber — Auditor flags
  return "#9a9488";
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
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
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
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* ── Greeting ── */}
      <div>
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#b8943f" }}
        >
          {dayName}, {dateStr}
        </p>
        <h1
          className="text-[24px] leading-tight mt-1"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 800, color: "#1a1714" }}
        >
          {greeting}, {firstName}
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "#7a7265" }}>
          Internal Auditor · Saudi Green Initiative
        </p>
        {/* Audit scope pill */}
        <div
          className="inline-block mt-2 px-3 py-1.5 rounded-full text-[10px] font-medium"
          style={{
            color: "#7a7265",
            background: "#e8e0d0",
            boxShadow:
              "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
          }}
        >
          Monitoring {programCount} program · 1 fund manager
        </div>
      </div>

      {/* ── Flags Strip — 3 inset wells ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "ACTIVE FLAGS",
            value: stats.concordance.flagged,
            color: stats.concordance.flagged > 0 ? "#9c4a4a" : "#1a1714",
          },
          {
            label: "PENDING REVIEWS",
            value: stats.concordance.divergent,
            color: stats.concordance.divergent > 0 ? "#b87a3f" : "#1a1714",
          },
          {
            label: "DECISIONS",
            value: stats.decisionsThisWeek,
            color: "#1a1714",
          },
        ].map((well) => (
          <div
            key={well.label}
            className="p-3 text-center rounded-[18px]"
            style={{
              background: "#e8e0d0",
              boxShadow:
                "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
            }}
          >
            <AnimatedCounter
              end={well.value}
              duration={1000}
              className="font-sans font-extrabold text-[26px] leading-none tabular-nums"
              style={{ color: well.color }}
            />
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#7a7265" }}>
              {well.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Anomaly Card ── */}
      {hasAnomaly ? (
        <div
          className="relative rounded-[18px] p-4 accent-left-amber cursor-pointer"
          style={{
            background: "#e8e0d0",
            boxShadow:
              "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
          }}
          onClick={() => router.push("/audit/decisions")}
        >
          <div className="flex gap-3">
            {/* Amber diamond icon in inset well */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "#e8e0d0",
                boxShadow:
                  "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
              }}
            >
              <Diamond className="w-5 h-5" style={{ color: "#b87a3f" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold" style={{ color: "#1a1714" }}>
                {stats.anomaly!.fmName} rejected an AI-recommended applicant
              </h3>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "#7a7265" }}>
                {stats.anomaly!.contractorName} scored{" "}
                <span className="font-mono font-bold" style={{ color: "#b8943f" }}>
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
      ) : (
        <div
          className="relative rounded-[18px] p-4 accent-left-green"
          style={{
            background: "#e8e0d0",
            boxShadow:
              "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
          }}
        >
          <div className="flex gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "#e8e0d0",
                boxShadow:
                  "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
              }}
            >
              <CheckCircle className="w-5 h-5" style={{ color: "#4a7c59" }} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: "#1a1714" }}>
                No anomalies detected
              </h3>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "#7a7265" }}>
                All {stats.decisionsThisWeek} decisions this week aligned with AI recommendations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity Stream ── */}
      <div>
        <h2
          className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "#7a7265" }}
        >
          Activity Stream
        </h2>
        <div className="space-y-0">
          {stats.platformActions.slice(0, 20).map((pa) => (
            <button
              key={pa.id}
              className="w-full flex items-start gap-3 py-2.5 border-b cursor-pointer text-left"
              style={{ borderColor: "rgba(156,148,130,0.15)" }}
              onClick={() => {
                if (pa.action.includes("Scored") || pa.action.includes("Shortlisted") || pa.action.includes("Rejected") || pa.action.includes("Reviewing")) {
                  router.push("/audit/decisions");
                } else if (pa.action.includes("contract") || pa.action.includes("disbursement")) {
                  router.push("/audit/disbursements");
                }
              }}
            >
              {/* Color dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ background: actionDotColor(pa.actorRole) }}
              />
              <span className="flex-1 min-w-0 text-[13px] leading-snug" style={{ color: "#1a1714" }}>
                {pa.actor} — {pa.action}
              </span>
              <span
                className="text-[11px] font-mono shrink-0 whitespace-nowrap"
                style={{ color: "#9a9488" }}
              >
                {relativeTime(pa.timestamp)}
              </span>
            </button>
          ))}
          {(!stats.platformActions || stats.platformActions.length === 0) && (
            <p className="text-[13px] py-6 text-center" style={{ color: "#9a9488" }}>
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
