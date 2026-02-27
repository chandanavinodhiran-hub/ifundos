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
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
  XCircle,
  ArrowRight,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MilestoneItem {
  id: string;
  sequence: number;
  title: string;
  status: string;
  disbursementAmount: number;
  disbursementPct: number;
  verifiedAt: string | null;
}

interface DisbursementItem {
  id: string;
  amount: number;
  status: string;
  releasedAt: string | null;
}

interface ContractItem {
  id: string;
  awardAmount: number;
  justification: string | null;
  status: string;
  createdAt: string;
  organization: { id: string; name: string; trustTier: string };
  application: {
    id: string;
    compositeScore: number | null;
    rfp: { id: string; title: string };
  };
  program: { id: string; name: string };
  milestones: MilestoneItem[];
  disbursements: DisbursementItem[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-leaf-100 text-leaf-700 border-leaf-200",
  COMPLETED: "bg-ocean-100 text-ocean-700 border-ocean-200",
  SUSPENDED: "bg-sand-100 text-sand-700 border-sand-200",
  TERMINATED: "bg-red-100 text-red-700 border-red-200",
};

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  EVIDENCE_SUBMITTED: "bg-sand-100 text-sand-700",
  VERIFIED: "bg-leaf-100 text-leaf-700",
  FAILED: "bg-red-100 text-red-700",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ActiveGrantsPage() {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);

