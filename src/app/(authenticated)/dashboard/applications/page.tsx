"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NeuToggle } from "@/components/ui/neu-toggle";
import { NeuProgress } from "@/components/ui/neu-progress";
import { ScoreWell } from "@/components/ui/score-well";
import { EmptyState } from "@/components/ui/empty-state";
import { AIScreeningModal } from "@/components/ai/ai-screening-modal";
import {
  Loader2,
  ArrowRight,
  Check,
  Sparkles,
  Undo2,
  Eye,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "@/components/navigator/navigator-context";

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
/* Pipeline Page                                                       */
/* ------------------------------------------------------------------ */

export default function PipelinePage() {
  const { setMode } = useNavigator();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [screeningApp, setScreeningApp] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState("to_review");
  const [decidedApps, setDecidedApps] = useState<DecidedApp[]>([]);
  const [slidingOutId, setSlidingOutId] = useState<string | null>(null);
  const [lastComparedScore, setLastComparedScore] = useState<number | null>(null);
  const [undoToast, setUndoToast] = useState<{ appId: string; orgName: string; decision: Decision; timerId: ReturnType<typeof setTimeout> } | null>(null);

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
      setLastComparedScore(app.compositeScore);

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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-critical">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* ── Undo Toast ── */}
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

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-1 pb-3 bg-neu-base/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-eyebrow text-sovereign-stone mb-0.5">Pipeline</p>
            <h1 className="text-xl font-bold text-sovereign-charcoal">Review Applications</h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-sovereign-charcoal tabular-nums">
              {remaining} of {totalToReview}
            </p>
            <p className="text-[10px] text-sovereign-stone">to review</p>
          </div>
        </div>
        <NeuProgress value={progressPct} size="sm" className="mb-3" />
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

      {/* ── Card Stack ── */}
      {displayApps.length === 0 ? (
        viewMode === "to_review" && reviewed > 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="empty-icon-well">
              <Check className="w-7 h-7" style={{ stroke: "#4a7c59", strokeWidth: 2 }} />
            </div>
            <h3 className="text-lg font-bold text-sovereign-charcoal mb-1">All Reviewed</h3>
            <p className="text-sm text-sovereign-stone text-center">
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
        <div className="space-y-3.5">
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
                <div
                  className={cn(
                    "relative bg-neu-base rounded-[18px] shadow-neu-raised border-0 overflow-hidden transition-all duration-300",
                    accentLeftClass(app.compositeScore, rec),
                    decided?.decision === "shortlisted" && "opacity-[0.55]",
                    decided?.decision === "rejected" && "opacity-[0.3]",
                    decided && !["shortlisted", "rejected"].includes(decided.decision) && "opacity-40",
                    !decided && !isExpanded && "neu-press"
                  )}
                  onClick={() => !decided && handleExpand(app.id)}
                >
                  {/* Collapsed */}
                  <div className="flex items-center gap-3 p-4 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[15px] text-sovereign-charcoal truncate">{app.organization.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-sovereign-charcoal"
                          style={{ boxShadow: "inset 2px 2px 4px rgba(156,148,130,0.35), inset -2px -2px 4px rgba(255,250,240,0.6)", background: "var(--neu-dark)" }}
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
                        <span className="text-xs text-sovereign-stone truncate">{app.rfp.title}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {app.compositeScore != null ? (
                        <ScoreWell score={app.compositeScore} verdict={verdict} size="md" animated={!decided} />
                      ) : (
                        <div className="score-well">
                          <Loader2 className="w-5 h-5 animate-spin text-sovereign-stone" />
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
                        <button onClick={(e) => { e.stopPropagation(); handleUndo(app.id); }} className="p-1 rounded-lg hover:bg-neu-dark/30 cursor-pointer">
                          <Undo2 className="w-3.5 h-3.5 text-sovereign-stone" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded */}
                  <div
                    className={cn("overflow-hidden transition-all ease-out", isExpanded ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0")}
                    style={{ transitionDuration: "0.35s" }}
                  >
                    <div className="border-t border-neu-dark/30 mx-4" />
                    <div className="px-4 pb-5 pt-4 space-y-4">
                      {/* AI Decision Brief — recessed dark screen */}
                      {(app.decisionPacket?.executiveSummary || app.decisionPacket?.narrative) && (
                        <div className="ai-brief-panel">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-sovereign-gold animate-ember" />
                              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#b8943f", textTransform: "uppercase" as const }}>
                                AI Decision Brief
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setMode("chat"); }}
                                className="w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(60,55,48,0.2)]"
                                style={{ background: "#2a2520", boxShadow: "2px 2px 6px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,48,0.3)" }}
                              >
                                <div className="w-[10px] h-[10px] rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #d4b665, #b8943f)", boxShadow: "0 0 8px rgba(184,148,63,0.35)" }} />
                              </button>
                            </div>
                          </div>
                          {rec && (
                            <p style={{ fontSize: "16px", fontWeight: 700, color: "#f0ead9", marginBottom: "8px" }}>
                              {rec === "RECOMMEND" ? "Shortlist — strong candidate" : rec === "RECOMMEND_WITH_CONDITIONS" ? "Review carefully — conditions to address" : "Skip — below threshold"}
                            </p>
                          )}
                          <p style={{ fontSize: "13px", fontWeight: 400, color: "#9a9488", lineHeight: 1.8 }}>
                            {conversationalBrief(rec, app.decisionPacket?.executiveSummary, app.decisionPacket?.narrative, app.compositeScore, app.proposedBudget)}
                          </p>
                        </div>
                      )}

                      {/* Score Dimension Bars */}
                      {Object.keys(scores).length > 0 && (
                        <div className="stagger-bars space-y-2.5">
                          {[
                            { key: "procurement", label: "Procurement", delay: 0 },
                            { key: "vision", label: "Vision", delay: 120 },
                            { key: "viability", label: "Viability", delay: 240 },
                            { key: "impact", label: "Impact", delay: 360 },
                          ].map((dim) => (
                            <NeuProgress
                              key={dim.key}
                              value={scores[dim.key] ?? 0}
                              label={dim.label}
                              showValue
                              delay={dim.delay}
                              variant={scores[dim.key] >= 75 ? "gold" : scores[dim.key] >= 50 ? "amber" : "critical"}
                              size="sm"
                              groove
                            />
                          ))}
                        </div>
                      )}

                      {lastComparedScore != null && app.compositeScore != null && (
                        <div className="flex items-center gap-2 py-1.5 px-3 rounded-xl shadow-neu-inset bg-neu-base">
                          <span className="text-xs text-sovereign-stone">vs. previous:</span>
                          <span className={cn("font-mono text-xs font-bold", (app.compositeScore - lastComparedScore) >= 0 ? "text-verified" : "text-critical")}>
                            {(app.compositeScore - lastComparedScore) >= 0 ? "+" : ""}{app.compositeScore - lastComparedScore}
                          </span>
                        </div>
                      )}

                      {/* Strengths & Risks */}
                      {(() => {
                        const strengths = safeJSON<string[]>(app.decisionPacket?.strengths, []);
                        const risks = safeJSON<string[]>(app.decisionPacket?.risks, []);
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {strengths.length > 0 && (
                              <div className="accent-bar-verified pl-3 py-2">
                                <p className="text-xs font-semibold text-verified uppercase tracking-wide mb-1">Strengths</p>
                                {strengths.slice(0, 3).map((s, i) => (
                                  <p key={i} className="text-xs text-sovereign-stone leading-relaxed">&bull; {s}</p>
                                ))}
                              </div>
                            )}
                            {risks.length > 0 && (
                              <div className="accent-bar-amber pl-3 py-2">
                                <p className="text-xs font-semibold text-amber uppercase tracking-wide mb-1">Risks</p>
                                {risks.slice(0, 3).map((r, i) => (
                                  <p key={i} className="text-xs text-sovereign-stone leading-relaxed">&bull; {r}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex items-center gap-4 text-xs text-sovereign-stone">
                        <span className="font-mono font-medium">{app.proposedBudget > 0 ? formatSAR(app.proposedBudget) : "—"}</span>
                        <span>&middot;</span>
                        <span className="truncate">{app.rfp.title}</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button variant="neu-gold" className="flex-1" onClick={(e) => { e.stopPropagation(); handleDecision(app, "shortlisted"); }}>Shortlist</Button>
                        <Button variant="neu-secondary" className="flex-1" onClick={(e) => { e.stopPropagation(); handleDecision(app, "info_requested"); }}>Request Info</Button>
                        <Button variant="neu-outline" className="flex-1 text-critical border-critical/30" onClick={(e) => { e.stopPropagation(); handleDecision(app, "rejected"); }}>Reject</Button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {app.compositeScore != null && (
                          <button onClick={(e) => { e.stopPropagation(); setScreeningApp(app); }} className="flex items-center gap-1.5 text-xs text-sovereign-gold font-semibold cursor-pointer hover:underline">
                            <Sparkles className="w-3.5 h-3.5" />Watch AI Screen
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); window.location.href = `/dashboard/applications/${app.id}`; }} className="flex items-center gap-1 text-xs text-sovereign-stone font-medium cursor-pointer hover:text-sovereign-charcoal">
                          View full application<ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
