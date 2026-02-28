"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreWell } from "@/components/ui/score-well";
import { NeuProgress } from "@/components/ui/neu-progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Loader2, TreePine, Wallet, Target, CheckCircle2 } from "lucide-react";

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
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-critical">{error || "No data"}</p>
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

  const treePct = summary.totalTreesTarget > 0
    ? Math.round((summary.totalTreesPlanted / summary.totalTreesTarget) * 100)
    : 0;

  const disbursedPct = summary.totalBudget > 0
    ? Math.round((summary.totalDisbursed / summary.totalBudget) * 100)
    : 0;

  const awardedPct = summary.totalBudget > 0
    ? Math.round((summary.totalAwardAmount / summary.totalBudget) * 100)
    : 0;

  return (
    <div className="space-y-4 pb-safe">
      {/* Header */}
      <div>
        <p className="text-eyebrow">IMPACT</p>
        <h1 className="text-xl font-bold text-sovereign-charcoal font-display">Environmental Impact</h1>
      </div>

      {/* ============ Tree Counter Card — prominent inset well ============ */}
      <div
        className="rounded-[20px] p-5 space-y-4"
        style={{
          boxShadow: "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
        }}
      >
        <div className="flex items-center gap-2 text-sovereign-stone">
          <TreePine className="w-4 h-4" />
          <span className="text-eyebrow">TREES PLANTED</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="score-well score-well-lg">
            <span className="font-sans font-extrabold leading-none" style={{ fontSize: 40, color: "#4a7c59" }}>
              <AnimatedCounter end={summary.totalTreesPlanted} duration={1200} />
            </span>
          </div>
          <span className="font-mono text-[8px] font-semibold uppercase tracking-wider text-sovereign-gold">
            {summary.totalTreesPlanted.toLocaleString()} trees
          </span>
          <span className="text-[10px] text-sovereign-stone font-medium">
            of SGI Target
          </span>
        </div>

        <div className="space-y-1">
          <NeuProgress
            value={treePct}
            variant="green"
            label="Tree Planting Progress"
            showValue
          />
          <p className="text-[11px] font-mono text-sovereign-stone text-right">
            {summary.totalTreesPlanted.toLocaleString()} / {summary.totalTreesTarget.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ============ KPI Row ============ */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neu-base rounded-[18px] shadow-neu-inset px-4 py-3 text-center">
          <p className="text-eyebrow text-sovereign-stone">Active Grants</p>
          <p className="font-sans font-extrabold text-sovereign-charcoal mt-1" style={{ fontSize: "28px", lineHeight: 1 }}>
            <AnimatedCounter end={summary.activeContracts} duration={1200} />
          </p>
          <p className="text-[10px] text-sovereign-stone">{summary.completedContracts} completed</p>
        </div>
        <div className="bg-neu-base rounded-[18px] shadow-neu-inset px-4 py-3 text-center">
          <p className="text-eyebrow text-sovereign-stone">Avg AI Score</p>
          <p className="font-sans font-extrabold text-sovereign-gold mt-1" style={{ fontSize: "28px", lineHeight: 1 }}>
            <AnimatedCounter end={applicationStats.avgScore} duration={1200} />
          </p>
          <p className="text-[10px] text-sovereign-stone">{applicationStats.total} applications</p>
        </div>
      </div>

      {/* ============ SGI Target Card ============ */}
      <Card variant="neu-raised">
        <CardContent className="p-5 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-sovereign-stone">
            <Target className="w-4 h-4" />
            <span className="text-eyebrow">SGI TARGET ALIGNMENT</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3">
              <p className="font-sans font-extrabold text-sovereign-charcoal" style={{ fontSize: "24px", lineHeight: 1 }}>
                {summary.totalTreesTarget > 0 ? summary.totalTreesTarget.toLocaleString() : "---"}
              </p>
              <p className="text-[10px] text-sovereign-stone uppercase tracking-wide mt-1">Target</p>
            </div>
            <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3">
              <p className="font-sans font-extrabold text-sovereign-gold" style={{ fontSize: "24px", lineHeight: 1 }}>
                {treePct}%
              </p>
              <p className="text-[10px] text-sovereign-stone uppercase tracking-wide mt-1">Progress</p>
            </div>
            <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3">
              <p className="font-sans font-extrabold text-sovereign-charcoal" style={{ fontSize: "24px", lineHeight: 1 }}>
                {summary.totalContracts}
              </p>
              <p className="text-[10px] text-sovereign-stone uppercase tracking-wide mt-1">Contracts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ Budget Breakdown Card ============ */}
      <Card variant="neu-raised">
        <CardContent className="p-5 pt-5 space-y-4">
          <div className="flex items-center gap-2 text-sovereign-stone">
            <Wallet className="w-4 h-4" />
            <span className="text-eyebrow">BUDGET BREAKDOWN</span>
          </div>

          {/* Budget summary insets */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3">
              <p className="font-mono font-bold text-sovereign-charcoal" style={{ fontSize: "14px", lineHeight: 1.2 }}>{formatSAR(summary.totalBudget)}</p>
              <p className="text-[10px] text-sovereign-stone uppercase mt-1">Total</p>
            </div>
            <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3">
              <p className="font-mono font-bold text-sovereign-gold" style={{ fontSize: "14px", lineHeight: 1.2 }}>{formatSAR(summary.totalAwardAmount)}</p>
              <p className="text-[10px] text-sovereign-stone uppercase mt-1">Awarded</p>
            </div>
            <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3">
              <p className="font-mono font-bold text-verified" style={{ fontSize: "14px", lineHeight: 1.2 }}>{formatSAR(summary.totalDisbursed)}</p>
              <p className="text-[10px] text-sovereign-stone uppercase mt-1">Disbursed</p>
            </div>
          </div>

          {/* Budget progress bars */}
          <div className="space-y-3">
            <NeuProgress
              value={awardedPct}
              variant="gold"
              label="Awarded"
              showValue
              delay={200}
            />
            <NeuProgress
              value={disbursedPct}
              variant="green"
              label="Disbursed"
              showValue
              delay={400}
            />
          </div>

          {/* Per-program breakdown */}
          {programBreakdown.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sovereign-stone">By Program</p>
              {programBreakdown.map((p, i) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-sovereign-charcoal">{p.name}</span>
                    <span className="text-[10px] font-mono text-sovereign-stone">{formatSAR(p.budgetTotal)}</span>
                  </div>
                  <NeuProgress
                    value={p.disbursedPct}
                    variant="green"
                    size="sm"
                    delay={300 + i * 100}
                  />
                  <div className="flex gap-3 text-[10px] text-sovereign-stone">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sovereign-gold" />
                      Awarded: {p.allocationPct}%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-verified" />
                      Disbursed: {p.disbursedPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ Milestone Completion Card ============ */}
      <Card variant="neu-raised">
        <CardContent className="p-5 pt-5 space-y-4">
          <div className="flex items-center gap-2 text-sovereign-stone">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-eyebrow">MILESTONE COMPLETION</span>
          </div>

          <NeuProgress
            value={milestoneStats.completionRate}
            variant="gold"
            label="Overall Completion"
            showValue
          />

          <div className="space-y-2">
            <MilestoneRow
              label="Verified"
              value={milestoneStats.verified}
              total={milestoneStats.total}
              variant="green"
            />
            <MilestoneRow
              label="Evidence Submitted"
              value={milestoneStats.evidenceSubmitted}
              total={milestoneStats.total}
              variant="amber"
            />
            <MilestoneRow
              label="Pending"
              value={milestoneStats.pending}
              total={milestoneStats.total}
              variant="gold"
            />
          </div>

          {/* Evidence stats */}
          <div className="pt-3 border-t border-neu-dark/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sovereign-stone mb-2">Evidence Review</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3 text-center">
                <p className="font-sans font-extrabold text-verified" style={{ fontSize: "26px", lineHeight: 1 }}>{evidenceStats.approved}</p>
                <p className="text-[10px] text-sovereign-stone mt-1">Approved</p>
              </div>
              <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3 text-center">
                <p className="font-sans font-extrabold text-sovereign-gold" style={{ fontSize: "26px", lineHeight: 1 }}>{evidenceStats.pending}</p>
                <p className="text-[10px] text-sovereign-stone mt-1">Pending</p>
              </div>
              <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3 text-center">
                <p className="font-sans font-extrabold text-critical" style={{ fontSize: "26px", lineHeight: 1 }}>{evidenceStats.rejected}</p>
                <p className="text-[10px] text-sovereign-stone mt-1">Rejected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ Contractor Performance Card ============ */}
      <Card variant="neu-raised">
        <CardContent className="p-5 pt-5 space-y-3">
          <span className="text-eyebrow text-sovereign-stone">CONTRACTOR RANKINGS</span>

          {contractorPerformance.length === 0 ? (
            <p className="text-center text-sovereign-stone text-sm py-6">
              No contractor data available yet.
            </p>
          ) : (
            <div className="space-y-3">
              {contractorPerformance.map((cp, idx) => (
                <div
                  key={idx}
                  className="bg-neu-dark rounded-[14px] shadow-neu-inset p-4 space-y-2"
                >
                  {/* Name + Rank */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0
                            ? "bg-sovereign-gold/20 text-sovereign-gold"
                            : idx === 1
                            ? "bg-sovereign-stone/20 text-sovereign-stone"
                            : "bg-neu-base text-sovereign-stone"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-sovereign-charcoal">{cp.contractorName}</p>
                        <p className="text-[10px] text-sovereign-stone">{cp.rfpTitle}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        cp.contractStatus === "ACTIVE"
                          ? "neu-verified"
                          : cp.contractStatus === "COMPLETED"
                          ? "neu-gold"
                          : "neu"
                      }
                    >
                      {cp.contractStatus}
                    </Badge>
                  </div>

                  {/* Score + milestones */}
                  <div className="flex items-center gap-3">
                    <ScoreWell
                      score={cp.aiScore || 0}
                      size="sm"
                      animated={false}
                    />
                    <div className="flex-1 space-y-1">
                      <NeuProgress
                        value={cp.completionRate}
                        variant="gold"
                        label={`Milestones ${cp.milestonesCompleted}/${cp.milestonesTotal}`}
                        size="sm"
                      />
                      <p className="text-[10px] font-mono text-sovereign-stone text-right">
                        {formatSAR(cp.awardAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ Application Funnel Card ============ */}
      <Card variant="neu-raised">
        <CardContent className="p-5 pt-5 space-y-4">
          <span className="text-eyebrow text-sovereign-stone">APPLICATION FUNNEL</span>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3 text-center">
              <p className="font-sans font-extrabold text-sovereign-charcoal" style={{ fontSize: "26px", lineHeight: 1 }}>
                {applicationStats.total}
              </p>
              <p className="text-[10px] text-sovereign-stone uppercase mt-1">Received</p>
            </div>
            <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-3 text-center">
              <p className="font-sans font-extrabold text-verified" style={{ fontSize: "26px", lineHeight: 1 }}>
                {applicationStats.approved}
              </p>
              <p className="text-[10px] text-sovereign-stone uppercase mt-1">Approved</p>
            </div>
          </div>

          <NeuProgress
            value={
              applicationStats.total > 0
                ? Math.round((applicationStats.approved / applicationStats.total) * 100)
                : 0
            }
            variant="green"
            label="Approval Rate"
            showValue
            delay={200}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function MilestoneRow({
  label,
  value,
  total,
  variant,
}: {
  label: string;
  value: number;
  total: number;
  variant: "gold" | "green" | "amber" | "critical";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-sovereign-charcoal flex-1">{label}</span>
      <span className="text-xs font-semibold font-mono text-sovereign-charcoal w-8 text-right">{value}</span>
      <div className="w-20">
        <NeuProgress value={pct} variant={variant} size="sm" />
      </div>
      <span className="text-[10px] text-sovereign-stone w-8 text-right font-mono">{pct}%</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toFixed(1)}B SAR`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}