  useEffect(() => {
    fetch("/api/contracts")
      .then((r) => r.json())
      .then((data) => setContracts(data.contracts || []))
      .catch(() => setError("Failed to load grants"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return contracts;
    return contracts.filter((c) => c.status === statusFilter);
  }, [contracts, statusFilter]);

  const summaryStats = useMemo(() => {
    const active = contracts.filter((c) => c.status === "ACTIVE").length;
    const completed = contracts.filter((c) => c.status === "COMPLETED").length;
    const totalAwarded = contracts.reduce((s, c) => s + c.awardAmount, 0);
    const totalDisbursed = contracts.reduce(
      (s, c) =>
        s +
        c.disbursements
          .filter((d) => d.status === "RELEASED" || d.status === "APPROVED")
          .reduce((ds, d) => ds + d.amount, 0),
      0
    );
    const pendingEvidence = contracts.reduce(
      (s, c) => s + c.milestones.filter((m) => m.status === "EVIDENCE_SUBMITTED").length,
      0
    );
    return { active, completed, totalAwarded, totalDisbursed, total: contracts.length, pendingEvidence };
  }, [contracts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Active Grants</h1>
        <p className="text-muted-foreground mt-1">
          Awarded contracts, milestone tracking, and AI-verified payments
        </p>
      </div>

      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Grants & Contracts</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Milestone tracking and payment verification
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold"><AnimatedCounter end={summaryStats.pendingEvidence} duration={1000} /></p>
              <p className="text-xs text-white/70">Pending Review</p>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold">
                {summaryStats.totalAwarded > 0
                  ? <AnimatedCounter end={Math.round((summaryStats.totalDisbursed / summaryStats.totalAwarded) * 100)} suffix="%" duration={1500} />
                  : "0%"}
              </p>
              <p className="text-xs text-white/70">Disbursed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Active Grants" value={summaryStats.active} />
        <SummaryCard label="Completed" value={summaryStats.completed} />
        <SummaryCard label="Total Award Value (SAR)" value={summaryStats.totalAwarded} isCurrency />
        <SummaryCard label="Total Disbursed" value={summaryStats.totalDisbursed} isCurrency />
      </div>

      {/* Filter */}
      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contracts ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap justify-center">
                <span className="w-8 h-8 rounded-full bg-leaf-100 flex items-center justify-center text-leaf-600 font-bold text-xs shrink-0">1</span>
                <span>Publish RFP</span>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="w-8 h-8 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-600 font-bold text-xs shrink-0">2</span>
                <span>AI Scores Apps</span>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">3</span>
                <span>Award Contract</span>
              </div>
              <p className="text-muted-foreground text-sm">Grants appear here after contracts are awarded from the RFP pipeline.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header Row */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Contractor</div>
                <div className="col-span-3">RFP</div>
                <div className="col-span-1 text-right">Award</div>
                <div className="col-span-2 text-center">Milestone Progress</div>
                <div className="col-span-1 text-center">Next Due</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1" />
              </div>

              {filtered.map((contract) => {
                const totalMs = contract.milestones.length;
                const verifiedMs = contract.milestones.filter((m) => m.status === "VERIFIED").length;
                const nextMilestone = contract.milestones.find(
                  (m) => m.status === "PENDING" || m.status === "EVIDENCE_SUBMITTED"
                );
                const progressPct = totalMs > 0 ? (verifiedMs / totalMs) * 100 : 0;

                return (
                  <div
                    key={contract.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors items-center"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{contract.organization.name}</p>
                          <p className="text-xs text-muted-foreground">{contract.organization.trustTier}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <p className="text-sm truncate">{contract.application.rfp.title}</p>
                      <p className="text-xs text-muted-foreground">{contract.program.name}</p>
                    </div>

                    <div className="col-span-1 text-right">
                      <p className="text-sm font-mono font-semibold">{formatSAR(contract.awardAmount)}</p>
                    </div>

                    {/* Milestone visual progress */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        {contract.milestones.map((m) => (
                          <div
                            key={m.id}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                              m.status === "VERIFIED"
                                ? "bg-leaf-500 border-leaf-500 text-white"
                                : m.status === "EVIDENCE_SUBMITTED"
                                  ? "bg-sand-100 border-sand-400 text-sand-700 animate-pulse"
                                  : m.status === "FAILED"
                                    ? "bg-red-100 border-red-400 text-red-700"
                                    : "bg-gray-100 border-gray-300 text-gray-400"
                            }`}
                          >
                            {m.status === "VERIFIED" ? "✓" : m.sequence}
                          </div>
                        ))}
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-leaf-500 rounded-full transition-all duration-1000"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="col-span-1 text-center">
                      {nextMilestone ? (
                        <div>
                          <p className="text-xs font-medium truncate">{nextMilestone.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {nextMilestone.status === "EVIDENCE_SUBMITTED" ? (
                              <span className="text-sand-600 flex items-center gap-1 justify-center">
                                <Eye className="w-3 h-3" /> Review
                              </span>
                            ) : (
                              "Awaiting"
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-leaf-600 font-medium">All Complete</span>
                      )}
                    </div>

                    <div className="col-span-1 text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${CONTRACT_STATUS_COLORS[contract.status] || "bg-gray-100"}`}
                      >
                        {contract.status}
                      </Badge>
                    </div>

                    <div className="col-span-1 text-center">
                      <ChevronRight className="w-4 h-4 text-muted-foreground mx-auto" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Detail Dialog */}
      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Contract Detail: {selectedContract.organization.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Contract Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoTile label="Contractor" value={selectedContract.organization.name} />
                <InfoTile label="RFP" value={selectedContract.application.rfp.title} />
                <InfoTile label="Program" value={selectedContract.program.name} />
                <InfoTile label="Award Amount" value={`${formatSAR(selectedContract.awardAmount)} SAR`} highlight />
                <InfoTile label="AI Score" value={selectedContract.application.compositeScore ? `${selectedContract.application.compositeScore}/100` : "N/A"} />
                <InfoTile label="Awarded" value={new Date(selectedContract.createdAt).toLocaleDateString()} />
              </div>

              {selectedContract.justification && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Award Justification</p>
                  <p className="text-sm bg-leaf-50 p-3 rounded-xl border border-leaf-100">{selectedContract.justification}</p>
                </div>
              )}

              {/* Visual Milestone Journey */}
              <div>
                <h3 className="font-semibold text-sm mb-4">Milestone Journey</h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-gray-200" />

                  <div className="space-y-4">
                    {selectedContract.milestones.map((m, idx) => {
                      const isLast = idx === selectedContract.milestones.length - 1;
                      return (
                        <div key={m.id} className="relative flex items-start gap-4">
                          {/* Node */}
                          <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            m.status === "VERIFIED"
                              ? "bg-leaf-500 border-leaf-500 text-white"
                              : m.status === "EVIDENCE_SUBMITTED"
                                ? "bg-white border-sand-400 text-sand-600"
                                : m.status === "FAILED"
                                  ? "bg-white border-red-400 text-red-500"
                                  : "bg-white border-gray-300 text-gray-400"
                          }`}>
                            {m.status === "VERIFIED" ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : m.status === "EVIDENCE_SUBMITTED" ? (
                              <Eye className="w-4 h-4 animate-pulse" />
                            ) : m.status === "FAILED" ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              <span className="text-xs font-bold">{m.sequence}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className={`flex-1 pb-4 ${!isLast ? "" : ""}`}>
                            <div className={`p-3 rounded-xl border transition-all ${
                              m.status === "VERIFIED"
                                ? "bg-leaf-50 border-leaf-200"
                                : m.status === "EVIDENCE_SUBMITTED"
                                  ? "bg-sand-50 border-sand-200 shadow-sm"
                                  : "bg-white border-gray-200"
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{m.title}</p>
                                  <Badge variant="outline" className={`text-[10px] ${MILESTONE_STATUS_COLORS[m.status] || "bg-gray-100"}`}>
                                    {m.status.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                                <p className="text-sm font-mono font-semibold text-leaf-700">{formatSAR(m.disbursementAmount)} SAR</p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{(m.disbursementPct * 100).toFixed(0)}% of contract</span>
                                {m.verifiedAt && (
                                  <span className="flex items-center gap-1 text-leaf-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verified {new Date(m.verifiedAt).toLocaleDateString()}
                                  </span>
                                )}
                                {m.status === "EVIDENCE_SUBMITTED" && (
                                  <span className="text-sand-600">Verification in progress</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Disbursement Summary */}
              {selectedContract.disbursements.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3">Payment History</h3>
                  <div className="space-y-2">
                    {selectedContract.disbursements.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border">
                        <div className="flex items-center gap-2">
                          {d.status === "RELEASED" ? (
                            <CheckCircle2 className="w-4 h-4 text-leaf-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-sand-500" />
                          )}
                          <span className="text-sm">{formatSAR(d.amount)} SAR</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${d.status === "RELEASED" ? "bg-leaf-100 text-leaf-700" : "bg-sand-100 text-sand-700"}`}>
                            {d.status}
                          </Badge>
                          {d.releasedAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(d.releasedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-leaf-600 border-leaf-500 hover:bg-leaf-600/10"
                  onClick={() => {
                    window.location.href = `/dashboard/rfps/${selectedContract.application.rfp.id}`;
                  }}
                >
                  View RFP <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
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

function SummaryCard({ label, value, isCurrency }: {
  label: string; value: number; isCurrency?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1 text-slate-900">
          {isCurrency ? formatSAR(value) : <AnimatedCounter end={value} duration={1200} />}
        </p>
      </CardContent>
    </Card>
  );
}

function InfoTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium text-sm mt-0.5 ${highlight ? "text-leaf-700 text-lg font-semibold" : ""}`}>{value}</p>
    </div>
  );
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}
