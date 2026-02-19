"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Camera,
  FileText,
  Plane,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface EvidenceRecord {
  id: string;
  type: string;
  filePath: string | null;
  metadata: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewStatus: string;
  slideSolveCheck: string;
  milestone: {
    id: string;
    sequence: number;
    title: string;
    status: string;
    disbursementAmount: number;
    contract: {
      id: string;
      awardAmount: number;
      status: string;
      organization: { id: string; name: string };
      application: {
        rfp: { id: string; title: string };
      };
    };
  };
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const REVIEW_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const SLIDESOLVE_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PASS: "bg-green-100 text-green-700",
  FAIL: "bg-red-100 text-red-700",
};

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  PHOTO: Camera,
  DRONE: Plane,
  SENSOR: BarChart3,
  REPORT: FileText,
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function EvidenceReviewPage() {
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedEvidence, setSelectedEvidence] =
    useState<EvidenceRecord | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const fetchEvidence = () => {
    setLoading(true);
    fetch("/api/evidence")
      .then((r) => r.json())
      .then((data) => setEvidence(data.evidenceRecords || []))
      .catch(() => setError("Failed to load evidence"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const filtered = useMemo(() => {
    return evidence.filter((e) => {
      const matchStatus =
        statusFilter === "ALL" || e.reviewStatus === statusFilter;
      const matchType = typeFilter === "ALL" || e.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [evidence, statusFilter, typeFilter]);

  const counts = useMemo(() => {
    return {
      total: evidence.length,
      pending: evidence.filter((e) => e.reviewStatus === "PENDING").length,
      approved: evidence.filter((e) => e.reviewStatus === "APPROVED").length,
      rejected: evidence.filter((e) => e.reviewStatus === "REJECTED").length,
    };
  }, [evidence]);

  async function handleReview(id: string, decision: "APPROVED" | "REJECTED") {
    setReviewing(true);
    try {
      const res = await fetch(`/api/evidence/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          slideSolveCheck: decision === "APPROVED" ? "PASS" : "FAIL",
        }),
      });
      if (res.ok) {
        setSelectedEvidence(null);
        fetchEvidence();
      }
    } catch {
      // handled
    } finally {
      setReviewing(false);
    }
  }

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
        <h1 className="text-2xl font-bold text-navy-800">Evidence Review</h1>
        <p className="text-muted-foreground mt-1">
          Review submitted evidence for milestone verification
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat
          label="Total Evidence"
          value={counts.total}
          color="bg-blue-500"
        />
        <MiniStat
          label="Pending Review"
          value={counts.pending}
          color="bg-amber-500"
        />
        <MiniStat
          label="Approved"
          value={counts.approved}
          color="bg-green-500"
        />
        <MiniStat
          label="Rejected"
          value={counts.rejected}
          color="bg-red-500"
        />
      </div>

      {/* Pending Alert */}
      {counts.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>
              {counts.pending} evidence submission
              {counts.pending !== 1 ? "s" : ""}
            </strong>{" "}
            awaiting your review. Evidence must be reviewed to unlock milestone
            disbursements.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Review Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Evidence Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PHOTO">Photo</SelectItem>
            <SelectItem value="DRONE">Drone</SelectItem>
            <SelectItem value="SENSOR">Sensor</SelectItem>
            <SelectItem value="REPORT">Report</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Evidence Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal" />
            Evidence Queue ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {counts.total === 0
                ? "No evidence has been submitted yet. Evidence will appear here once contractors submit milestone deliverables."
                : "No evidence matches your filters."}
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header Row */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-2">Contractor</div>
                <div className="col-span-3">Milestone</div>
                <div className="col-span-1 text-center">Type</div>
                <div className="col-span-2 text-center">Submitted</div>
                <div className="col-span-2 text-center">SlideSolve</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1" />
              </div>

              {filtered.map((ev) => {
                const TypeIcon = TYPE_ICONS[ev.type] || FileText;
                return (
                  <div
                    key={ev.id}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 rounded-lg border items-center transition-colors ${
                      ev.reviewStatus === "PENDING"
                        ? "border-amber-200 bg-amber-50/30 hover:bg-amber-50"
                        : "hover:bg-gray-50"
                    } cursor-pointer`}
                    onClick={() => setSelectedEvidence(ev)}
                  >
                    {/* Contractor */}
                    <div className="col-span-2">
                      <p className="font-medium text-sm">
                        {ev.milestone.contract.organization.name}
                      </p>
                    </div>

                    {/* Milestone */}
                    <div className="col-span-3">
                      <p className="text-sm">
                        <span className="font-medium">
                          M{ev.milestone.sequence}:
                        </span>{" "}
                        {ev.milestone.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ev.milestone.contract.application.rfp.title}
                      </p>
                    </div>

                    {/* Type */}
                    <div className="col-span-1 flex justify-center">
                      <div className="flex items-center gap-1">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs">{ev.type}</span>
                      </div>
                    </div>

                    {/* Submitted */}
                    <div className="col-span-2 text-center">
                      <p className="text-xs">
                        {new Date(ev.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ev.submittedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* SlideSolve */}
                    <div className="col-span-2 flex justify-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${SLIDESOLVE_COLORS[ev.slideSolveCheck] || "bg-gray-100"}`}
                      >
                        {ev.slideSolveCheck === "PENDING" && (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {ev.slideSolveCheck === "PASS" && (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        {ev.slideSolveCheck === "FAIL" && (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {ev.slideSolveCheck}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex justify-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${REVIEW_STATUS_COLORS[ev.reviewStatus] || "bg-gray-100"}`}
                      >
                        {ev.reviewStatus}
                      </Badge>
                    </div>

                    {/* Action */}
                    <div className="col-span-1 text-center">
                      <Eye className="w-4 h-4 text-muted-foreground mx-auto" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evidence Detail Dialog */}
      {selectedEvidence && (
        <Dialog
          open={!!selectedEvidence}
          onOpenChange={() => setSelectedEvidence(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-teal" />
                Evidence Detail
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Contractor</p>
                  <p className="font-medium">
                    {selectedEvidence.milestone.contract.organization.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">RFP</p>
                  <p className="font-medium">
                    {
                      selectedEvidence.milestone.contract.application.rfp
                        .title
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Milestone</p>
                  <p className="font-medium">
                    {selectedEvidence.milestone.sequence}.{" "}
                    {selectedEvidence.milestone.title}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Disbursement
                  </p>
                  <p className="font-medium">
                    {formatSAR(
                      selectedEvidence.milestone.disbursementAmount
                    )}{" "}
                    SAR
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Evidence Type
                  </p>
                  <p className="font-medium">{selectedEvidence.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {new Date(
                      selectedEvidence.submittedAt
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* SlideSolve Status */}
              <div className="p-3 rounded-lg bg-gray-50 border">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-teal" />
                  <p className="font-semibold text-sm">
                    SlideSolve AI Check
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    SLIDESOLVE_COLORS[selectedEvidence.slideSolveCheck]
                  }
                >
                  {selectedEvidence.slideSolveCheck}
                </Badge>
                {selectedEvidence.slideSolveCheck === "PENDING" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    AI verification is still processing this evidence.
                  </p>
                )}
              </div>

              {/* Metadata */}
              {selectedEvidence.metadata && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Metadata
                  </p>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto border">
                    {(() => {
                      try {
                        return JSON.stringify(
                          JSON.parse(selectedEvidence.metadata!),
                          null,
                          2
                        );
                      } catch {
                        return selectedEvidence.metadata;
                      }
                    })()}
                  </pre>
                </div>
              )}

              {/* File Path */}
              {selectedEvidence.filePath && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">File</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded border">
                    {selectedEvidence.filePath}
                  </p>
                </div>
              )}

              {/* Review Actions */}
              {selectedEvidence.reviewStatus === "PENDING" ? (
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={reviewing}
                    onClick={() =>
                      handleReview(selectedEvidence.id, "APPROVED")
                    }
                  >
                    {reviewing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Approve Evidence
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={reviewing}
                    onClick={() =>
                      handleReview(selectedEvidence.id, "REJECTED")
                    }
                  >
                    {reviewing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject Evidence
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-lg border flex items-center gap-2">
                  {selectedEvidence.reviewStatus === "APPROVED" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {selectedEvidence.reviewStatus === "APPROVED"
                        ? "Evidence Approved"
                        : "Evidence Rejected"}
                    </p>
                    {selectedEvidence.reviewedAt && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed:{" "}
                        {new Date(
                          selectedEvidence.reviewedAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
      <div className={`w-2 h-10 rounded-full ${color}`} />
      <div>
        <p className="text-2xl font-bold">{value}</p>
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
