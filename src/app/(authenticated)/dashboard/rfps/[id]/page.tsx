"use client";

import { Fragment, use, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
/* Status badge colors                                                 */
/* ------------------------------------------------------------------ */

const RFP_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-700",
  CLOSED: "bg-orange-100 text-orange-700",
  AWARDED: "bg-blue-100 text-blue-700",
};

const APP_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  SCORING: "bg-yellow-100 text-yellow-700 animate-pulse",
  IN_REVIEW: "bg-orange-100 text-orange-700",
  SHORTLISTED: "bg-teal-100 text-teal-700",
  QUESTIONNAIRE_PENDING: "bg-purple-100 text-purple-700",
  QUESTIONNAIRE_SUBMITTED: "bg-indigo-100 text-indigo-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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

function scoreColor(score: number | null): string {
  if (score === null || score === undefined) return "bg-gray-200";
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

/* ------------------------------------------------------------------ */
/* Tab definitions                                                     */
/* ------------------------------------------------------------------ */

type TabKey = "overview" | "applications" | "questionnaire" | "selection";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "applications", label: "Applications", icon: Users },
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
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  /* scoring */
  const [scoringAll, setScoringAll] = useState(false);

  /* shortlist checkboxes */
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [shortlisting, setShortlisting] = useState(false);
  const [sendingQuestionnaire, setSendingQuestionnaire] = useState(false);

  /* expand application row */
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

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
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-muted-foreground">RFP not found</p>
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
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{rfp.title}</h1>
          <p className="text-muted-foreground mt-1">
            {rfp.program?.name ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              RFP_STATUS_BADGE[rfp.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {rfp.status}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${
              deadlineDanger ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            {deadlineLabel}
          </span>
        </div>
      </div>

      {/* ============ Tabs ============ */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-teal text-teal"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
            onClick={() => setActiveTab(key)}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ============ Tab Content ============ */}

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Description */}
          {rfp.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{rfp.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eligibility Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {eligibility.minCapitalization != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Minimum Capitalization
                  </span>
                  <span className="font-medium">
                    {eligibility.minCapitalization.toLocaleString()} SAR
                  </span>
                </div>
              )}
              {eligibility.businessCategories &&
                eligibility.businessCategories.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">
                      Business Categories
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {eligibility.businessCategories.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center rounded-full bg-teal/10 text-teal-700 px-2.5 py-0.5 text-xs font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {eligibility.minTrustTier && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Minimum Trust Tier
                  </span>
                  <span className="font-medium">
                    {eligibility.minTrustTier}
                  </span>
                </div>
              )}
              {eligibility.certifications &&
                eligibility.certifications.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">
                      Required Certifications
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {eligibility.certifications.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {eligibility.geoRestrictions && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Geographic Restrictions
                  </span>
                  <span className="font-medium">
                    {eligibility.geoRestrictions}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scoring Rubric */}
          {scoringRubric.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scoring Rubric</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-muted-foreground">
                        Dimension
                      </th>
                      <th className="text-center p-2 font-medium text-muted-foreground w-24">
                        Weight
                      </th>
                      <th className="text-left p-2 font-medium text-muted-foreground">
                        Criteria
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoringRubric.map((dim) => (
                      <tr key={dim.name} className="border-b last:border-0">
                        <td className="p-2 font-medium">{dim.name}</td>
                        <td className="p-2 text-center font-mono">
                          {dim.weight}%
                        </td>
                        <td className="p-2 text-muted-foreground">
                          {dim.criteria || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Evidence Requirements */}
          {evidenceReqs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Evidence Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {evidenceReqs.map((ev) => (
                    <li key={ev} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                      {ev}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Edit button (DRAFT only) */}
          {rfp.status === "DRAFT" && (
            <div className="flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                Edit RFP
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== APPLICATIONS TAB ==================== */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-3">
            {submittedApps.length > 0 && (
              <button
                disabled={scoringAll}
                className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors disabled:opacity-50"
                onClick={handleScoreAll}
              >
                {scoringAll && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Score All Applications
              </button>
            )}
            {selectedApps.size > 0 && (
              <button
                disabled={shortlisting}
                className="inline-flex items-center gap-2 rounded-md bg-navy-800 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 transition-colors disabled:opacity-50"
                onClick={handleShortlist}
              >
                {shortlisting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Shortlist Selected ({selectedApps.size})
              </button>
            )}
            {shortlistedApps.some((a) => a.status === "SHORTLISTED") && (
              <button
                disabled={sendingQuestionnaire}
                className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                onClick={handleSendQuestionnaire}
              >
                {sendingQuestionnaire && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Send Questionnaire
              </button>
            )}
          </div>

          {/* Demo mode banner */}
          {hasMockedScores && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Demo Mode:</strong> AI scores were generated using mock
                data. Connect an AI provider for real scoring.
              </span>
            </div>
          )}

          {/* Applications table */}
          <Card>
            <CardContent className="p-0">
              {rfp.applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-muted-foreground">
                    No applications received yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="w-10 p-4" />
                        <th className="text-left font-medium p-4 text-muted-foreground">
                          Organization
                        </th>
                        <th className="text-left font-medium p-4 text-muted-foreground">
                          Submitted
                        </th>
                        <th className="text-left font-medium p-4 text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left font-medium p-4 text-muted-foreground w-48">
                          Composite Score
                        </th>
                        <th className="text-center font-medium p-4 text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
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
                        return (
                          <Fragment key={app.id}>
                            <tr
                              className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() =>
                                setExpandedApp(isExpanded ? null : app.id)
                              }
                            >
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300"
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
                              </td>
                              <td className="p-4 font-medium">
                                {app.organization.name}
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {app.submittedAt
                                  ? new Date(
                                      app.submittedAt
                                    ).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    APP_STATUS_BADGE[app.status] ??
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {app.status.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="p-4">
                                {app.compositeScore !== null ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${scoreColor(
                                          app.compositeScore
                                        )}`}
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            app.compositeScore
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-mono w-8 text-right">
                                      {Math.round(app.compositeScore)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Not scored
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 inline text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 inline text-muted-foreground" />
                                )}
                              </td>
                            </tr>

                            {/* Expanded row */}
                            {isExpanded && packet && (
                              <tr className="border-b bg-muted/10">
                                <td colSpan={6} className="p-6">
                                  <div className="space-y-4">
                                    {packet.executiveSummary && (
                                      <div>
                                        <h4 className="text-sm font-semibold mb-1">
                                          Executive Summary
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          {packet.executiveSummary}
                                        </p>
                                      </div>
                                    )}
                                    {packet.recommendation && (
                                      <div>
                                        <h4 className="text-sm font-semibold mb-1">
                                          Recommendation
                                        </h4>
                                        <span
                                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            packet.recommendation === "RECOMMEND"
                                              ? "bg-green-100 text-green-700"
                                              : packet.recommendation ===
                                                "RECOMMEND_WITH_CONDITIONS"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-red-100 text-red-700"
                                          }`}
                                        >
                                          {packet.recommendation.replace(
                                            /_/g,
                                            " "
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {strengths.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-1">
                                            Key Strengths
                                          </h4>
                                          <ul className="space-y-1">
                                            {strengths.map((s, i) => (
                                              <li
                                                key={i}
                                                className="flex items-start gap-2 text-sm text-muted-foreground"
                                              >
                                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                {s}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {risks.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-1">
                                            Key Risks
                                          </h4>
                                          <ul className="space-y-1">
                                            {risks.map((r, i) => (
                                              <li
                                                key={i}
                                                className="flex items-start gap-2 text-sm text-muted-foreground"
                                              >
                                                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                                {r}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== QUESTIONNAIRE TAB ==================== */}
      {activeTab === "questionnaire" && (
        <div className="space-y-6">
          {/* Shortlisted contractors table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Shortlisted Contractors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {shortlistedApps.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No shortlisted contractors yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left font-medium p-4 text-muted-foreground">
                          Organization
                        </th>
                        <th className="text-left font-medium p-4 text-muted-foreground">
                          Questionnaire Status
                        </th>
                        <th className="text-left font-medium p-4 text-muted-foreground">
                          Submitted Date
                        </th>
                        <th className="text-center font-medium p-4 text-muted-foreground">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortlistedApps.map((app) => {
                        const isExpanded = expandedApp === `q-${app.id}`;
                        return (
                          <Fragment key={app.id}>
                            <tr
                              className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() =>
                                setExpandedApp(
                                  isExpanded ? null : `q-${app.id}`
                                )
                              }
                            >
                              <td className="p-4 font-medium">
                                {app.organization.name}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    app.questionnaireStatus === "SUBMITTED"
                                      ? "bg-green-100 text-green-700"
                                      : app.questionnaireStatus === "PENDING"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {app.questionnaireStatus}
                                </span>
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {app.questionnaireSubmittedAt
                                  ? new Date(
                                      app.questionnaireSubmittedAt
                                    ).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="p-4 text-center">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 inline text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 inline text-muted-foreground" />
                                )}
                              </td>
                            </tr>

                            {/* Expanded responses */}
                            {isExpanded && (
                              <tr className="border-b bg-muted/10">
                                <td colSpan={4} className="p-6">
                                  {app.questionnaireResponses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                      No responses submitted yet
                                    </p>
                                  ) : (
                                    <div className="space-y-4">
                                      {rfp.questionnaireQuestions
                                        .sort(
                                          (a, b) => a.sortOrder - b.sortOrder
                                        )
                                        .map((q) => {
                                          const resp =
                                            app.questionnaireResponses.find(
                                              (r) => r.questionId === q.id
                                            );
                                          const evalKey = `${app.id}:${q.id}`;
                                          const existingEval =
                                            app.questionnaireEvaluations.find(
                                              (e) => e.questionId === q.id
                                            );
                                          const localEval = evalNotes[evalKey];
                                          return (
                                            <div
                                              key={q.id}
                                              className="rounded-lg border p-4 space-y-2"
                                            >
                                              <p className="text-sm font-medium">
                                                {q.questionText}
                                              </p>
                                              <p className="text-sm text-muted-foreground bg-white rounded p-2">
                                                {resp?.responseText ||
                                                  resp?.filePath ||
                                                  "No response"}
                                              </p>
                                              <Separator />
                                              <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                  Internal Notes
                                                </Label>
                                                <textarea
                                                  className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                                                          prev[evalKey]
                                                            ?.score ??
                                                          String(
                                                            existingEval?.internalScore ??
                                                              ""
                                                          ),
                                                      },
                                                    }))
                                                  }
                                                />
                                                <div className="flex items-center gap-3">
                                                  <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground">
                                                      Score (0-10)
                                                    </Label>
                                                    <input
                                                      type="number"
                                                      min={0}
                                                      max={10}
                                                      className="flex h-8 w-20 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                      value={
                                                        localEval?.score ??
                                                        String(
                                                          existingEval?.internalScore ??
                                                            ""
                                                        )
                                                      }
                                                      onChange={(e) =>
                                                        setEvalNotes(
                                                          (prev) => ({
                                                            ...prev,
                                                            [evalKey]: {
                                                              notes:
                                                                prev[evalKey]
                                                                  ?.notes ??
                                                                existingEval?.internalNotes ??
                                                                "",
                                                              score:
                                                                e.target.value,
                                                            },
                                                          })
                                                        )
                                                      }
                                                    />
                                                  </div>
                                                  <button
                                                    disabled={
                                                      savingEval === evalKey
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 transition-colors disabled:opacity-50"
                                                    onClick={() =>
                                                      handleSaveEvaluation(
                                                        app.id,
                                                        q.id
                                                      )
                                                    }
                                                  >
                                                    {savingEval === evalKey && (
                                                      <Loader2 className="w-3 h-3 animate-spin" />
                                                    )}
                                                    Save
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side-by-side comparison */}
          {shortlistedApps.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Side-by-Side Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contractor selectors */}
                <div className="flex flex-wrap gap-3">
                  {[0, 1, 2].map((slot) => (
                    <div key={slot} className="flex-1 min-w-[200px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">
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
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left font-medium p-3 text-muted-foreground w-1/4">
                            Question
                          </th>
                          {compareApps.map((appId, slot) => {
                            const app = shortlistedApps.find(
                              (a) => a.id === appId
                            );
                            return (
                              <th
                                key={slot}
                                className="text-left font-medium p-3 text-muted-foreground"
                              >
                                {app ? app.organization.name : "—"}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {rfp.questionnaireQuestions
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((q) => (
                            <tr key={q.id} className="border-b last:border-0">
                              <td className="p-3 font-medium align-top">
                                {q.questionText}
                              </td>
                              {compareApps.map((appId, slot) => {
                                const app = shortlistedApps.find(
                                  (a) => a.id === appId
                                );
                                const resp = app?.questionnaireResponses.find(
                                  (r) => r.questionId === q.id
                                );
                                return (
                                  <td
                                    key={slot}
                                    className="p-3 text-muted-foreground align-top"
                                  >
                                    {resp?.responseText ||
                                      resp?.filePath ||
                                      "—"}
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
        <div className="space-y-6">
          {/* Comparison dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Contractor Comparison Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {shortlistedApps.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No shortlisted contractors to compare
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left font-medium p-4 text-muted-foreground min-w-[180px]">
                          Metric
                        </th>
                        {shortlistedApps.map((app) => (
                          <th
                            key={app.id}
                            className="text-left font-medium p-4 text-muted-foreground min-w-[200px]"
                          >
                            {app.organization.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* AI Composite Score */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">AI Composite Score</td>
                        {shortlistedApps.map((app) => (
                          <td key={app.id} className="p-4">
                            {app.compositeScore !== null ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden max-w-[120px]">
                                  <div
                                    className={`h-full rounded-full ${scoreColor(
                                      app.compositeScore
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        app.compositeScore
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-xs">
                                  {Math.round(app.compositeScore)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Dimension scores */}
                      {[
                        "procurement",
                        "vision",
                        "viability",
                        "impact",
                      ].map((dim) => (
                        <tr key={dim} className="border-b">
                          <td className="p-4 font-medium capitalize">
                            {dim === "procurement"
                              ? "Procurement Integrity"
                              : dim === "vision"
                              ? "Vision Alignment"
                              : dim === "viability"
                              ? "Scientific Viability"
                              : "Impact Potential"}
                          </td>
                          {shortlistedApps.map((app) => {
                            const dims = safeParse<Record<string, number>>(
                              app.dimensionScores,
                              {}
                            );
                            const val = dims[dim] ?? null;
                            return (
                              <td key={app.id} className="p-4">
                                {val !== null ? (
                                  <span className="font-mono text-xs">
                                    {Math.round(val)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Questionnaire status */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">
                          Questionnaire Status
                        </td>
                        {shortlistedApps.map((app) => (
                          <td key={app.id} className="p-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                app.questionnaireStatus === "SUBMITTED"
                                  ? "bg-green-100 text-green-700"
                                  : app.questionnaireStatus === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {app.questionnaireStatus}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Key Strengths */}
                      <tr className="border-b">
                        <td className="p-4 font-medium align-top">
                          Key Strengths
                        </td>
                        {shortlistedApps.map((app) => {
                          const strengths = safeParse<string[]>(
                            app.decisionPacket?.strengths ?? null,
                            []
                          );
                          return (
                            <td key={app.id} className="p-4 align-top">
                              {strengths.length > 0 ? (
                                <ul className="space-y-1">
                                  {strengths.slice(0, 3).map((s, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1 text-xs text-muted-foreground"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Key Risks */}
                      <tr className="border-b">
                        <td className="p-4 font-medium align-top">
                          Key Risks
                        </td>
                        {shortlistedApps.map((app) => {
                          const risks = safeParse<string[]>(
                            app.decisionPacket?.risks ?? null,
                            []
                          );
                          return (
                            <td key={app.id} className="p-4 align-top">
                              {risks.length > 0 ? (
                                <ul className="space-y-1">
                                  {risks.slice(0, 3).map((r, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1 text-xs text-muted-foreground"
                                    >
                                      <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Budget */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">Budget Requested</td>
                        {shortlistedApps.map((app) => (
                          <td key={app.id} className="p-4 font-mono text-xs">
                            {app.proposedBudget
                              ? `${app.proposedBudget.toLocaleString()} SAR`
                              : "—"}
                          </td>
                        ))}
                      </tr>

                      {/* Team size */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">Team Size</td>
                        {shortlistedApps.map((app) => {
                          const proposal = safeParse<Record<string, unknown>>(
                            app.proposalData,
                            {}
                          );
                          const teamSize =
                            (proposal.teamSize as number) ??
                            (proposal.team_size as number) ??
                            null;
                          return (
                            <td key={app.id} className="p-4 text-xs">
                              {teamSize ?? "—"}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Past projects */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">
                          Past Project Count
                        </td>
                        {shortlistedApps.map((app) => {
                          const proposal = safeParse<Record<string, unknown>>(
                            app.proposalData,
                            {}
                          );
                          const count =
                            (proposal.pastProjectCount as number) ??
                            (proposal.past_project_count as number) ??
                            null;
                          return (
                            <td key={app.id} className="p-4 text-xs">
                              {count ?? "—"}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Select Winner action row */}
                      <tr>
                        <td className="p-4 font-medium">Action</td>
                        {shortlistedApps.map((app) => (
                          <td key={app.id} className="p-4">
                            {app.status === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                                <Trophy className="w-4 h-4" />
                                Winner
                              </span>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 transition-colors"
                                onClick={() => {
                                  setAwardDialog({
                                    open: true,
                                    applicationId: app.id,
                                    orgName: app.organization.name,
                                  });
                                  setAwardAmount(
                                    app.proposedBudget
                                      ? String(app.proposedBudget)
                                      : ""
                                  );
                                }}
                              >
                                <Trophy className="w-3 h-3" />
                                Select Winner
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== AWARD DIALOG ==================== */}
      <Dialog
        open={awardDialog.open}
        onOpenChange={(open) =>
          setAwardDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-navy-800">
              Confirm Award
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Award the contract to{" "}
              <span className="font-semibold text-foreground">
                {awardDialog.orgName}
              </span>
              ?
            </p>
            <div className="space-y-2">
              <Label>Award Amount (SAR)</Label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={awardAmount}
                onChange={(e) => setAwardAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Justification <span className="text-red-500">*</span>
              </Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Provide justification for this award decision..."
                value={awardJustification}
                onChange={(e) => setAwardJustification(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                onClick={() =>
                  setAwardDialog({
                    open: false,
                    applicationId: "",
                    orgName: "",
                  })
                }
              >
                Cancel
              </button>
              <button
                disabled={awarding || !awardJustification.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors disabled:opacity-50"
                onClick={handleAward}
              >
                {awarding && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Confirm Award
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
