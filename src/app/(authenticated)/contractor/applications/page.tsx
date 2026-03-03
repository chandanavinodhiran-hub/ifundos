"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NeuProgress } from "@/components/ui/neu-progress";
import { NeuToggle } from "@/components/ui/neu-toggle";
import { ScoreWell } from "@/components/ui/score-well";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Loader2,
  Search,
  AlertCircle,
  Clock,
  Check,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "@/components/navigator/navigator-context";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ApplicationData {
  id: string;
  rfpId: string;
  status: string;
  proposedBudget: number;
  compositeScore: number | null;
  dimensionScores: string | null;
  confidenceLevels: string | null;
  aiFindings: string | null;
  questionnaireStatus: string;
  submittedAt: string | null;
  createdAt: string;
  proposalData: string | null;
  rfp: {
    title: string;
    deadline: string | null;
    status: string;
  };
  decisionPacket: {
    recommendation: string | null;
    executiveSummary: string | null;
    narrative: string | null;
    strengths: string | null;
    risks: string | null;
  } | null;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const LIFECYCLE_NODES = ["Submitted", "Scored", "Review", "Decision"] as const;

type NodeState = "completed" | "current" | "scoring" | "future" | "awarded" | "rejected";

function getNodeStates(status: string): NodeState[] {
  switch (status) {
    case "DRAFT":
      return ["future", "future", "future", "future"];
    case "SUBMITTED":
      return ["completed", "future", "future", "future"];
    case "SCORING":
      return ["completed", "scoring", "future", "future"];
    case "IN_REVIEW":
    case "SHORTLISTED":
    case "QUESTIONNAIRE_PENDING":
    case "QUESTIONNAIRE_SUBMITTED":
      return ["completed", "completed", "current", "future"];
    case "APPROVED":
      return ["completed", "completed", "completed", "awarded"];
    case "REJECTED":
      return ["completed", "completed", "completed", "rejected"];
    default:
      return ["completed", "future", "future", "future"];
  }
}

function getAccent(status: string): string {
  if (["APPROVED"].includes(status)) return "accent-left-green";
  if (["REJECTED"].includes(status)) return "accent-left-critical";
  if (["QUESTIONNAIRE_PENDING"].includes(status)) return "accent-left-green";
  if (["SCORING"].includes(status)) return "accent-left-green";
  return "accent-left-green";
}

function getStatusBadge(status: string): { label: string; variant: "neu-gold" | "neu-verified" | "neu-amber" | "neu-critical" | "neu" } {
  switch (status) {
    case "SUBMITTED": return { label: "Submitted", variant: "neu" };
    case "SCORING": return { label: "AI Scoring", variant: "neu-gold" };
    case "IN_REVIEW": return { label: "In Review", variant: "neu-gold" };
    case "SHORTLISTED": return { label: "Shortlisted", variant: "neu-verified" };
    case "QUESTIONNAIRE_PENDING": return { label: "Questionnaire", variant: "neu-amber" };
    case "QUESTIONNAIRE_SUBMITTED": return { label: "Questionnaire Done", variant: "neu-verified" };
    case "APPROVED": return { label: "Approved", variant: "neu-verified" };
    case "REJECTED": return { label: "Not Selected", variant: "neu-critical" };
    default: return { label: status.replace(/_/g, " "), variant: "neu" };
  }
}

function safeJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 14) return "1 week ago";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ContractorApplicationsPage() {
  const router = useRouter();
  const { setMode } = useNavigator();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data) => setApplications(data.applications || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "active") {
      return applications.filter((a) => !["DRAFT", "REJECTED", "APPROVED"].includes(a.status));
    }
    return applications;
  }, [applications, filter]);

  const activeCount = applications.filter((a) => !["DRAFT", "REJECTED"].includes(a.status)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(75, 165, 195, 0.7)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="w-8 h-8 text-critical" />
        <p className="text-sovereign-stone text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-[100px] md:pb-0">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(30, 34, 53, 0.4)" }}>
            Applications
          </p>
          <h1 className="text-xl font-extrabold text-sovereign-charcoal">
            My Applications
          </h1>
        </div>
        <Badge variant="neu" className="text-[11px] font-bold mt-1">
          {activeCount} active
        </Badge>
      </div>

      {/* ── Toggle ─────────────────────────────────────────────── */}
      <NeuToggle
        options={[
          { label: "Active", value: "active", count: activeCount },
          { label: "All", value: "all", count: applications.length },
        ]}
        value={filter}
        onChange={setFilter}
        className="w-full"
      />

      {/* ── Card Stack ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={filter === "active" ? "No active applications" : "No applications yet"}
          description={
            filter === "active"
              ? "All your applications have been decided. Switch to \"All\" to see them."
              : "Browse open RFPs to submit your first proposal."
          }
          action={
            filter === "all" ? (
              <Button variant="neu-gold" onClick={() => router.push("/contractor/rfps")}>
                Browse Opportunities
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              isExpanded={expandedId === app.id}
              onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
              onNavigate={(href) => router.push(href)}
              onChat={() => setMode("chat")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Application Card                                                    */
/* ------------------------------------------------------------------ */

function ApplicationCard({
  app,
  isExpanded,
  onToggle,
  onNavigate,
  onChat,
}: {
  app: ApplicationData;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (href: string) => void;
  onChat: () => void;
}) {
  const nodeStates = getNodeStates(app.status);
  const statusBadge = getStatusBadge(app.status);
  const accent = getAccent(app.status);
  const scores = safeJSON<Record<string, number>>(app.dimensionScores, {});
  const strengths = safeJSON<string[]>(app.decisionPacket?.strengths, []);
  const risks = safeJSON<string[]>(app.decisionPacket?.risks, []);
  const isDecided = ["APPROVED", "REJECTED"].includes(app.status);

  return (
    <Card
      variant="neu-raised"
      className={cn(
        "overflow-hidden transition-all duration-300",
        accent,
        !isExpanded && !isDecided && "neu-press",
        isDecided && app.status === "REJECTED" && "opacity-[0.45]"
      )}
    >
      {/* ── Collapsed top section ── */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] text-sovereign-charcoal leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {app.rfp.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusBadge.variant} className="text-[10px] neu-badge-inset">
                {statusBadge.label}
              </Badge>
              {app.submittedAt && (
                <span className="text-[11px] font-mono text-sovereign-stone">
                  {getRelativeTime(app.submittedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {app.compositeScore != null ? (
              <ScoreWell score={app.compositeScore} size="sm" animated />
            ) : app.status === "SCORING" ? (
              <div className="score-well-sm">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(75, 165, 195, 0.7)" }} />
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Lifecycle Track ── */}
        <div className="mt-4 mb-1">
          <div className="flex items-center justify-between px-1">
            {LIFECYCLE_NODES.map((label, idx) => {
              const state = nodeStates[idx];
              const dotSize = (state === "completed" || state === "awarded") ? 28
                : (state === "current" || state === "scoring") ? 32
                : 24;
              return (
                <div key={label} className="flex items-center" style={{ flex: idx < LIFECYCLE_NODES.length - 1 ? "1 1 0" : "0 0 auto" }}>
                  {/* Node */}
                  <div className="flex flex-col items-center" style={{ width: 36 }}>
                    <div
                      className={cn(
                        "rounded-full flex items-center justify-center transition-all relative",
                      )}
                      style={{ width: dotSize, height: dotSize, ...nodeStyle(state) }}
                    >
                      {(state === "completed" || state === "awarded") && (
                        <Check className="text-white" style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                      )}
                      {(state === "current" || state === "scoring") && (
                        <div
                          className="rounded-full tracker-dot-pulse"
                          style={{
                            position: "absolute",
                            top: 7,
                            left: 7,
                            right: 7,
                            bottom: 7,
                            background: "rgba(75, 165, 195, 0.8)",
                            boxShadow: "0 0 8px rgba(75, 165, 195, 0.3)",
                          }}
                        />
                      )}
                      {state === "future" && (
                        <div
                          className="rounded-full"
                          style={{
                            position: "absolute",
                            top: 7,
                            left: 7,
                            right: 7,
                            bottom: 7,
                            background: "rgba(30, 34, 53, 0.12)",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                      {state === "rejected" && (
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#9c4a4a" }} />
                      )}
                    </div>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wide mt-1.5 text-center leading-none"
                      style={{
                        color: state === "completed" || state === "awarded" ? "#4a7c59"
                          : state === "current" || state === "scoring" ? "rgba(75, 165, 195, 0.8)"
                          : state === "rejected" ? "#9c4a4a"
                          : "rgba(30, 34, 53, 0.35)",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {/* Connecting line */}
                  {idx < LIFECYCLE_NODES.length - 1 && (
                    <div
                      className="h-[3px] flex-1 mx-1 rounded-full"
                      style={lineStyle(nodeStates[idx], nodeStates[idx + 1])}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Score row ── */}
      {app.compositeScore != null && !isExpanded && (
        <div className="mx-4 mb-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-[18px]" style={{ background: "rgba(75, 165, 195, 0.06)", border: "1px solid rgba(75, 165, 195, 0.12)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[24px] font-extrabold font-sans" style={{ color: "rgba(75, 165, 195, 0.8)" }}>
                {Math.round(app.compositeScore)}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(30, 34, 53, 0.4)" }}>
                AI Score
              </span>
            </div>
            {app.submittedAt && (
              <span className="text-[11px] font-mono text-sovereign-stone">
                {new Date(app.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Expanded content ── */}
      <div
        className={cn("overflow-hidden transition-all ease-out", isExpanded ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0")}
        style={{ transitionDuration: "0.35s" }}
      >
        <div className="border-t border-neu-dark/30 mx-4" />
        <div className="px-4 pb-5 pt-4 space-y-4">

          {/* AI Feedback Panel — dark recessed screen */}
          {(app.decisionPacket?.executiveSummary || app.decisionPacket?.narrative) && (
            <div className="ai-brief-panel">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-ember" style={{ background: "rgba(74, 140, 106, 0.7)" }} />
                  <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "rgba(75, 165, 195, 0.7)", textTransform: "uppercase" }}>
                    AI Feedback
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onChat(); }}
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "rgba(30, 34, 53, 0.12)", boxShadow: "2px 2px 6px rgba(155,161,180,0.3), -2px -2px 6px rgba(255,255,255,0.5)" }}
                >
                  <div className="w-[10px] h-[10px] rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, rgba(92, 111, 181, 0.7), rgba(75, 100, 160, 0.9))", boxShadow: "0 0 8px rgba(92, 111, 181, 0.3)" }} />
                </button>
              </div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "rgba(30, 34, 53, 0.8)", marginBottom: "8px" }}>
                {contractorFeedbackTitle(app.decisionPacket?.recommendation, app.compositeScore)}
              </p>
              <p style={{ fontSize: "13px", fontWeight: 400, color: "rgba(30, 34, 53, 0.55)", lineHeight: 1.8 }}>
                {contractorFeedbackBody(app.decisionPacket?.executiveSummary, app.decisionPacket?.narrative, app.compositeScore)}
              </p>
            </div>
          )}

          {/* Fallback AI feedback when no decision packet */}
          {!app.decisionPacket?.executiveSummary && !app.decisionPacket?.narrative && app.compositeScore != null && (
            <div className="ai-brief-panel">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-ember" style={{ background: "rgba(74, 140, 106, 0.7)" }} />
                  <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "rgba(75, 165, 195, 0.7)", textTransform: "uppercase" as const }}>
                    AI Feedback
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onChat(); }}
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "rgba(30, 34, 53, 0.12)", boxShadow: "2px 2px 6px rgba(155,161,180,0.3), -2px -2px 6px rgba(255,255,255,0.5)" }}
                >
                  <div className="w-[10px] h-[10px] rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, rgba(92, 111, 181, 0.7), rgba(75, 100, 160, 0.9))", boxShadow: "0 0 8px rgba(92, 111, 181, 0.3)" }} />
                </button>
              </div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "rgba(30, 34, 53, 0.8)", marginBottom: "8px" }}>
                {contractorFeedbackTitle(null, app.compositeScore)}
              </p>
              <p style={{ fontSize: "13px", fontWeight: 400, color: "rgba(30, 34, 53, 0.55)", lineHeight: 1.8 }}>
                {contractorFeedbackBody(null, null, app.compositeScore)}
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

          {/* Strengths & Areas to Strengthen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {strengths.length > 0 && (
              <div className="accent-bar-verified pl-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#4a7c59" }}>
                  Strengths
                </p>
                {strengths.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-xs text-sovereign-stone leading-relaxed">&bull; {s}</p>
                ))}
              </div>
            )}
            {risks.length > 0 && (
              <div className="accent-bar-amber pl-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(75, 165, 195, 0.7)" }}>
                  Areas to Strengthen
                </p>
                {risks.slice(0, 3).map((r, i) => (
                  <p key={i} className="text-xs text-sovereign-stone leading-relaxed">&bull; {r}</p>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {(app.questionnaireStatus === "PENDING" || app.status === "QUESTIONNAIRE_PENDING") && (
              <Button
                variant="neu-gold"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); onNavigate(`/contractor/applications/${app.id}/questionnaire`); }}
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                Complete Questionnaire
              </Button>
            )}
            <Button
              variant="neu-outline"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); onNavigate(`/contractor/rfps/${app.rfpId}`); }}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View RFP
            </Button>
          </div>

          {/* Expected timeline hint */}
          {!isDecided && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-neu-inset bg-neu-base">
              <Clock className="w-3.5 h-3.5 text-sovereign-stone" />
              <span className="text-[11px] text-sovereign-stone">
                Typically 5–10 business days for review
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Visual helpers                                                      */
/* ------------------------------------------------------------------ */

function nodeStyle(state: NodeState): React.CSSProperties {
  switch (state) {
    case "completed":
    case "awarded":
      return { background: "rgba(74, 140, 106, 0.9)" };
    case "current":
    case "scoring":
      return {
        position: "relative",
        background: "rgba(228, 231, 238, 0.6)",
        boxShadow: "3px 3px 8px rgba(155, 161, 180, 0.3), -3px -3px 8px rgba(255, 255, 255, 0.7)",
      };
    case "rejected":
      return {
        background: "rgba(228, 231, 238, 0.5)",
        boxShadow: "inset 3px 3px 8px rgba(155, 161, 180, 0.3), inset -3px -3px 8px rgba(255, 255, 255, 0.6)",
      };
    case "future":
    default:
      return {
        background: "rgba(228, 231, 238, 0.5)",
        boxShadow: "inset 3px 3px 8px rgba(155, 161, 180, 0.3), inset -3px -3px 8px rgba(255, 255, 255, 0.6)",
        position: "relative",
      };
  }
}

function lineStyle(from: NodeState, to: NodeState): React.CSSProperties {
  if (from === "completed" && (to === "completed" || to === "awarded")) {
    return { background: "rgba(74, 140, 106, 0.6)" };
  }
  if (from === "completed" && (to === "current" || to === "scoring")) {
    return { background: "linear-gradient(to right, rgba(74, 140, 106, 0.6), rgba(75, 165, 195, 0.6))" };
  }
  if (from === "completed" && to === "rejected") {
    return { background: "linear-gradient(to right, rgba(74, 140, 106, 0.6), #9c4a4a)" };
  }
  return {
    background: "rgba(228, 231, 238, 0.5)",
    boxShadow: "inset 1px 1px 3px rgba(155, 161, 180, 0.25), inset -1px -1px 3px rgba(255, 255, 255, 0.5)",
  };
}

/* ------------------------------------------------------------------ */
/* Contractor-specific AI feedback copy                                */
/* ------------------------------------------------------------------ */

function contractorFeedbackTitle(rec: string | null | undefined, score: number | null): string {
  if (!rec && score) {
    if (score >= 75) return "Competitive application with strong scores";
    if (score >= 50) return "Solid application — room to grow";
    return "Application received — opportunities for improvement";
  }
  if (rec === "RECOMMEND") return "Strong application — well positioned";
  if (rec === "RECOMMEND_WITH_CONDITIONS") return "Competitive application with room to grow";
  if (rec === "DO_NOT_RECOMMEND") return "Application received — here's what to focus on next time";
  return "Application under review";
}

function contractorFeedbackBody(
  summary: string | null | undefined,
  narrative: string | null | undefined,
  score: number | null,
): string {
  // Use the executive summary if available, but keep it constructive
  const text = summary || narrative || "";
  if (text) {
    // Truncate to ~250 chars for mobile readability
    return text.length > 250 ? text.slice(0, 247) + "..." : text;
  }
  if (score && score >= 75) return "Your application scored well across key dimensions. The review panel will evaluate your proposal alongside other candidates.";
  if (score && score >= 50) return "Your application shows promise. Focus on strengthening the areas highlighted below for future proposals.";
  return "Your application is being processed. Check back soon for detailed feedback.";
}
