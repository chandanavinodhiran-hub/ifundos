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
  FolderKanban,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  ChevronRight,
  XCircle,
  ArrowRight,
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
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
  SUSPENDED: "bg-amber-100 text-amber-700 border-amber-200",
  TERMINATED: "bg-red-100 text-red-700 border-red-200",
};

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  EVIDENCE_SUBMITTED: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-green-100 text-green-700",
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
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(
    null
  );

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
    return {
      active,
      completed,
      totalAwarded,
      totalDisbursed,
      total: contracts.length,
    };
  }, [contracts]);

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
        <h1 className="text-2xl font-bold text-navy-800">Active Grants</h1>
        <p className="text-muted-foreground mt-1">
          Awarded contracts and milestone progress
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Active Grants"
          value={String(summaryStats.active)}
          icon={FolderKanban}
          color="bg-green-50 text-green-600"
        />
        <SummaryCard
          label="Completed"
          value={String(summaryStats.completed)}
          icon={CheckCircle2}
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          label="Total Awarded"
          value={formatSAR(summaryStats.totalAwarded)}
          icon={DollarSign}
          color="bg-teal-50 text-teal-600"
        />
        <SummaryCard
          label="Total Disbursed"
          value={formatSAR(summaryStats.totalDisbursed)}
          icon={DollarSign}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Filter */}
      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-teal" />
            Contracts ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No contracts found. Awards will appear here once RFPs are awarded.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Header Row */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Contractor</div>
                <div className="col-span-3">RFP</div>
                <div className="col-span-1 text-right">Award</div>
                <div className="col-span-2 text-center">
                  Milestone Progress
                </div>
                <div className="col-span-1 text-center">Next Due</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1" />
              </div>

              {filtered.map((contract) => {
                const totalMs = contract.milestones.length;
                const verifiedMs = contract.milestones.filter(
                  (m) => m.status === "VERIFIED"
                ).length;
                const nextMilestone = contract.milestones.find(
                  (m) =>
                    m.status === "PENDING" ||
                    m.status === "EVIDENCE_SUBMITTED"
                );

                return (
                  <div
                    key={contract.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors items-center"
                    onClick={() => setSelectedContract(contract)}
                  >
                    {/* Contractor */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-sm">
                            {contract.organization.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contract.organization.trustTier}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RFP */}
                    <div className="col-span-3">
                      <p className="text-sm truncate">
                        {contract.application.rfp.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contract.program.name}
                      </p>
                    </div>

                    {/* Award Amount */}
                    <div className="col-span-1 text-right">
                      <p className="text-sm font-mono font-semibold">
                        {formatSAR(contract.awardAmount)}
                      </p>
                    </div>

                    {/* Milestone Progress */}
                    <div className="col-span-2 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-semibold">{verifiedMs}</span>
                        <span className="text-muted-foreground">of</span>
                        <span className="font-semibold">{totalMs}</span>
                        <span className="text-muted-foreground text-xs">
                          milestones
                        </span>
                      </div>
                      <div className="w-full max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal rounded-full transition-all"
                          style={{
                            width: `${totalMs > 0 ? (verifiedMs / totalMs) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Next Due */}
                    <div className="col-span-1 text-center">
                      {nextMilestone ? (
                        <div>
                          <p className="text-xs font-medium truncate">
                            {nextMilestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {nextMilestone.status === "EVIDENCE_SUBMITTED" ? (
                              <span className="text-amber-600">
                                Evidence Pending
                              </span>
                            ) : (
                              "Awaiting"
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-green-600">
                          All Complete
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-1 text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${CONTRACT_STATUS_COLORS[contract.status] || "bg-gray-100"}`}
                      >
                        {contract.status}
                      </Badge>
                    </div>

                    {/* Arrow */}
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
        <Dialog
          open={!!selectedContract}
          onOpenChange={() => setSelectedContract(null)}
        >
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-teal" />
                Contract Detail
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Contract Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Contractor</p>
                  <p className="font-medium">
                    {selectedContract.organization.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">RFP</p>
                  <p className="font-medium">
                    {selectedContract.application.rfp.title}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Award Amount</p>
                  <p className="font-semibold text-lg">
                    {formatSAR(selectedContract.awardAmount)} SAR
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={
                      CONTRACT_STATUS_COLORS[selectedContract.status]
                    }
                  >
                    {selectedContract.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AI Score</p>
                  <p className="font-medium">
                    {selectedContract.application.compositeScore ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Awarded</p>
                  <p className="font-medium">
                    {new Date(
                      selectedContract.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedContract.justification && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Award Justification
                  </p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">
                    {selectedContract.justification}
                  </p>
                </div>
              )}

              {/* Milestones Timeline */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal" />
                  Milestones
                </h3>
                <div className="space-y-3">
                  {selectedContract.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                    >
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {m.status === "VERIFIED" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : m.status === "EVIDENCE_SUBMITTED" ? (
                          <Clock className="w-6 h-6 text-amber-500" />
                        ) : m.status === "FAILED" ? (
                          <XCircle className="w-6 h-6 text-red-500" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {m.sequence}. {m.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${MILESTONE_STATUS_COLORS[m.status] || "bg-gray-100"}`}
                          >
                            {m.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {m.verifiedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Verified:{" "}
                            {new Date(m.verifiedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-semibold">
                          {formatSAR(m.disbursementAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(m.disbursementPct * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-teal border-teal hover:bg-teal/10"
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

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}
