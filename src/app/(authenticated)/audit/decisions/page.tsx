"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, Diamond, AlertTriangle, Flag, Clock, ExternalLink } from "lucide-react";
import { NeuToggle } from "@/components/ui/neu-toggle";
import { NeuProgress } from "@/components/ui/neu-progress";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface AppDecision {
  id: string;
  status: string;
  compositeScore: number | null;
  dimensionScores: string | null;
  proposedBudget: number;
  shortlistedAt: string | null;
  rejectionReason: string | null;
  updatedAt: string;
  createdAt: string;
  submittedAt: string | null;
  organization: { name: string };
  rfp: { id: string; title: string; programId: string };
  decisionPacket: {
    recommendation: string | null;
    executiveSummary: string | null;
    strengths: string | null;
    risks: string | null;
    narrative: string | null;
  } | null;
}

interface Stats {
  applications: AppDecision[];
  concordance: { aligned: number; divergent: number; flagged: number };
  fmName: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
type ConcordanceType = "aligned" | "divergent" | "contradictory";

function getConcordance(app: AppDecision): ConcordanceType {
  const rec = app.decisionPacket?.recommendation;
  if (!rec) return "aligned";
  const aiRecommends = rec === "RECOMMEND";
  const aiNotRecommends = rec === "DO_NOT_RECOMMEND";
  const fmRejected = app.status === "REJECTED";
  const fmAdvanced = ["SHORTLISTED", "APPROVED", "QUESTIONNAIRE_PENDING", "QUESTIONNAIRE_SUBMITTED", "IN_REVIEW"].includes(app.status);

  if ((aiRecommends && fmAdvanced) || (aiNotRecommends && fmRejected)) return "aligned";
  if ((aiRecommends && (app.compositeScore ?? 0) >= 75 && fmRejected) || (aiNotRecommends && fmAdvanced)) return "contradictory";
  if ((aiRecommends && fmRejected) || (aiNotRecommends && fmAdvanced)) return "divergent";
  return "aligned";
}

function aiRecLabel(rec: string | null | undefined): { label: string; color: string } {
  if (rec === "RECOMMEND") return { label: "RECOMMEND", color: "#4a7c59" };
  if (rec === "RECOMMEND_WITH_CONDITIONS") return { label: "CAUTION", color: "#b87a3f" };
  if (rec === "DO_NOT_RECOMMEND") return { label: "NOT REC.", color: "#9c4a4a" };
  return { label: "PENDING", color: "#9a9488" };
}

function fmDecisionLabel(status: string): { label: string; color: string } {
  if (["SHORTLISTED", "APPROVED", "QUESTIONNAIRE_PENDING", "QUESTIONNAIRE_SUBMITTED"].includes(status))
    return { label: "SHORTLISTED", color: "#4a7c59" };
  if (status === "REJECTED") return { label: "REJECTED", color: "#9c4a4a" };
  if (status === "IN_REVIEW") return { label: "IN REVIEW", color: "#b87a3f" };
  return { label: status.replace(/_/g, " "), color: "#7a7265" };
}

function parseDimensions(json: string | null): Record<string, number> {
  if (!json) return {};
  try { return JSON.parse(json); } catch { return {}; }
}

function parseJsonArray(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

function timeSince(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Less than an hour";
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""}`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function AuditorDecisions() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("divergent");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [flagReason, setFlagReason] = useState("");
  const [flagNote, setFlagNote] = useState("");
  const [flaggingId, setFlaggingId] = useState<string | null>(null);

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

  // Filter decisions (only those with a status that represents a FM decision)
  const decided = stats.applications.filter((a) =>
    ["SHORTLISTED", "REJECTED", "APPROVED", "QUESTIONNAIRE_PENDING", "QUESTIONNAIRE_SUBMITTED", "IN_REVIEW"].includes(a.status)
  );

  const filtered = decided.filter((app) => {
    if (filter === "divergent") return getConcordance(app) !== "aligned";
    if (filter === "flagged") return flaggedIds.has(app.id) || getConcordance(app) === "contradictory";
    return true; // "all"
  });

  function handleFlag(appId: string) {
    setFlaggedIds((prev) => new Set(prev).add(appId));
    setFlaggingId(null);
    setFlagReason("");
    setFlagNote("");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8943f" }}>
          REVIEW
        </p>
        <h1 className="text-[22px] mt-0.5" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, color: "#1a1714" }}>
          Decision Review
        </h1>
        <p className="text-[13px]" style={{ color: "#7a7265" }}>
          Fund manager decisions vs. AI recommendations
        </p>
      </div>

      {/* Concordance Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ALIGNED", value: stats.concordance.aligned, color: "#4a7c59" },
          { label: "DIVERGENT", value: stats.concordance.divergent, color: "#b87a3f" },
          { label: "FLAGGED", value: stats.concordance.flagged + flaggedIds.size, color: stats.concordance.flagged + flaggedIds.size > 0 ? "#9c4a4a" : "#7a7265" },
        ].map((well) => (
          <div
            key={well.label}
            className="p-3 text-center rounded-[18px]"
            style={{
              background: "#e8e0d0",
              boxShadow: "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
            }}
          >
            <p className="font-sans font-extrabold text-[26px] leading-none tabular-nums" style={{ color: well.color }}>
              {well.value}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#7a7265" }}>
              {well.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Toggle */}
      <NeuToggle
        options={[
          { label: "Divergent", value: "divergent", count: stats.concordance.divergent },
          { label: "All Decisions", value: "all", count: decided.length },
          { label: "Flagged", value: "flagged", count: stats.concordance.flagged + flaggedIds.size },
        ]}
        value={filter}
        onChange={setFilter}
        className="w-full"
      />

      {/* Decision Cards */}
      <div className="space-y-3">
        {filtered.map((app) => {
          const concordance = getConcordance(app);
          const aiRec = aiRecLabel(app.decisionPacket?.recommendation);
          const fmDec = fmDecisionLabel(app.status);
          const expanded = expandedId === app.id;
          const isFlagged = flaggedIds.has(app.id);
          const dimensions = parseDimensions(app.dimensionScores);
          const strengths = parseJsonArray(app.decisionPacket?.strengths ?? null);
          const risks = parseJsonArray(app.decisionPacket?.risks ?? null);

          // Card accent color
          const accentClass = isFlagged ? "accent-left-critical" : concordance === "aligned" ? "accent-left-green" : "accent-left-amber";
          const opacity = concordance === "aligned" && filter === "all" ? "opacity-70" : "";

          return (
            <div key={app.id} className={opacity}>
              <button
                className={`w-full text-left rounded-[18px] p-4 cursor-pointer ${accentClass}`}
                style={{
                  background: "#e8e0d0",
                  boxShadow: "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onClick={() => setExpandedId(expanded ? null : app.id)}
              >
                {/* Contractor name + RFP */}
                <h3 className="text-[16px] font-bold pr-20" style={{ color: "#1a1714" }}>
                  {app.organization.name}
                </h3>
                <p className="text-[12px] mt-0.5" style={{ color: "#7a7265" }}>
                  {app.rfp.title}
                </p>

                {/* AI vs FM row */}
                <div className="flex items-center flex-wrap gap-2 mt-3">
                  <span className="text-[11px] font-medium" style={{ color: "#7a7265" }}>AI:</span>
                  {/* AI recommendation pill (inset) */}
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: `${aiRec.color}15`,
                      color: aiRec.color,
                      boxShadow: "inset 2px 2px 5px rgba(156,148,130,0.35), inset -2px -2px 5px rgba(255,250,240,0.6)",
                    }}
                  >
                    {aiRec.label}
                  </span>
                  {/* Mini score well */}
                  {app.compositeScore !== null && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] font-bold"
                      style={{
                        color: "#b8943f",
                        background: "#e8e0d0",
                        boxShadow: "inset 2px 2px 5px rgba(156,148,130,0.35), inset -2px -2px 5px rgba(255,250,240,0.6)",
                      }}
                    >
                      {Math.round(app.compositeScore)}
                    </span>
                  )}

                  <span className="text-[11px] font-medium ml-2" style={{ color: "#7a7265" }}>FM:</span>
                  {/* FM decision pill (raised) */}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: "#e8e0d0",
                      color: fmDec.color,
                      boxShadow: "3px 3px 6px rgba(156,148,130,0.35), -3px -3px 6px rgba(255,250,240,0.7)",
                    }}
                  >
                    {fmDec.label}
                  </span>
                </div>

                {/* Concordance indicator (right) + timestamp */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                  {concordance === "aligned" && (
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" style={{ color: "#4a7c59" }} />
                      <span className="text-[10px] font-semibold" style={{ color: "#4a7c59" }}>Aligned</span>
                    </div>
                  )}
                  {concordance === "divergent" && (
                    <div className="flex items-center gap-1">
                      <Diamond className="w-3.5 h-3.5" style={{ color: "#b87a3f" }} />
                      <span className="text-[10px] font-semibold" style={{ color: "#b87a3f" }}>Divergent</span>
                    </div>
                  )}
                  {concordance === "contradictory" && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#9c4a4a" }} />
                      <span className="text-[10px] font-semibold" style={{ color: "#9c4a4a" }}>Contradictory</span>
                    </div>
                  )}
                  <span className="font-mono text-[10px]" style={{ color: "#9a9488" }}>
                    {new Date(app.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              </button>

              {/* ── Expanded State ── */}
              {expanded && (
                <div className="mt-2 space-y-3">
                  {/* AI Decision Brief — dark charcoal panel */}
                  <div className="ai-brief-panel rounded-[18px] p-4" style={{ position: "relative" }}>
                    <span className="absolute top-3 right-3 text-[10px] font-mono" style={{ color: "#9a9488" }}>
                      View only
                    </span>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: "radial-gradient(circle at 35% 35%, #d4b665, #b8943f)",
                          boxShadow: "0 0 8px rgba(184,148,63,0.4)",
                        }}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8943f" }}>
                        AI DECISION BRIEF
                      </span>
                    </div>

                    {app.decisionPacket?.executiveSummary && (
                      <p className="text-[13px] leading-relaxed" style={{ color: "#c8c0b0" }}>
                        {app.decisionPacket.executiveSummary}
                      </p>
                    )}

                    {/* Score dimension bars */}
                    <div className="mt-4 space-y-2">
                      {Object.entries(dimensions).map(([key, val], i) => (
                        <NeuProgress
                          key={key}
                          value={val}
                          variant={val >= 75 ? "green" : val >= 50 ? "amber" : "critical"}
                          size="sm"
                          label={key.replace(/([A-Z])/g, " $1").trim()}
                          showValue
                          groove
                          delay={i * 120}
                        />
                      ))}
                    </div>

                    {/* Strengths */}
                    {strengths.length > 0 && (
                      <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(74,124,89,0.08)", borderLeft: "3px solid #4a7c59" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#4a7c59" }}>Strengths</p>
                        {strengths.map((s, i) => (
                          <p key={i} className="text-[12px] leading-relaxed" style={{ color: "#c8c0b0" }}>• {s}</p>
                        ))}
                      </div>
                    )}

                    {/* Risks */}
                    {risks.length > 0 && (
                      <div className="mt-2 rounded-xl p-3" style={{ background: "rgba(184,122,63,0.08)", borderLeft: "3px solid #b87a3f" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#b87a3f" }}>Areas of Concern</p>
                        {risks.map((r, i) => (
                          <p key={i} className="text-[12px] leading-relaxed" style={{ color: "#c8c0b0" }}>• {r}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Decision Detail */}
                  <div
                    className="rounded-[18px] p-4"
                    style={{
                      background: "#e8e0d0",
                      boxShadow: "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase" style={{ color: "#7a7265" }}>
                          {stats.fmName}&apos;s Decision
                        </p>
                        <span
                          className="inline-block mt-1 px-3 py-1 rounded-full text-[12px] font-bold"
                          style={{
                            background: "#e8e0d0",
                            color: fmDec.color,
                            boxShadow: "3px 3px 6px rgba(156,148,130,0.35), -3px -3px 6px rgba(255,250,240,0.7)",
                          }}
                        >
                          {fmDec.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: "#9a9488" }}>
                        View only
                      </span>
                    </div>

                    {app.rejectionReason && (
                      <p className="text-[12px] mt-2 leading-relaxed" style={{ color: "#7a7265" }}>
                        Note: {app.rejectionReason}
                      </p>
                    )}

                    {/* Decision timing */}
                    <div className="flex items-center gap-2 mt-3 text-[11px] font-mono" style={{ color: "#7a7265" }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Decided {timeSince(app.submittedAt ?? app.createdAt)} after AI scoring
                      </span>
                    </div>
                  </div>

                  {/* Flag for Review Button */}
                  {!isFlagged ? (
                    flaggingId === app.id ? (
                      <div
                        className="rounded-[18px] p-4 space-y-3"
                        style={{
                          background: "#e8e0d0",
                          boxShadow: "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
                        }}
                      >
                        <p className="text-[13px] font-semibold" style={{ color: "#1a1714" }}>Flag for Review</p>
                        <select
                          value={flagReason}
                          onChange={(e) => setFlagReason(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-transparent border-0 outline-none"
                          style={{
                            background: "#e8e0d0",
                            color: "#1a1714",
                            boxShadow: "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
                          }}
                        >
                          <option value="">Select reason...</option>
                          <option value="divergence">Decision divergence</option>
                          <option value="timing">Timing concern</option>
                          <option value="pattern">Pattern detected</option>
                          <option value="other">Other</option>
                        </select>
                        <textarea
                          value={flagNote}
                          onChange={(e) => setFlagNote(e.target.value)}
                          placeholder="Optional note..."
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-transparent border-0 outline-none resize-none"
                          style={{
                            background: "#e8e0d0",
                            color: "#1a1714",
                            boxShadow: "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFlag(app.id)}
                            disabled={!flagReason}
                            className="flex-1 py-3 rounded-[14px] text-[13px] font-bold cursor-pointer disabled:opacity-40"
                            style={{
                              background: "#e8e0d0",
                              color: "#b87a3f",
                              boxShadow: "3px 3px 8px rgba(156,148,130,0.4), -3px -3px 8px rgba(255,250,240,0.75)",
                            }}
                          >
                            Submit Flag
                          </button>
                          <button
                            onClick={() => setFlaggingId(null)}
                            className="px-4 py-3 rounded-[14px] text-[13px] font-medium cursor-pointer"
                            style={{ color: "#7a7265" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setFlaggingId(app.id)}
                        className="w-full py-4 rounded-[14px] text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer"
                        style={{
                          background: "#e8e0d0",
                          color: "#b87a3f",
                          boxShadow: "3px 3px 8px rgba(156,148,130,0.4), -3px -3px 8px rgba(255,250,240,0.75)",
                        }}
                      >
                        <Flag className="w-4 h-4" />
                        Flag for Review
                      </button>
                    )
                  ) : (
                    <div
                      className="w-full py-4 rounded-[14px] text-[13px] font-bold flex items-center justify-center gap-2"
                      style={{
                        background: "#e8e0d0",
                        color: "#9a9488",
                        boxShadow: "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
                      }}
                    >
                      <Check className="w-4 h-4" />
                      Flagged
                    </div>
                  )}

                  {/* View Full Application link */}
                  <Link
                    href={`/contractor/rfps/${app.rfp.id}`}
                    className="flex items-center justify-center gap-2 py-2 text-[12px] font-semibold"
                    style={{ color: "#7a7265" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Full Application
                  </Link>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState
            icon={Check}
            title={filter === "divergent" ? "No divergent decisions" : filter === "flagged" ? "No flagged items" : "No decisions yet"}
            description={
              filter === "divergent"
                ? "All fund manager decisions align with AI recommendations."
                : filter === "flagged"
                ? "No items have been flagged for review."
                : "Decisions will appear here as the fund manager reviews applications."
            }
          />
        )}
      </div>
    </div>
  );
}
