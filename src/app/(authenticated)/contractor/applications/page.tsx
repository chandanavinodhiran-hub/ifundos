"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Bell,
  ClipboardList,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

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
  questionnaireStatus: string;
  submittedAt: string | null;
  createdAt: string;
  proposalData: string | null;
  rfp: {
    title: string;
    deadline: string | null;
  };
  decisionPacket: {
    recommendation: string | null;
    executiveSummary: string | null;
  } | null;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
  SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
  SCORING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_REVIEW: "bg-orange-100 text-orange-800 border-orange-200",
  SHORTLISTED: "bg-leaf-100 text-leaf-800 border-leaf-200",
  QUESTIONNAIRE_PENDING: "bg-purple-100 text-purple-800 border-purple-200",
  QUESTIONNAIRE_SUBMITTED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  APPROVED: "bg-leaf-100 text-leaf-800 border-leaf-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const PIPELINE_STEPS = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "SCORING", label: "AI Scored" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "QUESTIONNAIRE", label: "Questionnaire" },
  { key: "DECISION", label: "Decision" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "DRAFT": return -1;
    case "SUBMITTED": return 0;
    case "SCORING": return 1;
    case "IN_REVIEW": return 2;
    case "SHORTLISTED": return 3;
    case "QUESTIONNAIRE_PENDING":
    case "QUESTIONNAIRE_SUBMITTED": return 4;
    case "APPROVED":
    case "REJECTED": return 5;
    default: return 0;
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B SAR`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-leaf-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch("/api/applications");
        if (!res.ok) throw new Error("Failed to fetch applications");
        const data = await res.json();
        setApplications(data.applications || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load applications"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const pendingQuestionnaires = applications.filter(
    (app) => app.questionnaireStatus === "PENDING"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track the status of your submitted proposals
        </p>
      </div>

      {/* Pending Questionnaire Alert */}
      {pendingQuestionnaires.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-purple-600 mt-0.5 animate-pulse shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-purple-800">
                Action Required: {pendingQuestionnaires.length} questionnaire
                {pendingQuestionnaires.length > 1 ? "s" : ""} pending
              </p>
              <div className="mt-2 space-y-1.5">
                {pendingQuestionnaires.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between"
                  >
                    <p className="text-sm text-purple-700">
                      {app.rfp.title}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-purple-700 border-purple-300 hover:bg-purple-100"
                      onClick={() =>
                        router.push(
                          `/contractor/applications/${app.id}/questionnaire`
                        )
                      }
                    >
                      <ClipboardList className="w-3.5 h-3.5 mr-1" />
                      Complete Questionnaire
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Table */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No applications yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Browse open RFPs to submit your first proposal
            </p>
            <Button
              className="mt-4 bg-leaf-600 hover:bg-leaf-700 text-white"
              onClick={() => router.push("/contractor/rfps")}
            >
              Browse RFPs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-leaf-600" />
              Applications ({applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFP Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">AI Score</TableHead>
                  <TableHead className="hidden sm:table-cell">Questionnaire</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const isExpanded = expandedId === app.id;
                  const rawDate = app.submittedAt || app.createdAt;
                  const submittedDate = rawDate
                    ? new Date(rawDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—";
                  const relativeTime = rawDate ? getRelativeTime(rawDate) : null;
                  const stepIndex = getStepIndex(app.status);

                  return (
                    <TableRow key={app.id} className="group">
                      <TableCell>
                        <button
                          className="text-left w-full"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : app.id)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {app.rfp.title}
                            </span>
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="mt-3 space-y-4 text-sm">
                              <Separator />

                              {/* Pipeline Status Stepper */}
                              <div className="py-2">
                                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Pipeline Status</p>
                                <div className="flex items-center gap-0">
                                  {PIPELINE_STEPS.map((step, idx) => {
                                    const isCompleted = idx < stepIndex;
                                    const isCurrent = idx === stepIndex;
                                    const isFuture = idx > stepIndex;
                                    return (
                                      <div key={step.key} className="flex items-center">
                                        <div className="flex flex-col items-center gap-1">
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                            isCompleted ? "bg-green-500 text-white" :
                                            isCurrent ? "bg-ocean-500 text-white ring-2 ring-ocean-200" :
                                            "bg-gray-200 text-gray-400"
                                          }`}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                          </div>
                                          <span className={`text-[10px] text-center leading-tight max-w-[60px] ${
                                            isCurrent ? "font-semibold text-ocean-700" :
                                            isCompleted ? "text-green-600" :
                                            "text-gray-400"
                                          }`}>
                                            {step.label}
                                          </span>
                                        </div>
                                        {idx < PIPELINE_STEPS.length - 1 && (
                                          <div className={`w-6 h-0.5 mx-0.5 mt-[-14px] ${
                                            idx < stepIndex ? "bg-green-400" :
                                            isFuture ? "bg-gray-200" : "bg-ocean-300"
                                          }`} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Questionnaire CTA */}
                              {app.questionnaireStatus === "PENDING" && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-3">
                                  <Bell className="w-4 h-4 text-purple-600 animate-pulse shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-medium text-purple-800">
                                      You&apos;ve been shortlisted! Complete the
                                      interview questionnaire.
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/contractor/applications/${app.id}/questionnaire`
                                      );
                                    }}
                                  >
                                    <ClipboardList className="w-3.5 h-3.5 mr-1" />
                                    Start Questionnaire
                                  </Button>
                                </div>
                              )}

                              {/* Application Details */}
                              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <p>
                                  <span className="text-muted-foreground">
                                    Proposed Budget:
                                  </span>{" "}
                                  <span className="font-mono">
                                    {formatSAR(app.proposedBudget)}
                                  </span>
                                </p>
                                {app.rfp.deadline && (
                                  <p>
                                    <span className="text-muted-foreground">
                                      RFP Deadline:
                                    </span>{" "}
                                    {new Date(
                                      app.rfp.deadline
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                )}
                                {app.compositeScore !== null && (
                                  <p>
                                    <span className="text-muted-foreground">
                                      AI Composite Score:
                                    </span>{" "}
                                    <span className="font-bold">
                                      {app.compositeScore.toFixed(1)}
                                    </span>
                                    /100
                                  </p>
                                )}
                              </div>

                              {/* Decision Packet */}
                              {app.decisionPacket && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                                  <p className="font-medium text-blue-800 text-xs uppercase tracking-wide">
                                    Committee Recommendation
                                  </p>
                                  {app.decisionPacket.recommendation && (
                                    <Badge
                                      variant="outline"
                                      className={
                                        app.decisionPacket.recommendation ===
                                        "RECOMMEND"
                                          ? "bg-leaf-100 text-leaf-800 border-leaf-200"
                                          : app.decisionPacket
                                              .recommendation ===
                                            "DO_NOT_RECOMMEND"
                                          ? "bg-red-100 text-red-800 border-red-200"
                                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      }
                                    >
                                      {app.decisionPacket.recommendation.replace(
                                        /_/g,
                                        " "
                                      )}
                                    </Badge>
                                  )}
                                  {app.decisionPacket.executiveSummary && (
                                    <p className="text-sm text-blue-700 mt-1">
                                      {app.decisionPacket.executiveSummary
                                        .length > 200
                                        ? app.decisionPacket.executiveSummary.slice(
                                            0,
                                            200
                                          ) + "..."
                                        : app.decisionPacket.executiveSummary}
                                    </p>
                                  )}
                                </div>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/contractor/rfps/${app.rfpId}`
                                  );
                                }}
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                View RFP
                              </Button>
                            </div>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                        <div>
                          <span>{submittedDate}</span>
                          {relativeTime && (
                            <span className="text-xs text-muted-foreground block">({relativeTime})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${
                            STATUS_COLORS[app.status] || ""
                          } ${
                            app.status === "SCORING" ? "animate-pulse" : ""
                          }`}
                        >
                          {app.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {app.compositeScore !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">
                              {app.compositeScore.toFixed(0)}
                            </span>
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getScoreColor(
                                  app.compositeScore
                                )}`}
                                style={{
                                  width: `${Math.min(
                                    app.compositeScore,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {app.questionnaireStatus === "NOT_SENT" ? (
                          <span className="text-xs text-gray-400">Not sent</span>
                        ) : app.questionnaireStatus === "PENDING" ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 border-amber-200"
                          >
                            PENDING
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-leaf-100 text-leaf-800 border-leaf-200"
                          >
                            {app.questionnaireStatus.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : app.id)
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
