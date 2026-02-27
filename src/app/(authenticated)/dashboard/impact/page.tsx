"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScoreRing } from "@/components/ui/score-ring";
import { Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ImpactData {
  summary: {
    totalContracts: number;
    activeContracts: number;
    completedContracts: number;
    totalAwardAmount: number;
    totalBudget: number;
    totalDisbursed: number;
    totalTreesTarget: number;
    totalTreesPlanted: number;
  };
  milestoneStats: {
    total: number;
    verified: number;
    pending: number;
    evidenceSubmitted: number;
    completionRate: number;
  };
  evidenceStats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    byType: Record<string, number>;
  };
  contractorPerformance: {
    contractorName: string;
    trustTier: string;
    rfpTitle: string;
    awardAmount: number;
    aiScore: number;
    milestonesTotal: number;
    milestonesCompleted: number;
    completionRate: number;
    contractStatus: string;
  }[];
  programBreakdown: {
    name: string;
    budgetTotal: number;
    budgetAllocated: number;
    budgetDisbursed: number;
    allocationPct: number;
    disbursedPct: number;
  }[];
  applicationStats: {
    total: number;
    approved: number;
    avgScore: number;
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ImpactDashboardPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/impact")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError("Failed to load impact data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-600">{error || "No data"}</p>
      </div>
    );
  }

  const {
    summary,
    milestoneStats,
    evidenceStats,
    contractorPerformance,
    programBreakdown,
    applicationStats,
  } = data;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Impact Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">Saudi Green Initiative</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">
                <AnimatedCounter end={summary.totalTreesPlanted} duration={2000} />
              </p>
              <p className="text-xs text-white/70">Trees Planted</p>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">
                {summary.totalTreesTarget > 0
                  ? <AnimatedCounter end={Math.round((summary.totalTreesPlanted / summary.totalTreesTarget) * 100)} suffix="%" duration={1800} />
                  : "0%"}
              </p>
              <p className="text-xs text-white/70">of SGI Target</p>
            </div>
          </div>
        </div>

        {/* Tree Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">Tree Planting Progress</span>
            <span className="text-white/60 font-mono text-xs sm:text-sm">{summary.totalTreesPlanted.toLocaleString()} / {summary.totalTreesTarget.toLocaleString()}</span>
          </div>
          <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-leaf-300 rounded-full transition-all duration-2000"
              style={{ width: `${Math.min(100, summary.totalTreesTarget > 0 ? (summary.totalTreesPlanted / summary.totalTreesTarget) * 100 : 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top-Level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Trees Target" value={summary.totalTreesTarget > 0 ? summary.totalTreesTarget.toLocaleString() : "Pending"} subtitle="SGI alignment" />
        <KPICard label="Total Spend" value={formatSAR(summary.totalDisbursed)} subtitle={`of ${formatSAR(summary.totalBudget)} budget`} />
        <KPICard label="Active Grants" value={String(summary.activeContracts)} subtitle={`${summary.completedContracts} completed`} />
        <KPICard label="Avg Score" value={String(applicationStats.avgScore)} subtitle={`${applicationStats.total} application${applicationStats.total !== 1 ? "s" : ""}`} />
      </div>

      {/* Budget vs Spend + Milestone Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget vs Spend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">
                  {formatSAR(summary.totalBudget)}
                </p>
                <p className="text-xs text-muted-foreground">Total Budget</p>
              </div>
              <div>
                <p className="text-xl font-bold text-cyan-600">
                  {formatSAR(summary.totalAwardAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Awarded</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">
                  {formatSAR(summary.totalDisbursed)}
                </p>
                <p className="text-xs text-muted-foreground">Disbursed</p>
              </div>
            </div>

            {/* Program Bars */}
            {programBreakdown.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground font-mono">
                    {formatSAR(p.budgetTotal)}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${p.disbursedPct}%` }}
                    />
                    <div
                      className="bg-cyan-400 h-full"
                      style={{
                        width: `${Math.max(0, p.allocationPct - p.disbursedPct)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Awarded: {p.allocationPct}%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Disbursed: {p.disbursedPct}%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200" /> Remaining</span>
                </div>
              </div>
            ))}

            {programBreakdown.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                No program data available yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Milestone Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Milestone Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Completion Rate Ring */}
            <div className="flex items-center justify-center">
              <ScoreRing score={milestoneStats.completionRate} size={140} strokeWidth={12} label="Milestone Completion" />
            </div>

            {/* Milestone Breakdown */}
            <div className="space-y-2">
              <StatRow label="Verified" value={milestoneStats.verified} total={milestoneStats.total} dotColor="bg-green-500" />
              <StatRow label="Evidence Submitted" value={milestoneStats.evidenceSubmitted} total={milestoneStats.total} dotColor="bg-amber-500" />
              <StatRow label="Pending" value={milestoneStats.pending} total={milestoneStats.total} dotColor="bg-gray-400" />
            </div>

            {/* Evidence Stats */}
            <div className="mt-4 pt-4 border-t">
              <p className="font-semibold text-sm mb-2">Evidence Review</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {evidenceStats.approved}
                  </p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <p className="text-lg font-bold text-amber-600">
                    {evidenceStats.pending}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <p className="text-lg font-bold text-red-600">
                    {evidenceStats.rejected}
                  </p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contractor Performance Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contractor Performance Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {contractorPerformance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No contractor data available yet. Rankings will appear once
              contracts are awarded.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Contractor</div>
                <div className="col-span-3">RFP</div>
                <div className="col-span-1 text-center">AI Score</div>
                <div className="col-span-2 text-center">Milestones</div>
                <div className="col-span-1 text-right">Award</div>
                <div className="col-span-1 text-center">Status</div>
              </div>

              {contractorPerformance.map((cp, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 rounded-lg border hover:bg-gray-50 items-center"
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                        idx === 0
                          ? "bg-amber-100 text-amber-700"
                          : idx === 1
                            ? "bg-gray-200 text-gray-700"
                            : idx === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {/* Contractor */}
                  <div className="col-span-3">
                    <p className="font-medium text-sm">
                      {cp.contractorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cp.trustTier}
                    </p>
                  </div>

                  {/* RFP */}
                  <div className="col-span-3">
                    <p className="text-sm truncate">{cp.rfpTitle}</p>
                  </div>

                  {/* AI Score */}
                  <div className="col-span-1 text-center">
                    <span
                      className={`font-bold text-sm ${
                        cp.aiScore >= 75
                          ? "text-green-600"
                          : cp.aiScore >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {cp.aiScore || "-"}
                    </span>
                  </div>

                  {/* Milestones */}
                  <div className="col-span-2 flex flex-col items-center gap-1">
                    <div className="text-sm">
                      <span className="font-semibold">
                        {cp.milestonesCompleted}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {cp.milestonesTotal}
                      </span>
                    </div>
                    <div className="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cp.completionRate >= 80
                            ? "bg-green-500"
                            : cp.completionRate >= 40
                              ? "bg-amber-500"
                              : "bg-gray-400"
                        }`}
                        style={{ width: `${cp.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Award */}
                  <div className="col-span-1 text-right">
                    <p className="text-sm font-mono">
                      {formatSAR(cp.awardAmount)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 text-center">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        cp.contractStatus === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : cp.contractStatus === "COMPLETED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {cp.contractStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2 py-4">
            <FunnelStep
              label="Received"
              value={applicationStats.total}
              color="bg-blue-500"
              pct={100}
            />
            <FunnelArrow pct={applicationStats.total > 0 ? 100 : 0} />
            <FunnelStep
              label="Scored"
              value={applicationStats.total > 0 ? applicationStats.total : 0}
              color="bg-yellow-500"
              pct={applicationStats.total > 0 ? 80 : 0}
            />
            <FunnelArrow pct={applicationStats.total > 0 ? Math.round((applicationStats.approved / applicationStats.total) * 100) : 0} />
            <FunnelStep
              label="Approved"
              value={applicationStats.approved}
              color="bg-green-500"
              pct={
                applicationStats.total > 0
                  ? Math.round(
                      (applicationStats.approved / applicationStats.total) *
                        100
                    )
                  : 0
              }
            />
            <FunnelArrow />
            <FunnelStep
              label="Avg Score"
              value={applicationStats.avgScore}
              color="bg-leaf-600"
              pct={applicationStats.avgScore}
              isScore
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function KPICard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatRow({
  label,
  value,
  total,
  dotColor,
}: {
  label: string;
  value: number;
  total: number;
  dotColor: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
      <span className="text-sm flex-1">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-leaf-600 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  color,
  pct,
  isScore,
}: {
  label: string;
  value: number;
  color: string;
  pct: number;
  isScore?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-[60px]">
      <div
        className={`w-full rounded-lg ${color} flex items-center justify-center transition-all`}
        style={{
          height: "60px",
          opacity: Math.max(0.4, pct / 100),
        }}
      >
        <span className="text-white font-bold text-lg">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground text-center">{label}</p>
      {!isScore && <p className="text-xs font-semibold">{pct}%</p>}
    </div>
  );
}

function FunnelArrow({ pct }: { pct?: number }) {
  return (
    <div className="flex flex-col items-center gap-1 hidden sm:flex">
      <span className="text-muted-foreground text-lg">&rarr;</span>
      {pct !== undefined && (
        <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
      )}
    </div>
  );
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toFixed(1)}B SAR`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}
