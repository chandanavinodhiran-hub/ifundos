"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { NeuToggle } from "@/components/ui/neu-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { AIScreeningModal } from "@/components/ai/ai-screening-modal";
import {
  Loader2,
  ArrowRight,
  Check,
  Undo2,
  Eye,
  XCircle,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "@/components/navigator/navigator-context";
import DynamicShadowCard from "@/components/DynamicShadowCard";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Application {
  id: string;
  status: string;
  compositeScore: number | null;
  dimensionScores: string | null;
  confidenceLevels: string | null;
  aiFindings: string | null;
  proposalData: string | null;
  proposedBudget: number;
  submittedAt: string | null;
  shortlistedAt: string | null;
  questionnaireStatus: string;
  createdAt: string;
  rfp: {
    id: string;
    title: string;
    status: string;
    deadline: string | null;
  };
  organization: {
    id: string;
    name: string;
    type: string;
    trustTier: string;
  };
  decisionPacket?: {
    id: string;
    narrative: string | null;
    recommendation: string | null;
    executiveSummary: string | null;
    strengths: string | null;
    risks: string | null;
    questionsForContractor: string | null;
    impactAssessment: string | null;
    createdByModel: string | null;
  } | null;
}

type Decision = "shortlisted" | "info_requested" | "rejected";

interface DecidedApp {
  id: string;
  decision: Decision;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TIER_LABELS: Record<string, string> = {
  T0: "Unrated",
  T1: "Bronze",
  T2: "Silver",
  T3: "Gold",
  T4: "Platinum",
};

function verdictLabel(score: number | null, rec?: string | null): string {
  if (rec === "RECOMMEND") return "Recommend";
  if (rec === "RECOMMEND_WITH_CONDITIONS") return "Caution";
  if (rec === "DO_NOT_RECOMMEND") return "Not Rec.";
  if (score == null) return "Pending";
  if (score >= 80) return "Recommend";
  if (score >= 50) return "Caution";
  return "Not Rec.";
}

function accentLeftClass(score: number | null, rec?: string | null): string {
  if (rec === "RECOMMEND" || (score != null && score >= 75)) return "accent-left-gold";
  if (rec === "RECOMMEND_WITH_CONDITIONS" || (score != null && score >= 50)) return "accent-left-amber";
  if (rec === "DO_NOT_RECOMMEND" || (score != null && score < 50)) return "accent-left-critical";
  return "accent-left-gold";
}

function safeJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}

/* Conversational AI brief — specific, actionable language */
function conversationalBrief(
  rec: string | null | undefined,
  summary: string | null | undefined,
  narrative: string | null | undefined,
  score: number | null,
  budget: number
): string {
  const raw = summary || narrative || "";
  const budgetStr = budget > 0 ? formatSAR(budget) : "";

  /* If we have real AI narrative, trim to ~200 chars and make it conversational */
  if (raw.length > 0) {
    const trimmed = raw.length > 200 ? raw.slice(0, 200).replace(/\s+\S*$/, "") + "..." : raw;
    return trimmed;
  }

  /* Fallback: generate conversational text from structured fields */
  if (rec === "RECOMMEND") {
    return `Strong vision alignment and a competitive budget${budgetStr ? ` at ${budgetStr}` : ""}. The methodology is solid${score ? `, scoring ${score}/100` : ""}. Worth shortlisting — flag any methodology gaps during interview.`;
  }
  if (rec === "RECOMMEND_WITH_CONDITIONS") {
    return `Decent proposal${budgetStr ? ` at ${budgetStr}` : ""}${score ? `, scoring ${score}/100` : ""}. Some conditions need addressing before moving forward. Review the risk factors and request clarification where needed.`;
  }
  if (rec === "DO_NOT_RECOMMEND") {
    return `Below threshold${budgetStr ? ` at ${budgetStr}` : ""}${score ? ` with a score of ${score}/100` : ""}. The proposal has significant gaps that would need substantial revision. Consider passing on this one.`;
  }
  return `Analysis in progress${budgetStr ? ` — proposed budget ${budgetStr}` : ""}${score ? `, current score ${score}/100` : ""}. Full brief will be available once AI screening completes.`;
}

/* ------------------------------------------------------------------ */
/* Mini Score Arc — inline SVG circular gauge                          */
/* ------------------------------------------------------------------ */

let scoreArcCounter = 0;

function ScoreArc({ score, size = 72 }: { score: number; size?: number }) {
  const [gradId] = useState(() => `scoreGrad_${++scoreArcCounter}`);
  const r = 26;
  const circumference = 2 * Math.PI * r; // ~163.4
  const dashLen = (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" className="-rotate-90">
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="#E2E5ED" strokeWidth="5"
          style={{ filter: "drop-shadow(1px 1px 2px rgba(155,161,180,0.3))" }}
        />
        <circle
          cx="32" cy="32" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          stroke={`url(#${gradId})`} strokeDasharray={`${dashLen} ${circumference}`}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5C6FB5" />
            <stop offset="100%" stopColor="#5CA03E" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 22,
          fontWeight: 300,
          color: "var(--accent)",
        }}
      >
        {Math.round(score)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recommend Label                                                     */
/* ------------------------------------------------------------------ */

function RecommendLabel({ rec }: { rec: string | null | undefined }) {
  if (rec === "RECOMMEND") {
    return (
      <span
        className="flex items-center gap-1"
        style={{ color: "#5CA03E", fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#5CA03E" }} />
        RECOMMEND
      </span>
    );
  }
  if (rec === "RECOMMEND_WITH_CONDITIONS") {
    return (
      <span
        className="flex items-center gap-1"
        style={{ color: "#b87a3f", fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#b87a3f" }} />
        CAUTION
      </span>
    );
  }
  if (rec === "DO_NOT_RECOMMEND") {
    return (
      <span
        className="flex items-center gap-1"
        style={{ color: "#9c4a4a", fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9c4a4a" }} />
        NOT REC.
      </span>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Dimension Bar — neumorphic track + fill                             */
/* ------------------------------------------------------------------ */

function DimensionBar({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(Math.min(value, 100)), delay + 100);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const isAmber = value < 65;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="label-style">{label}</span>
        <span className="mono-data">{value}</span>
      </div>
      <div className="neu-progress-track" style={{ height: 6 }}>
        <div
          className={cn(
            "h-full rounded-lg transition-all ease-out",
            isAmber ? "neu-progress-fill-amber" : "neu-progress-fill"
          )}
          style={{
            width: `${width}%`,
            transitionDuration: "0.8s",
            background: isAmber
              ? "linear-gradient(90deg, #b87a3f, #d4a665)"
              : "linear-gradient(90deg, #5C6FB5, #5CA03E)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline Page                                                       */
/* ------------------------------------------------------------------ */

export default function PipelinePage() {
  const router = useRouter();
  const { setMode } = useNavigator();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [screeningApp, setScreeningApp] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState("to_review");
  const [decidedApps, setDecidedApps] = useState<DecidedApp[]>([]);
  const [slidingOutId, setSlidingOutId] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<{ appId: string; orgName: string; decision: Decision; timerId: ReturnType<typeof setTimeout> } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  /* TTS: speak the AI brief aloud */
  function speakBrief(app: Application) {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const scores = safeJSON<Record<string, number>>(app.dimensionScores, {});
    const rec = app.decisionPacket?.recommendation;
    let text = `AI Decision Brief for ${app.organization.name}. `;
    text += `Overall score: ${Math.round(app.compositeScore ?? 0)} out of 100. `;

    if (scores.procurement != null) text += `Procurement: ${Math.round(scores.procurement)}. `;
    if (scores.vision != null) text += `Vision: ${Math.round(scores.vision)}. `;
    if (scores.viability != null) text += `Viability: ${Math.round(scores.viability)}. `;
    if (scores.impact != null) text += `Impact: ${Math.round(scores.impact)}. `;

    const briefText = conversationalBrief(
      rec,
      app.decisionPacket?.executiveSummary,
      app.decisionPacket?.narrative,
      app.compositeScore,
      app.proposedBudget
    );
    if (briefText) text += briefText;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  /* Cleanup TTS on unmount */
  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .catch(() => setError("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const displayApps = useMemo(() => {
    const decidedIds = new Set(decidedApps.map((d) => d.id));
    let list = applications
      .filter((a) => a.compositeScore != null || a.status !== "DRAFT")
      .sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0));
    if (viewMode === "to_review") {
      list = list.filter((a) => !decidedIds.has(a.id));
    }
    return list;
  }, [applications, viewMode, decidedApps]);

  const totalToReview = applications.filter(
    (a) => a.compositeScore != null || a.status !== "DRAFT"
  ).length;
  const reviewed = decidedApps.length;
  const remaining = totalToReview - reviewed;
  const progressPct = totalToReview > 0 ? (reviewed / totalToReview) * 100 : 0;

  const handleDecision = useCallback(
    (app: Application, decision: Decision) => {
      setSlidingOutId(app.id);

      setTimeout(() => {
        setDecidedApps((prev) => [
          ...prev,
          { id: app.id, decision, timestamp: Date.now() },
        ]);
        setSlidingOutId(null);
        setExpandedId(null);

        /* Undo toast with 4s auto-dismiss */
        setUndoToast((prev) => {
          if (prev) clearTimeout(prev.timerId);
          const timerId = setTimeout(() => setUndoToast(null), 4000);
          return { appId: app.id, orgName: app.organization.name, decision, timerId };
        });
      }, 500);
    },
    []
  );

  const handleUndo = useCallback((appId: string) => {
    setDecidedApps((prev) => prev.filter((d) => d.id !== appId));
    setUndoToast((prev) => {
      if (prev && prev.appId === appId) {
        clearTimeout(prev.timerId);
        return null;
      }
      return prev;
    });
  }, []);

  const handleExpand = useCallback((appId: string) => {
    setExpandedId((prev) => (prev === appId ? null : appId));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-full px-6 desktop:px-10 page-enter">
        <div className="-mx-4 px-4 pt-1 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="skeleton-bar h-2 w-16 mb-2" style={{ opacity: 0.4 }} />
              <div className="skeleton-bar h-6 w-40" style={{ opacity: 0.5 }} />
            </div>
            <div className="text-right">
              <div className="skeleton-bar h-4 w-12 mb-1 ml-auto" style={{ opacity: 0.4 }} />
              <div className="skeleton-bar h-2 w-16 ml-auto" style={{ opacity: 0.3 }} />
            </div>
          </div>
          <div className="skeleton-bar h-1 w-full mb-3" style={{ opacity: 0.3 }} />
          <div className="skeleton-card h-10 w-full" />
        </div>
        <div className="space-y-3.5">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card p-5" style={{ height: 100 }}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="skeleton-bar h-4 w-40 mb-2" style={{ opacity: 0.5 }} />
                  <div className="skeleton-bar h-3 w-24 mb-1" style={{ opacity: 0.3 }} />
                  <div className="skeleton-bar h-2 w-16" style={{ opacity: 0.2 }} />
                </div>
                <div className="skeleton-circle w-16 h-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p style={{ color: "#9c4a4a" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full px-6 desktop:px-10">
      {/* -- Undo Toast -- */}
      {undoToast && (
        <div className="undo-toast">
          <div className={`toast-icon ${undoToast.decision === "rejected" ? "icon-reject" : "icon-success"}`}>
            {undoToast.decision === "rejected" ? (
              <XCircle className="w-3 h-3" style={{ stroke: "#9c4a4a", strokeWidth: 2.5 }} />
            ) : (
              <Check className="w-3 h-3" style={{ stroke: "#4a7c59", strokeWidth: 2.5 }} />
            )}
          </div>
          <span className="toast-text">
            {undoToast.orgName} — {undoToast.decision === "shortlisted" ? "Shortlisted" : undoToast.decision === "rejected" ? "Rejected" : "Info Requested"}
          </span>
          <button onClick={() => handleUndo(undoToast.appId)} className="undo-btn">
            Undo
          </button>
        </div>
      )}

      {/* -- Header -- */}
      <div className="stagger-1 animate-in-1 -mx-4 px-4 pt-1 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="label-style mb-0.5">Pipeline</p>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 300, color: "var(--text-primary)" }}>Review Applications</h1>
          </div>
          <div className="text-right">
            <p className="mono-data" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {remaining} of {totalToReview}
            </p>
            <p style={{ fontSize: 10, color: "var(--text-tertiary)" }}>to review</p>
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="neu-progress-track mb-3" style={{ height: 4 }}>
          <div
            className="neu-progress-fill h-full rounded-lg transition-all ease-out"
            style={{
              width: `${progressPct}%`,
              transitionDuration: "0.6s",
              background: "linear-gradient(90deg, #5C6FB5, #5CA03E)",
            }}
          />
        </div>
        <NeuToggle
          options={[
            { label: "To Review", value: "to_review", count: remaining },
            { label: "All Decisions", value: "all" },
          ]}
          value={viewMode}
          onChange={setViewMode}
          className="w-full"
        />
      </div>

      {/* -- Card Stack -- */}
      {displayApps.length === 0 ? (
        viewMode === "to_review" && reviewed > 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="empty-icon-well">
              <Check className="w-7 h-7" style={{ stroke: "#4a7c59", strokeWidth: 2 }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>All Reviewed</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center" }}>
              You&apos;ve reviewed all {totalToReview} applications.
              <br />
              Switch to &ldquo;All Decisions&rdquo; to see your choices.
            </p>
          </div>
        ) : (
          <EmptyState
            icon={Eye}
            title="No applications yet"
            description="Applications will appear here once contractors submit proposals to your RFPs."
          />
        )
      ) : (
        <div className="stagger-2 animate-in-3 space-y-3.5">
          {displayApps.map((app) => {
            const isExpanded = expandedId === app.id;
            const isSliding = slidingOutId === app.id;
            const decided = decidedApps.find((d) => d.id === app.id);
            const scores = safeJSON<Record<string, number>>(app.dimensionScores, {});
            const rec = app.decisionPacket?.recommendation;
            const verdict = verdictLabel(app.compositeScore, rec);

            return (
              <div
                key={app.id}
                className={cn("transition-all duration-500", isSliding && "animate-slide-out-left")}
              >
                <DynamicShadowCard
                  intensity={2}
                  className={cn(
                    "relative neu-raised overflow-hidden transition-all duration-300",
                    accentLeftClass(app.compositeScore, rec),
                    decided?.decision === "shortlisted" && "opacity-[0.55]",
                    decided?.decision === "rejected" && "opacity-[0.3]",
                    decided && !["shortlisted", "rejected"].includes(decided.decision) && "opacity-40",
                    !decided && !isExpanded && "neu-press"
                  )}
                  onClick={() => !decided && handleExpand(app.id)}
                >
                  {/* Collapsed — P2: card padding p-5, circular score arc */}
                  <div className="flex items-center gap-3 p-5 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }} className="truncate">{app.organization.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Bronze badge — neu-inset */}
                        <span
                          className="neu-inset inline-flex items-center gap-1.5 px-2.5 py-1"
                          style={{ borderRadius: 10, fontSize: 10, fontWeight: 600, color: "var(--text-primary)" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: app.organization.trustTier === "T3" ? "#b8943f"
                                : app.organization.trustTier === "T2" ? "#9a9488"
                                : app.organization.trustTier === "T1" ? "#b87a3f"
                                : app.organization.trustTier === "T4" ? "#d4b665"
                                : "#cec4b0",
                            }}
                          />
                          {TIER_LABELS[app.organization.trustTier] || app.organization.trustTier}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }} className="truncate">{app.rfp.title}</span>
                      </div>
                      {/* RECOMMEND label */}
                      <div className="mt-1.5">
                        <RecommendLabel rec={rec} />
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-0.5">
                      {app.compositeScore != null ? (
                        <>
                          <ScoreArc score={Math.round(app.compositeScore)} size={72} />
                          <span className="mono-data" style={{ fontSize: 8 }}>{verdict}</span>
                        </>
                      ) : (
                        <div className="score-well">
                          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
                        </div>
                      )}
                    </div>
                    {decided && (
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={decided.decision === "shortlisted" ? "neu-gold" : decided.decision === "rejected" ? "neu-critical" : "neu-amber"}
                          className="text-[10px]"
                        >
                          {decided.decision === "shortlisted" ? "Shortlisted" : decided.decision === "rejected" ? "Rejected" : "Info Req."}
                        </Badge>
                        <button onClick={(e) => { e.stopPropagation(); handleUndo(app.id); }} className="p-1 rounded-lg cursor-pointer" style={{ transition: "background 0.2s" }}>
                          <Undo2 className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded */}
                  <div
                    className={cn("overflow-hidden transition-all ease-out", isExpanded ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0")}
                    style={{ transitionDuration: "0.35s" }}
                  >
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.25)", margin: "0 20px" }} />
                    <div className="px-5 pb-5 pt-4 space-y-4">
                      {/* Watch AI Screening — prominent CTA */}
                      {app.compositeScore != null && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setScreeningApp(app); }}
                          className="watch-ai-button"
                        >
                          <span className="ai-pulse-dot" />
                          Watch AI Screening
                          <span className="ai-time-label">~45s</span>
                        </button>
                      )}

                      {/* AI Decision Brief — A5: breathing orb */}
                      {(app.decisionPacket?.executiveSummary || app.decisionPacket?.narrative) && (
                        <div className="ai-brief-panel">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full animate-ember" style={{ background: "var(--accent)" }} />
                              <span className="label-style" style={{ color: "var(--accent)" }}>
                                AI Decision Brief
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); speakBrief(app); }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all"
                                style={{
                                  background: isSpeaking ? "rgba(92,111,181,0.15)" : "rgba(92,111,181,0.08)",
                                  color: "var(--accent)",
                                  border: `1px solid ${isSpeaking ? "rgba(92,111,181,0.3)" : "rgba(92,111,181,0.12)"}`,
                                }}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                {isSpeaking ? "Stop" : "Listen"}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setMode("chat"); }}
                                className="w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer animate-breathing"
                                style={{
                                  background: "var(--dark-bg)",
                                  boxShadow: "2px 2px 6px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,48,0.3)",
                                }}
                              >
                                <div
                                  className="w-[10px] h-[10px] rounded-full"
                                  style={{
                                    background: "radial-gradient(circle at 35% 35%, var(--accent-light), var(--accent))",
                                    boxShadow: "0 0 8px rgba(92,111,181,0.35)",
                                    animation: "breathe 3s ease-in-out infinite",
                                  }}
                                />
                              </button>
                            </div>
                          </div>
                          {rec && (
                            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                              {rec === "RECOMMEND" ? "Shortlist — strong candidate" : rec === "RECOMMEND_WITH_CONDITIONS" ? "Review carefully — conditions to address" : "Skip — below threshold"}
                            </p>
                          )}
                          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                            {conversationalBrief(rec, app.decisionPacket?.executiveSummary, app.decisionPacket?.narrative, app.compositeScore, app.proposedBudget)}
                          </p>
                        </div>
                      )}

                      {/* A2: Score Dimension Bars */}
                      {Object.keys(scores).length > 0 && (
                        <div className="stagger-bars space-y-2.5">
                          {[
                            { key: "procurement", label: "PROCUREMENT", delay: 0 },
                            { key: "vision", label: "VISION", delay: 120 },
                            { key: "viability", label: "VIABILITY", delay: 240 },
                            { key: "impact", label: "IMPACT", delay: 360 },
                          ].map((dim) => (
                            <DimensionBar
                              key={dim.key}
                              label={dim.label}
                              value={scores[dim.key] ?? 0}
                              delay={dim.delay}
                            />
                          ))}
                        </div>
                      )}

                      {/* A3: Strengths & Risks — side-by-side neu-raised columns */}
                      {(() => {
                        const strengths = safeJSON<string[]>(app.decisionPacket?.strengths, []);
                        const risks = safeJSON<string[]>(app.decisionPacket?.risks, []);
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {strengths.length > 0 && (
                              <DynamicShadowCard intensity={1} className="neu-raised p-4">
                                <div
                                  style={{ borderLeft: "5px solid #3D8B5E", paddingLeft: 20, borderRadius: 16 }}
                                >
                                  <p className="label-style" style={{ color: "#5CA03E", marginBottom: 6 }}>Strengths</p>
                                  {strengths.slice(0, 3).map((s, i) => (
                                    <p key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>&bull; {s}</p>
                                  ))}
                                </div>
                              </DynamicShadowCard>
                            )}
                            {risks.length > 0 && (
                              <DynamicShadowCard intensity={1} className="neu-raised p-4">
                                <div
                                  style={{ borderLeft: "5px solid #C47F3A", paddingLeft: 20, borderRadius: 16 }}
                                >
                                  <p className="label-style" style={{ color: "#b87a3f", marginBottom: 6 }}>Risks</p>
                                  {risks.slice(0, 3).map((r, i) => (
                                    <p key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>&bull; {r}</p>
                                  ))}
                                </div>
                              </DynamicShadowCard>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex items-center gap-4" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        <span className="mono-data" style={{ fontWeight: 500 }}>{app.proposedBudget > 0 ? formatSAR(app.proposedBudget) : "—"}</span>
                        <span>&middot;</span>
                        <span className="truncate">{app.rfp.title}</span>
                      </div>

                      {/* A4: Action Buttons — sticky, neumorphic styled */}
                      <div
                        className="flex flex-wrap sm:flex-nowrap gap-2 pt-1"
                        style={{
                          position: "sticky",
                          bottom: 0,
                          background: "var(--bg)",
                          paddingTop: 12,
                          paddingBottom: 12,
                        }}
                      >
                        {/* Shortlist — accent glow */}
                        <button
                          className="flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-bold cursor-pointer neu-btn-press"
                          style={{
                            background: "linear-gradient(135deg, #5C6FB5, #4A5A96)",
                            color: "white",
                            boxShadow: "5px 5px 15px rgba(92,111,181,0.35), -3px -3px 10px rgba(255,255,255,0.5)",
                            border: "none",
                            transition: "all 0.3s",
                            letterSpacing: "0.5px",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                          onClick={(e) => { e.stopPropagation(); handleDecision(app, "shortlisted"); }}
                        >
                          Shortlist
                        </button>
                        {/* Request Info — neumorphic surface */}
                        <button
                          className="flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-semibold cursor-pointer neu-btn-press"
                          style={{
                            background: "var(--bg-light)",
                            color: "var(--text-primary)",
                            border: "1px solid rgba(255,255,255,0.3)",
                            boxShadow: "4px 4px 10px rgba(155,161,180,0.25), -4px -4px 10px rgba(255,255,255,0.6)",
                            transition: "all 0.3s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                          onClick={(e) => { e.stopPropagation(); handleDecision(app, "info_requested"); }}
                        >
                          Request Info
                        </button>
                        {/* Reject — red tint */}
                        <button
                          className="flex-1 min-w-[80px] py-2.5 rounded-xl text-sm font-semibold cursor-pointer neu-btn-press"
                          style={{
                            background: "rgba(156,74,74,0.08)",
                            color: "#9c4a4a",
                            border: "1px solid rgba(156,74,74,0.15)",
                            transition: "all 0.3s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                          onClick={(e) => { e.stopPropagation(); handleDecision(app, "rejected"); }}
                        >
                          Reject
                        </button>
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/applications/${app.id}`); }} className="flex items-center gap-1 text-xs font-medium cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                          View full application<ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </DynamicShadowCard>
              </div>
            );
          })}
        </div>
      )}

      <AIScreeningModal
        open={!!screeningApp}
        onClose={() => setScreeningApp(null)}
        application={
          screeningApp
            ? {
                id: screeningApp.id,
                orgName: screeningApp.organization.name,
                rfpTitle: screeningApp.rfp.title,
                compositeScore: screeningApp.compositeScore || 0,
                dimensionScores: safeJSON(screeningApp.dimensionScores, { procurement: 0, vision: 0, viability: 0, impact: 0 }),
                confidenceLevels: safeJSON(screeningApp.confidenceLevels, { procurement: 0.85, vision: 0.82, viability: 0.78, impact: 0.88 }),
                aiFindings: safeJSON(screeningApp.aiFindings, []),
                decisionPacket: {
                  recommendation: screeningApp.decisionPacket?.recommendation || "RECOMMEND",
                  executiveSummary: screeningApp.decisionPacket?.executiveSummary || "",
                  strengths: safeJSON(screeningApp.decisionPacket?.strengths, []),
                  risks: safeJSON(screeningApp.decisionPacket?.risks, []),
                  questionsForContractor: safeJSON(screeningApp.decisionPacket?.questionsForContractor, []),
                  impactAssessment: screeningApp.decisionPacket?.impactAssessment || "",
                  narrative: screeningApp.decisionPacket?.narrative || "",
                },
              }
            : null
        }
      />
    </div>
  );
}
