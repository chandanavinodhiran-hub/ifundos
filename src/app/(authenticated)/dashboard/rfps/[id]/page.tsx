"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScoreWell } from "@/components/ui/score-well";
import { NeuProgress } from "@/components/ui/neu-progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  ClipboardList,
  Trophy,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface RFPDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  createdAt: string;
  eligibilityCriteria: string | null;
  scoringRubric: string | null;
  evidenceRequirements: string | null;
  questionnaireConfig: string | null;
  program: { id: string; name: string };
  applications: ApplicationItem[];
  questionnaireQuestions: QuestionnaireQuestion[];
}

interface ApplicationItem {
  id: string;
  status: string;
  compositeScore: number | null;
  dimensionScores: string | null;
  aiFindings: string | null;
  proposalData: string | null;
  proposedBudget: number;
  submittedAt: string | null;
  shortlistedAt: string | null;
  questionnaireStatus: string;
  questionnaireSubmittedAt: string | null;
  organization: { id: string; name: string };
  decisionPacket: DecisionPacket | null;
  questionnaireResponses: QuestionnaireResponseItem[];
  questionnaireEvaluations: QuestionnaireEvaluation[];
}

interface DecisionPacket {
  id: string;
  narrative: string | null;
  recommendation: string | null;
  executiveSummary: string | null;
  strengths: string | null;
  risks: string | null;
  createdByModel: string | null;
}

interface QuestionnaireQuestion {
  id: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  sortOrder: number;
}

interface QuestionnaireResponseItem {
  id: string;
  questionId: string;
  responseText: string | null;
  filePath: string | null;
  submittedAt: string | null;
}

interface QuestionnaireEvaluation {
  id: string;
  questionId: string;
  internalNotes: string | null;
  internalScore: number | null;
}

interface EligibilityCriteria {
  minCapitalization?: number | null;
  businessCategories?: string[];
  minTrustTier?: string;
  certifications?: string[];
  geoRestrictions?: string | null;
}

interface ScoringDimension {
  name: string;
  weight: number;
  criteria: string;
}

/* ------------------------------------------------------------------ */
/* Status badge variants                                               */
/* ------------------------------------------------------------------ */

const RFP_STATUS_VARIANT: Record<string, "neu-gold" | "neu-amber" | "neu" | "neu-verified"> = {
  DRAFT: "neu-amber",
  OPEN: "neu-gold",
  CLOSED: "neu",
  AWARDED: "neu-verified",
};

const APP_STATUS_VARIANT: Record<string, "neu-gold" | "neu-amber" | "neu" | "neu-verified" | "neu-critical"> = {
  DRAFT: "neu",
  SUBMITTED: "neu-amber",
  SCORING: "neu-amber",
  IN_REVIEW: "neu-amber",
  SHORTLISTED: "neu-gold",
  QUESTIONNAIRE_PENDING: "neu-amber",
  QUESTIONNAIRE_SUBMITTED: "neu-gold",
  APPROVED: "neu-verified",
  REJECTED: "neu-critical",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return "No deadline";
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "Closed";
  if (diff === 0) return "Due today";
  return `${diff} days left`;
}

/* ------------------------------------------------------------------ */
/* Tab definitions                                                     */
/* ------------------------------------------------------------------ */

type TabKey = "applications" | "overview" | "questionnaire" | "selection";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "applications", label: "Applications", icon: Users },
  { key: "overview", label: "Overview", icon: FileText },
  { key: "questionnaire", label: "Questionnaire", icon: ClipboardList },
  { key: "selection", label: "Selection", icon: Trophy },
];

/* ================================================================== */
/* PAGE COMPONENT                                                      */
/* ================================================================== */

