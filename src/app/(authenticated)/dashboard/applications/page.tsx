"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Application {
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
    createdByModel: string | null;
  } | null;
}

/* ------------------------------------------------------------------ */
/* Status styling                                                      */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  SCORING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  IN_REVIEW: "bg-orange-100 text-orange-700 border-orange-200",
  SHORTLISTED: "bg-teal-100 text-teal-700 border-teal-200",
  QUESTIONNAIRE_PENDING: "bg-purple-100 text-purple-700 border-purple-200",
  QUESTIONNAIRE_SUBMITTED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  SCORING: "AI Scoring",
  IN_REVIEW: "In Review",
  SHORTLISTED: "Shortlisted",
  QUESTIONNAIRE_PENDING: "Questionnaire Pending",
  QUESTIONNAIRE_SUBMITTED: "Questionnaire Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ApplicationPipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [rfpFilter, setRfpFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .catch(() => setError("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  /* Derived data */
  const rfpOptions = useMemo(() => {
    const rfpMap = new Map<string, string>();
    applications.forEach((a) => rfpMap.set(a.rfp.id, a.rfp.title));
    return Array.from(rfpMap.entries()).map(([id, title]) => ({ id, title }));
  }, [applications]);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        !searchTerm ||
        a.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.rfp.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
      const matchRfp = rfpFilter === "ALL" || a.rfp.id === rfpFilter;
      return matchSearch && matchStatus && matchRfp;
    });
  }, [applications, searchTerm, statusFilter, rfpFilter]);

  /* Summary counts */
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    applications.forEach((a) => {
      c[a.status] = (c[a.status] || 0) + 1;
    });
    return c;
  }, [applications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Application Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          All applications across all RFPs &mdash; {applications.length} total
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MiniCard label="Submitted" count={counts.SUBMITTED || 0} color="bg-blue-500" />
        <MiniCard label="AI Scoring" count={counts.SCORING || 0} color="bg-yellow-500" />
        <MiniCard
          label="In Review"
          count={(counts.IN_REVIEW || 0) + (counts.SHORTLISTED || 0)}
          color="bg-orange-500"
        />
        <MiniCard label="Approved" count={counts.APPROVED || 0} color="bg-green-500" />
        <MiniCard label="Rejected" count={counts.REJECTED || 0} color="bg-red-500" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by contractor or RFP..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rfpFilter} onValueChange={setRfpFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter by RFP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All RFPs</SelectItem>
                {rfpOptions.map((rfp) => (
                  <SelectItem key={rfp.id} value={rfp.id}>
                    {rfp.title.length > 35
                      ? rfp.title.slice(0, 35) + "..."
                      : rfp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal" />
            Applications ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No applications match your filters.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Contractor</div>
                <div className="col-span-3">RFP</div>
                <div className="col-span-1 text-right">Budget</div>
                <div className="col-span-1 text-center">AI Score</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-center">Submitted</div>
                <div className="col-span-1 text-center" />
              </div>

              {/* Table Rows */}
              {filtered.map((app) => (
                <div key={app.id}>
                  <div
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors items-center"
                    onClick={() =>
                      setExpandedId(expandedId === app.id ? null : app.id)
                    }
                  >
                    {/* Contractor */}
                    <div className="col-span-3">
                      <p className="font-medium text-sm">
                        {app.organization.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Trust: {app.organization.trustTier}
                      </p>
                    </div>

                    {/* RFP */}
                    <div className="col-span-3">
                      <p className="text-sm truncate">{app.rfp.title}</p>
                    </div>

                    {/* Budget */}
                    <div className="col-span-1 text-right">
                      <p className="text-sm font-mono">
                        {app.proposedBudget > 0
                          ? formatSAR(app.proposedBudget)
                          : "\u2014"}
                      </p>
                    </div>

                    {/* AI Score */}
                    <div className="col-span-1 text-center">
                      {app.compositeScore != null ? (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-sm font-bold ${
                              app.compositeScore >= 75
                                ? "text-green-600"
                                : app.compositeScore >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {app.compositeScore}
                          </span>
                          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                app.compositeScore >= 75
                                  ? "bg-green-500"
                                  : app.compositeScore >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${app.compositeScore}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          &mdash;
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex justify-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_COLORS[app.status] || "bg-gray-100"}`}
                      >
                        {app.status === "SCORING" && (
                          <Zap className="w-3 h-3 mr-1 animate-pulse" />
                        )}
                        {STATUS_LABELS[app.status] || app.status}
                      </Badge>
                    </div>

                    {/* Submitted */}
                    <div className="col-span-1 text-center">
                      <p className="text-xs text-muted-foreground">
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString()
                          : "\u2014"}
                      </p>
                    </div>

                    {/* Expand toggle */}
                    <div className="col-span-1 text-center">
                      {expandedId === app.id ? (
                        <ChevronUp className="w-4 h-4 mx-auto text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 mx-auto text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedId === app.id && (
                    <div className="mx-4 mt-1 mb-3 p-4 bg-gray-50 rounded-lg border border-dashed space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Dimension Scores */}
                        {app.dimensionScores && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                              <Zap className="w-4 h-4 text-teal" />
                              AI Dimension Scores
                            </h4>
                            {(() => {
                              try {
                                const scores = JSON.parse(app.dimensionScores);
                                const dimLabels: Record<string, string> = {
                                  procurement: "Procurement Integrity",
                                  vision: "Vision Alignment",
                                  viability: "Scientific Viability",
                                  impact: "Impact Potential",
                                };
                                return (
                                  <div className="space-y-2">
                                    {Object.entries(scores).map(
                                      ([dim, val]) => (
                                        <div
                                          key={dim}
                                          className="flex items-center gap-2"
                                        >
                                          <span className="text-xs text-muted-foreground w-28">
                                            {dimLabels[dim] || dim}
                                          </span>
                                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-teal rounded-full"
                                              style={{
                                                width: `${val}%`,
                                              }}
                                            />
                                          </div>
                                          <span className="text-xs font-mono w-8 text-right">
                                            {String(val)}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                );
                              } catch {
                                return null;
                              }
                            })()}
                          </div>
                        )}

                        {/* Decision Packet / AI Findings */}
                        <div>
                          {app.decisionPacket?.recommendation && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-sm mb-1">Recommendation</h4>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                app.decisionPacket.recommendation === "RECOMMEND"
                                  ? "bg-green-100 text-green-700"
                                  : app.decisionPacket.recommendation === "RECOMMEND_WITH_CONDITIONS"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {app.decisionPacket.recommendation.replace(/_/g, " ")}
                              </span>
                            </div>
                          )}
                          {app.decisionPacket?.executiveSummary && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-sm mb-1">Executive Summary</h4>
                              <p className="text-xs text-muted-foreground">{app.decisionPacket.executiveSummary}</p>
                            </div>
                          )}
                          {app.aiFindings && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                AI Findings
                              </h4>
                              {(() => {
                                try {
                                  const findings = JSON.parse(app.aiFindings);
                                  return (
                                    <ul className="space-y-1">
                                      {(Array.isArray(findings) ? findings : [])
                                        .slice(0, 5)
                                        .map((f: string, i: number) => (
                                          <li key={i} className="text-xs text-muted-foreground flex gap-1">
                                            <span className="text-amber-500">•</span>
                                            {f}
                                          </li>
                                        ))}
                                    </ul>
                                  );
                                } catch {
                                  return null;
                                }
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Quick Info */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Created:
                            </span>
                            <span>
                              {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {app.shortlistedAt && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3 text-teal" />
                              <span className="text-muted-foreground">
                                Shortlisted:
                              </span>
                              <span>
                                {new Date(
                                  app.shortlistedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Questionnaire:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {(app.questionnaireStatus || "NOT_SENT").replace(/_/g, " ")}
                            </Badge>
                          </div>
                          {(() => {
                            try {
                              const strengths = app.decisionPacket?.strengths ? JSON.parse(app.decisionPacket.strengths) : [];
                              const risks = app.decisionPacket?.risks ? JSON.parse(app.decisionPacket.risks) : [];
                              return (
                                <>
                                  {Array.isArray(strengths) && strengths.length > 0 && (
                                    <div className="mt-2">
                                      <p className="font-medium text-foreground mb-1">Strengths</p>
                                      {strengths.slice(0, 2).map((s: string, i: number) => (
                                        <p key={i} className="text-muted-foreground flex gap-1">
                                          <span className="text-green-500">✓</span> {s}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {Array.isArray(risks) && risks.length > 0 && (
                                    <div className="mt-2">
                                      <p className="font-medium text-foreground mb-1">Risks</p>
                                      {risks.slice(0, 2).map((r: string, i: number) => (
                                        <p key={i} className="text-muted-foreground flex gap-1">
                                          <span className="text-orange-500">!</span> {r}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            } catch {
                              return null;
                            }
                          })()}
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-teal border-teal hover:bg-teal/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/dashboard/rfps/${app.rfp.id}`;
                            }}
                          >
                            View in RFP{" "}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function MiniCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
      <div className={`w-2 h-8 rounded-full ${color}`} />
      <div>
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}
