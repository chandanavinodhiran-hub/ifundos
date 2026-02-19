"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TreePine,
  DollarSign,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Leaf,
} from "lucide-react";

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
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Impact Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Portfolio analytics and environmental impact tracking
        </p>
      </div>

      {/* Top-Level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Trees Target"
          value={summary.totalTreesTarget.toLocaleString()}
          icon={TreePine}
          color="bg-green-50 text-green-600"
          subtitle="SGI alignment"
        />
        <KPICard
          label="Trees Planted (est.)"
          value={summary.totalTreesPlanted.toLocaleString()}
          icon={Leaf}
          color="bg-emerald-50 text-emerald-600"
          subtitle={`${summary.totalTreesTarget > 0 ? Math.round((summary.totalTreesPlanted / summary.totalTreesTarget) * 100) : 0}% of target`}
        />
        <KPICard
          label="Total Spend"
          value={formatSAR(summary.totalDisbursed)}
          icon={DollarSign}
          color="bg-teal-50 text-teal-600"
          subtitle={`of ${formatSAR(summary.totalBudget)} budget`}
        />
        <KPICard
          label="Active Grants"
          value={String(summary.activeContracts)}
          icon={Award}
          color="bg-blue-50 text-blue-600"
          subtitle={`${summary.completedContracts} completed`}
        />
      </div>

      {/* Trees Progress - Large Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TreePine className="w-5 h-5 text-green-600" />
            Tree Planting Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-green-600">
                  {summary.totalTreesPlanted.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  trees planted (estimated)
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-muted-foreground">
                  {summary.totalTreesTarget.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">target</p>
              </div>
            </div>
            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, summary.totalTreesTarget > 0 ? (summary.totalTreesPlanted / summary.totalTreesTarget) * 100 : 0)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Spend + Milestone Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal" />
              Budget vs Spend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">
                  {formatSAR(summary.totalBudget)}
                </p>
                <p className="text-xs text-muted-foreground">Total Budget</p>
              </div>
              <div>
                <p className="text-xl font-bold text-teal">
                  {formatSAR(summary.totalAwardAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Awarded</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600">
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
                      className="bg-teal h-full"
                      style={{ width: `${p.disbursedPct}%` }}
                    />
                    <div
                      className="bg-teal/30 h-full"
                      style={{
                        width: `${Math.max(0, p.allocationPct - p.disbursedPct)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Allocated: {p.allocationPct}%</span>
                  <span>Disbursed: {p.disbursedPct}%</span>
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
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-teal" />
              Milestone Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Completion Rate Ring */}
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="12"
                    strokeDasharray={`${milestoneStats.completionRate * 3.14} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">
                    {milestoneStats.completionRate}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Milestone Breakdown */}
            <div className="space-y-2">
              <StatRow
                icon={CheckCircle2}
                iconColor="text-green-500"
                label="Verified"
                value={milestoneStats.verified}
                total={milestoneStats.total}
              />
              <StatRow
                icon={Clock}
                iconColor="text-amber-500"
                label="Evidence Submitted"
                value={milestoneStats.evidenceSubmitted}
                total={milestoneStats.total}
              />
              <StatRow
                icon={AlertTriangle}
                iconColor="text-gray-400"
                label="Pending"
                value={milestoneStats.pending}
                total={milestoneStats.total}
              />
            </div>

            {/* Evidence Stats */}
            <div className="mt-4 pt-4 border-t">
              <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                <BarChart3 className="w-4 h-4 text-teal" />
                Evidence Review
              </p>
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-teal" />
            Contractor Performance Rankings
          </CardTitle>
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
                      {cp.aiScore || "\u2014"}
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
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal" />
            Application Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 py-4">
            <FunnelStep
              label="Received"
              value={applicationStats.total}
              color="bg-blue-500"
              pct={100}
            />
            <div className="text-muted-foreground">&rarr;</div>
            <FunnelStep
              label="Scored"
              value={applicationStats.total > 0 ? applicationStats.total : 0}
              color="bg-yellow-500"
              pct={applicationStats.total > 0 ? 80 : 0}
            />
            <div className="text-muted-foreground">&rarr;</div>
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
            <div className="text-muted-foreground">&rarr;</div>
            <FunnelStep
              label="Avg AI Score"
              value={applicationStats.avgScore}
              color="bg-teal"
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
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
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
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({
  icon: Icon,
  iconColor,
  label,
  value,
  total,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
      <span className="text-sm flex-1">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal rounded-full"
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
    <div className="flex flex-col items-center gap-2 flex-1">
      <div
        className={`w-full rounded-lg ${color} flex items-center justify-center transition-all`}
        style={{
          height: `${Math.max(30, pct * 0.8)}px`,
          opacity: Math.max(0.3, pct / 100),
        }}
      >
        <span className="text-white font-bold text-lg">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground text-center">{label}</p>
      {!isScore && <p className="text-xs font-semibold">{pct}%</p>}
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