export default function RFPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rfpId } = use(params);

  const [rfp, setRfp] = useState<RFPDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("applications");

  /* scoring */
  const [scoringAll, setScoringAll] = useState(false);

  /* shortlist checkboxes */
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [shortlisting, setShortlisting] = useState(false);
  const [sendingQuestionnaire, setSendingQuestionnaire] = useState(false);

  /* expand application card */
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  /* RFP description expander */
  const [descExpanded, setDescExpanded] = useState(false);

  /* award dialog */
  const [awardDialog, setAwardDialog] = useState<{
    open: boolean;
    applicationId: string;
    orgName: string;
  }>({ open: false, applicationId: "", orgName: "" });
  const [awardAmount, setAwardAmount] = useState("");
  const [awardJustification, setAwardJustification] = useState("");
  const [awarding, setAwarding] = useState(false);

  /* questionnaire comparison */
  const [compareApps, setCompareApps] = useState<string[]>(["", "", ""]);

  /* questionnaire evaluation local state */
  const [evalNotes, setEvalNotes] = useState<
    Record<string, { notes: string; score: string }>
  >({});
  const [savingEval, setSavingEval] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /* Fetch RFP detail                                                  */
  /* ---------------------------------------------------------------- */
  const fetchRfp = useCallback(async () => {
    try {
      const res = await fetch(`/api/rfps/${rfpId}`);
      if (res.ok) {
        const data = await res.json();
        setRfp(data.rfp ?? data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [rfpId]);

  useEffect(() => {
    fetchRfp();
  }, [fetchRfp]);

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */
  const handleScoreAll = async () => {
    setScoringAll(true);
    try {
      await fetch(`/api/rfps/${rfpId}/score-all`, { method: "POST" });
      await fetchRfp();
    } catch {
      /* silent */
    } finally {
      setScoringAll(false);
    }
  };

  const handleShortlist = async () => {
    if (selectedApps.size === 0) return;
    setShortlisting(true);
    try {
      await fetch(`/api/rfps/${rfpId}/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: Array.from(selectedApps) }),
      });
      setSelectedApps(new Set());
      await fetchRfp();
    } catch {
      /* silent */
    } finally {
      setShortlisting(false);
    }
  };

  const handleSendQuestionnaire = async () => {
    setSendingQuestionnaire(true);
    try {
      await fetch(`/api/rfps/${rfpId}/send-questionnaire`, { method: "POST" });
      await fetchRfp();
    } catch {
      /* silent */
    } finally {
      setSendingQuestionnaire(false);
    }
  };

  const handleAward = async () => {
    if (!awardJustification.trim()) return;
    setAwarding(true);
    try {
      await fetch(`/api/rfps/${rfpId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: awardDialog.applicationId,
          awardAmount: awardAmount ? parseFloat(awardAmount) : 0,
          justification: awardJustification,
        }),
      });
      setAwardDialog({ open: false, applicationId: "", orgName: "" });
      setAwardAmount("");
      setAwardJustification("");
      await fetchRfp();
    } catch {
      /* silent */
    } finally {
      setAwarding(false);
    }
  };

  const handleSaveEvaluation = async (
    applicationId: string,
    questionId: string
  ) => {
    const key = `${applicationId}:${questionId}`;
    const entry = evalNotes[key];
    if (!entry) return;
    setSavingEval(key);
    try {
      await fetch(`/api/applications/${applicationId}/questionnaire/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          internalNotes: entry.notes,
          internalScore: entry.score ? parseInt(entry.score) : null,
        }),
      });
      await fetchRfp();
    } catch {
      /* silent */
    } finally {
      setSavingEval(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Loading / Empty                                                   */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-sovereign-stone/40 mb-3" />
        <p className="text-sovereign-stone">RFP not found</p>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Parsed data                                                       */
  /* ---------------------------------------------------------------- */
  const eligibility = safeParse<EligibilityCriteria>(
    rfp.eligibilityCriteria,
    {}
  );
  const scoringRubric = safeParse<ScoringDimension[]>(rfp.scoringRubric, []);
  const evidenceReqs = safeParse<string[]>(rfp.evidenceRequirements, []);
  const deadlineLabel = daysUntil(rfp.deadline);
  const deadlineDanger = deadlineLabel === "Closed" || deadlineLabel === "Due today";

  const submittedApps = rfp.applications.filter(
    (a) => a.status === "SUBMITTED"
  );
  const shortlistedApps = rfp.applications.filter(
    (a) =>
      [
        "SHORTLISTED",
        "QUESTIONNAIRE_PENDING",
        "QUESTIONNAIRE_SUBMITTED",
        "APPROVED",
      ].includes(a.status)
  );
  const hasMockedScores = rfp.applications.some(
    (a) => a.decisionPacket?.createdByModel === "mock"
  );

  /* ================================================================ */
  /* RENDER                                                            */
  /* ================================================================ */
  return (
    <div className="space-y-5">
      {/* ============ Header ============ */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-eyebrow">{rfp.program?.name ?? "RFP"}</p>
            <h1 className="text-xl font-bold text-sovereign-charcoal font-display leading-snug">
              {rfp.title}
            </h1>
          </div>
          <Badge variant={RFP_STATUS_VARIANT[rfp.status] ?? "neu"}>
            {rfp.status}
          </Badge>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            deadlineDanger ? "text-critical" : "text-sovereign-stone"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {deadlineLabel}
        </div>
      </div>

      {/* ============ RFP Description (collapsed) ============ */}
      {rfp.description && (
        <Card variant="neu-inset">
          <CardContent className="p-4 pt-4">
            <button
              className="flex items-center justify-between w-full text-left cursor-pointer"
              onClick={() => setDescExpanded(!descExpanded)}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-sovereign-stone">
                RFP Description
              </span>
              {descExpanded ? (
                <ChevronUp className="w-4 h-4 text-sovereign-stone" />
              ) : (
                <ChevronDown className="w-4 h-4 text-sovereign-stone" />
              )}
            </button>
            {descExpanded && (
              <p className="text-sm text-sovereign-stone mt-3 whitespace-pre-wrap">
                {rfp.description}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============ Tabs ============ */}
      <div className="flex gap-1 overflow-x-auto pb-px -mx-1 px-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === key
                ? "bg-sovereign-charcoal text-neu-light shadow-neu-raised-sm"
                : "bg-neu-dark text-sovereign-stone shadow-neu-inset hover:text-sovereign-charcoal"
            }`}
            onClick={() => setActiveTab(key)}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ============ Tab Content ============ */}

      {/* ==================== APPLICATIONS TAB ==================== */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-3">
            {submittedApps.length > 0 && (
              <Button
                variant="neu-primary"
                size="sm"
                disabled={scoringAll}
                onClick={handleScoreAll}
              >
                {scoringAll && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                )}
                Score All
              </Button>
            )}
            {selectedApps.size > 0 && (
              <Button
                variant="neu-gold"
                size="sm"
                disabled={shortlisting}
                onClick={handleShortlist}
              >
                {shortlisting && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                )}
                Shortlist ({selectedApps.size})
              </Button>
            )}
            {shortlistedApps.some((a) => a.status === "SHORTLISTED") && (
              <Button
                variant="neu-secondary"
                size="sm"
                disabled={sendingQuestionnaire}
                onClick={handleSendQuestionnaire}
              >
                {sendingQuestionnaire && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                )}
                Send Questionnaire
              </Button>
            )}
          </div>

          {/* Demo mode banner */}
          {hasMockedScores && (
            <Card variant="neu-inset">
              <CardContent className="flex items-center gap-2 p-3 pt-3 text-xs text-amber">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Demo Mode:</strong> AI scores were generated using mock
                  data. Connect an AI provider for real scoring.
                </span>
              </CardContent>
            </Card>
          )}

          {/* Application Cards */}
          {rfp.applications.length === 0 ? (
            <Card variant="neu-inset">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center pt-6">
                <Users className="w-12 h-12 text-sovereign-stone/40 mb-3" />
                <p className="text-sovereign-stone font-medium">
                  No applications received yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rfp.applications.map((app) => {
                const isExpanded = expandedApp === app.id;
                const packet = app.decisionPacket;
                const strengths = safeParse<string[]>(
                  packet?.strengths ?? null,
                  []
                );
                const risks = safeParse<string[]>(
                  packet?.risks ?? null,
                  []
                );
                const proposal = safeParse<Record<string, unknown>>(app.proposalData, {});
                const projectTitle = (proposal.projectTitle as string) || (proposal.title as string) || null;

                return (
                  <Card
                    key={app.id}
                    variant="neu-raised"
                    className="overflow-hidden"
                  >
                    <CardContent className="p-0">
                      {/* Main card row */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer"
                        onClick={() =>
                          setExpandedApp(isExpanded ? null : app.id)
                        }
                      >
                        {/* Checkbox */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-sovereign-stone/30 w-4 h-4"
                            checked={selectedApps.has(app.id)}
                            onChange={() => {
                              setSelectedApps((prev) => {
                                const next = new Set(prev);
                                if (next.has(app.id))
                                  next.delete(app.id);
                                else next.add(app.id);
                                return next;
                              });
                            }}
                          />
                        </div>

                        {/* Score Well */}
                        {app.compositeScore !== null ? (
                          <ScoreWell
                            score={Math.round(app.compositeScore)}
                            size="sm"
                            animated={false}
                          />
                        ) : (
                          <div className="score-well score-well-sm flex items-center justify-center">
                            <span className="text-xs text-sovereign-stone">--</span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-sovereign-charcoal truncate">
                            {app.organization.name}
                          </p>
                          <p className="text-xs text-sovereign-stone truncate">
                            {projectTitle || (app.proposedBudget ? `${app.proposedBudget.toLocaleString()} SAR` : "No budget")}
                          </p>
                        </div>

                        {/* Status + chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={APP_STATUS_VARIANT[app.status] ?? "neu"} className="text-[10px]">
                            {app.status.replace(/_/g, " ")}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-sovereign-stone" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-sovereign-stone" />
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-neu-dark/60 p-4 space-y-4 bg-neu-dark/20">
                          {/* Application summary */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-neu-base rounded-[14px] shadow-neu-inset p-3 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-sovereign-stone">Project</p>
                              <p className="text-xs font-semibold text-sovereign-charcoal mt-0.5 truncate">{projectTitle || app.organization.name}</p>
                            </div>
                            <div className="bg-neu-base rounded-[14px] shadow-neu-inset p-3 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-sovereign-stone">Budget</p>
                              <p className="text-xs font-semibold font-mono text-sovereign-charcoal mt-0.5">{app.proposedBudget ? `${app.proposedBudget.toLocaleString()} SAR` : "---"}</p>
                            </div>
                            <div className="bg-neu-base rounded-[14px] shadow-neu-inset p-3 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-sovereign-stone">Submitted</p>
                              <p className="text-xs font-semibold text-sovereign-charcoal mt-0.5">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "---"}</p>
                            </div>
                          </div>

                          {/* AI Score breakdown */}
                          {app.compositeScore != null && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-sovereign-charcoal uppercase tracking-wider">AI Score Breakdown</h4>
                              <div className="space-y-2">
                                <NeuProgress
                                  value={Math.min(100, app.compositeScore)}
                                  variant="gold"
                                  label="Composite"
                                  showValue
                                />
                                {(() => {
                                  const dims = safeParse<Record<string, number>>(app.dimensionScores, {});
                                  const dimLabels: Record<string, string> = {
                                    procurement: "Procurement",
                                    vision: "Vision",
                                    viability: "Viability",
                                    impact: "Impact",
                                  };
                                  const dimVariants: Record<string, "gold" | "green" | "amber" | "critical"> = {
                                    procurement: "green",
                                    vision: "gold",
                                    viability: "amber",
                                    impact: "green",
                                  };
                                  return Object.entries(dimLabels).map(([key, label]) => {
                                    const val = dims[key] ?? 0;
                                    return (
                                      <NeuProgress
                                        key={key}
                                        value={Math.min(100, val)}
                                        variant={dimVariants[key]}
                                        label={label}
                                        showValue
                                        size="sm"
                                        delay={200}
                                      />
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Decision packet summary */}
                          {packet && (
                            <div className="space-y-3">
                              {packet.executiveSummary && (
                                <div>
                                  <h4 className="text-xs font-bold text-sovereign-charcoal uppercase tracking-wider mb-1">Executive Summary</h4>
                                  <p className="text-xs text-sovereign-stone leading-relaxed">{packet.executiveSummary}</p>
                                </div>
                              )}
                              {packet.recommendation && (
                                <div>
                                  <h4 className="text-xs font-bold text-sovereign-charcoal uppercase tracking-wider mb-1">Recommendation</h4>
                                  <Badge
                                    variant={
                                      packet.recommendation === "RECOMMEND"
                                        ? "neu-verified"
                                        : packet.recommendation === "RECOMMEND_WITH_CONDITIONS"
                                        ? "neu-amber"
                                        : "neu-critical"
                                    }
                                  >
                                    {packet.recommendation.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {strengths.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-bold text-sovereign-charcoal uppercase tracking-wider mb-1">Strengths</h4>
                                    <ul className="space-y-1">
                                      {strengths.map((s, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-sovereign-stone">
                                          <CheckCircle2 className="w-3 h-3 text-verified mt-0.5 shrink-0" />
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {risks.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-bold text-sovereign-charcoal uppercase tracking-wider mb-1">Risks</h4>
                                    <ul className="space-y-1">
                                      {risks.map((r, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-sovereign-stone">
                                          <AlertTriangle className="w-3 h-3 text-amber mt-0.5 shrink-0" />
                                          {r}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* AI Findings */}
                          {app.aiFindings && (
                            <div>
                              <h4 className="text-xs font-bold text-sovereign-charcoal uppercase tracking-wider mb-1">AI Findings</h4>
                              {(() => {
                                const findings = safeParse<string[]>(app.aiFindings, []);
                                return findings.length > 0 ? (
                                  <ul className="space-y-1">
                                    {findings.slice(0, 5).map((f, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-sovereign-stone">
                                        <AlertTriangle className="w-3 h-3 text-amber mt-0.5 shrink-0" />
                                        {f}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null;
                              })()}
                            </div>
                          )}

                          {/* Proposal details */}
                          {app.proposalData && (
                            <details className="group">
                              <summary className="text-xs font-semibold cursor-pointer hover:text-sovereign-gold transition-colors text-sovereign-charcoal">
                                Full Proposal Details
                              </summary>
                              <div className="mt-2 p-3 bg-neu-base rounded-[14px] shadow-neu-inset text-[11px] text-sovereign-stone whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {(() => {
                                  return Object.entries(proposal).map(([key, val]) => (
                                    <div key={key} className="mb-2">
                                      <span className="font-semibold text-sovereign-charcoal capitalize">{key.replace(/([A-Z])/g, " $1").trim()}: </span>
                                      {typeof val === "object" ? JSON.stringify(val, null, 2) : String(val ?? "---")}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </details>
                          )}

                          {/* Shortlist action */}
                          {["SUBMITTED", "SCORING", "IN_REVIEW"].includes(app.status) && (
                            <div className="pt-2 border-t border-neu-dark/60 flex items-center gap-3">
                              <Button
                                variant="neu-gold"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApps((prev) => {
                                    const next = new Set(prev);
                                    next.add(app.id);
                                    return next;
                                  });
                                }}
                              >
                                Shortlist This Contractor
                              </Button>
                              <span className="text-[10px] text-sovereign-stone">
                                Or use checkboxes to shortlist multiple
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Description */}
          {rfp.description && (
            <Card variant="neu-raised">
              <CardContent className="p-5 pt-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sovereign-stone">Description</h3>
                <p className="text-sm text-sovereign-charcoal whitespace-pre-wrap">{rfp.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Eligibility */}
          <Card variant="neu-raised">
            <CardContent className="p-5 pt-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sovereign-stone">Eligibility Criteria</h3>
              <div className="space-y-2 text-sm">
                {eligibility.minCapitalization != null && (
                  <div className="flex justify-between">
                    <span className="text-sovereign-stone">Min Capitalization</span>
                    <span className="font-mono font-medium text-sovereign-charcoal">
                      {eligibility.minCapitalization.toLocaleString()} SAR
                    </span>
                  </div>
                )}
                {eligibility.businessCategories &&
                  eligibility.businessCategories.length > 0 && (
                    <div>
                      <span className="text-sovereign-stone text-xs">Business Categories</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {eligibility.businessCategories.map((c) => (
                          <Badge key={c} variant="neu-gold">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {eligibility.minTrustTier && (
                  <div className="flex justify-between">
                    <span className="text-sovereign-stone">Min Trust Tier</span>
                    <span className="font-mono font-medium text-sovereign-charcoal">{eligibility.minTrustTier}</span>
                  </div>
                )}
                {eligibility.certifications &&
                  eligibility.certifications.length > 0 && (
                    <div>
                      <span className="text-sovereign-stone text-xs">Certifications</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {eligibility.certifications.map((c) => (
                          <Badge key={c} variant="neu">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {eligibility.geoRestrictions && (
                  <div className="flex justify-between">
                    <span className="text-sovereign-stone">Geo Restrictions</span>
                    <span className="font-medium text-sovereign-charcoal">{eligibility.geoRestrictions}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scoring Rubric */}
          {scoringRubric.length > 0 && (
            <Card variant="neu-raised">
              <CardContent className="p-5 pt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sovereign-stone">Scoring Rubric</h3>
                <div className="space-y-3">
                  {scoringRubric.map((dim) => (
                    <div key={dim.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-sovereign-charcoal">{dim.name}</span>
                        <span className="text-xs font-mono text-sovereign-stone">{dim.weight}%</span>
                      </div>
                      <NeuProgress value={dim.weight} variant="gold" size="sm" />
                      <p className="text-xs text-sovereign-stone">{dim.criteria || "---"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Requirements */}
          {evidenceReqs.length > 0 && (
            <Card variant="neu-raised">
              <CardContent className="p-5 pt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sovereign-stone">Evidence Requirements</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {evidenceReqs.map((ev) => (
                    <li key={ev} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-verified shrink-0" />
                      {ev}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ==================== QUESTIONNAIRE TAB ==================== */}
      {activeTab === "questionnaire" && (
        <div className="space-y-4">
          {/* Shortlisted contractors */}
          {shortlistedApps.length === 0 ? (
            <Card variant="neu-inset">
              <CardContent className="p-6 pt-6 text-center text-sovereign-stone text-sm">
                No shortlisted contractors yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shortlistedApps.map((app) => {
                const isExpanded = expandedApp === `q-${app.id}`;
                return (
                  <Card key={app.id} variant="neu-raised" className="overflow-hidden">
                    <CardContent className="p-0">
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer"
                        onClick={() =>
                          setExpandedApp(isExpanded ? null : `q-${app.id}`)
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-sovereign-charcoal truncate">
                            {app.organization.name}
                          </p>
                          <p className="text-xs text-sovereign-stone">
                            {app.questionnaireSubmittedAt
                              ? `Submitted ${new Date(app.questionnaireSubmittedAt).toLocaleDateString()}`
                              : "Not submitted yet"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            app.questionnaireStatus === "SUBMITTED"
                              ? "neu-verified"
                              : app.questionnaireStatus === "PENDING"
                              ? "neu-amber"
                              : "neu"
                          }
                        >
                          {app.questionnaireStatus}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-sovereign-stone" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-sovereign-stone" />
                        )}
                      </div>

                      {/* Expanded responses */}
                      {isExpanded && (
                        <div className="border-t border-neu-dark/60 p-4 space-y-4 bg-neu-dark/20">
                          {(!app.questionnaireResponses || app.questionnaireResponses.length === 0) ? (
                            <p className="text-sm text-sovereign-stone">
                              No responses submitted yet
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {rfp.questionnaireQuestions
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((q) => {
                                  const resp = (app.questionnaireResponses || []).find(
                                    (r) => r.questionId === q.id
                                  );
                                  const evalKey = `${app.id}:${q.id}`;
                                  const existingEval = (app.questionnaireEvaluations || []).find(
                                    (e) => e.questionId === q.id
                                  );
                                  const localEval = evalNotes[evalKey];
                                  return (
                                    <div
                                      key={q.id}
                                      className="rounded-[14px] bg-neu-base shadow-neu-raised-sm p-4 space-y-2"
                                    >
                                      <p className="text-xs font-semibold text-sovereign-charcoal">
                                        {q.questionText}
                                      </p>
                                      <p className="text-xs text-sovereign-stone bg-neu-dark/30 rounded-xl p-2">
                                        {resp?.responseText ||
                                          resp?.filePath ||
                                          "No response"}
                                      </p>
                                      <Separator className="bg-sovereign-stone/15" />
                                      <div className="space-y-2">
                                        <Label className="text-[10px] text-sovereign-stone uppercase tracking-wider">
                                          Internal Notes
                                        </Label>
                                        <textarea
                                          className="flex min-h-[50px] w-full rounded-xl border-0 bg-neu-dark shadow-neu-inset px-3 py-2 text-xs text-sovereign-charcoal placeholder:text-sovereign-stone focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                                          placeholder="Add internal evaluation notes..."
                                          value={
                                            localEval?.notes ??
                                            existingEval?.internalNotes ??
                                            ""
                                          }
                                          onChange={(e) =>
                                            setEvalNotes((prev) => ({
                                              ...prev,
                                              [evalKey]: {
                                                notes: e.target.value,
                                                score:
                                                  prev[evalKey]?.score ??
                                                  String(existingEval?.internalScore ?? ""),
                                              },
                                            }))
                                          }
                                        />
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2">
                                            <Label className="text-[10px] text-sovereign-stone">
                                              Score (0-10)
                                            </Label>
                                            <input
                                              type="number"
                                              min={0}
                                              max={10}
                                              className="flex h-8 w-20 rounded-xl border-0 bg-neu-dark shadow-neu-inset px-2 py-1 text-xs text-sovereign-charcoal focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                                              value={
                                                localEval?.score ??
                                                String(existingEval?.internalScore ?? "")
                                              }
                                              onChange={(e) =>
                                                setEvalNotes((prev) => ({
                                                  ...prev,
                                                  [evalKey]: {
                                                    notes:
                                                      prev[evalKey]?.notes ??
                                                      existingEval?.internalNotes ?? "",
                                                    score: e.target.value,
                                                  },
                                                }))
                                              }
                                            />
                                          </div>
                                          <Button
                                            variant="neu-gold"
                                            size="sm"
                                            disabled={savingEval === evalKey}
                                            onClick={() =>
                                              handleSaveEvaluation(app.id, q.id)
                                            }
                                          >
                                            {savingEval === evalKey && (
                                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                            )}
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Side-by-side comparison */}
          {shortlistedApps.length >= 2 && (
            <Card variant="neu-raised">
              <CardContent className="p-5 pt-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sovereign-stone">Side-by-Side Comparison</h3>
                {/* Contractor selectors */}
                <div className="flex flex-wrap gap-3">
                  {[0, 1, 2].map((slot) => (
                    <div key={slot} className="flex-1 min-w-[200px]">
                      <Label className="text-[10px] text-sovereign-stone mb-1 block">
                        Contractor {slot + 1}
                      </Label>
                      <Select
                        value={compareApps[slot]}
                        onValueChange={(v) =>
                          setCompareApps((prev) => {
                            const next = [...prev];
                            next[slot] = v;
                            return next;
                          })
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select contractor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {shortlistedApps.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.organization.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {/* Comparison grid */}
                {compareApps.some((id) => id && id !== "none") && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neu-dark/60">
                          <th className="text-left p-3 text-[10px] uppercase tracking-wider text-sovereign-stone w-1/4">
                            Question
                          </th>
                          {compareApps.map((appId, slot) => {
                            const app = shortlistedApps.find(
                              (a) => a.id === appId
                            );
                            return (
                              <th
                                key={slot}
                                className="text-left p-3 text-[10px] uppercase tracking-wider text-sovereign-stone"
                              >
                                {app ? app.organization.name : "---"}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {rfp.questionnaireQuestions
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((q) => (
                            <tr key={q.id} className="border-b border-neu-dark/40 last:border-0">
                              <td className="p-3 font-medium text-xs align-top text-sovereign-charcoal">
                                {q.questionText}
                              </td>
                              {compareApps.map((appId, slot) => {
                                const app = shortlistedApps.find(
                                  (a) => a.id === appId
                                );
                                const resp = (app?.questionnaireResponses || []).find(
                                  (r) => r.questionId === q.id
                                );
                                return (
                                  <td
                                    key={slot}
                                    className="p-3 text-xs text-sovereign-stone align-top"
                                  >
                                    {resp?.responseText ||
                                      resp?.filePath ||
                                      "---"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ==================== SELECTION TAB ==================== */}
      {activeTab === "selection" && (
        <div className="space-y-4">
          {shortlistedApps.length === 0 ? (
            <Card variant="neu-inset">
              <CardContent className="p-6 pt-6 text-center text-sovereign-stone text-sm">
                No shortlisted contractors to compare
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Cards for each shortlisted contractor */}
              {shortlistedApps.map((app) => {
                const dims = safeParse<Record<string, number>>(app.dimensionScores, {});
                const appStrengths = safeParse<string[]>(app.decisionPacket?.strengths ?? null, []);
                const appRisks = safeParse<string[]>(app.decisionPacket?.risks ?? null, []);
                const appProposal = safeParse<Record<string, unknown>>(app.proposalData, {});
                const teamSize = (appProposal.teamSize as number) ?? (appProposal.team_size as number) ?? null;
                const pastProjectCount = (appProposal.pastProjectCount as number) ?? (appProposal.past_project_count as number) ?? null;

                return (
                  <Card key={app.id} variant="neu-raised">
                    <CardContent className="p-5 pt-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-sovereign-charcoal">{app.organization.name}</p>
                          <p className="text-xs text-sovereign-stone font-mono">
                            {app.proposedBudget ? `${app.proposedBudget.toLocaleString()} SAR` : "---"}
                          </p>
                        </div>
                        {app.status === "APPROVED" ? (
                          <Badge variant="neu-verified" className="gap-1">
                            <Trophy className="w-3 h-3" />
                            Winner
                          </Badge>
                        ) : (
                          <Button
                            variant="neu-gold"
                            size="sm"
                            onClick={() => {
                              setAwardDialog({
                                open: true,
                                applicationId: app.id,
                                orgName: app.organization.name,
                              });
                              setAwardAmount(
                                app.proposedBudget ? String(app.proposedBudget) : ""
                              );
                            }}
                          >
                            <Trophy className="w-3 h-3 mr-1" />
                            Select
                          </Button>
                        )}
                      </div>

                      {/* Score + dimensions */}
                      <div className="flex items-center gap-4">
                        <ScoreWell
                          score={app.compositeScore ? Math.round(app.compositeScore) : 0}
                          label="Composite"
                          verdict={
                            app.compositeScore
                              ? app.compositeScore >= 75
                                ? "Strong"
                                : app.compositeScore >= 50
                                ? "Fair"
                                : "Weak"
                              : undefined
                          }
                          size="sm"
                        />
                        <div className="flex-1 space-y-1.5">
                          {(["procurement", "vision", "viability", "impact"] as const).map((dim) => (
                            <NeuProgress
                              key={dim}
                              value={Math.min(100, dims[dim] ?? 0)}
                              variant="gold"
                              label={dim.charAt(0).toUpperCase() + dim.slice(1)}
                              showValue
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Questionnaire + meta */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge
                          variant={
                            app.questionnaireStatus === "SUBMITTED"
                              ? "neu-verified"
                              : app.questionnaireStatus === "PENDING"
                              ? "neu-amber"
                              : "neu"
                          }
                        >
                          Q: {app.questionnaireStatus}
                        </Badge>
                        {teamSize && <Badge variant="neu">Team: {teamSize}</Badge>}
                        {pastProjectCount && <Badge variant="neu">Projects: {pastProjectCount}</Badge>}
                      </div>

                      {/* Strengths & Risks */}
                      {(appStrengths.length > 0 || appRisks.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {appStrengths.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-sovereign-stone mb-1">Strengths</p>
                              <ul className="space-y-0.5">
                                {appStrengths.slice(0, 3).map((s, i) => (
                                  <li key={i} className="flex items-start gap-1 text-[11px] text-sovereign-stone">
                                    <CheckCircle2 className="w-3 h-3 text-verified mt-0.5 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {appRisks.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-sovereign-stone mb-1">Risks</p>
                              <ul className="space-y-0.5">
                                {appRisks.slice(0, 3).map((r, i) => (
                                  <li key={i} className="flex items-start gap-1 text-[11px] text-sovereign-stone">
                                    <AlertTriangle className="w-3 h-3 text-amber mt-0.5 shrink-0" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== AWARD DIALOG ==================== */}
      <Dialog
        open={awardDialog.open}
        onOpenChange={(open) =>
          setAwardDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-md bg-neu-base">
          <DialogHeader>
            <DialogTitle className="text-lg text-sovereign-charcoal font-display">
              Confirm Award
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-sovereign-stone">
              Award the contract to{" "}
              <span className="font-semibold text-sovereign-charcoal">
                {awardDialog.orgName}
              </span>
              ?
            </p>
            <div className="space-y-2">
              <Label>Award Amount (SAR)</Label>
              <input
                type="number"
                className="flex h-10 w-full rounded-xl border-0 bg-neu-dark shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                value={awardAmount}
                onChange={(e) => setAwardAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Justification <span className="text-critical">*</span>
              </Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-xl border-0 bg-neu-dark shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                placeholder="Provide justification for this award decision..."
                value={awardJustification}
                onChange={(e) => setAwardJustification(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="neu-secondary"
                onClick={() =>
                  setAwardDialog({
                    open: false,
                    applicationId: "",
                    orgName: "",
                  })
                }
              >
                Cancel
              </Button>
              <Button
                variant="neu-gold"
                disabled={awarding || !awardJustification.trim()}
                onClick={handleAward}
              >
                {awarding && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Confirm Award
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
