"use client";

import { useState, useEffect } from "react";
import { Loader2, Wallet, Calendar } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { NeuProgress } from "@/components/ui/neu-progress";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface MilestoneData {
  id: string;
  title: string;
  status: string;
  disbursementAmount: number;
  sequence: number;
}

interface ContractData {
  id: string;
  status: string;
  awardAmount: number;
  createdAt: string;
  organization: { name: string };
  program: { name: string };
  milestones: MilestoneData[];
}

interface ProgramData {
  id: string;
  name: string;
  budgetTotal: number;
  budgetAllocated: number;
  budgetDisbursed: number;
}

interface Stats {
  programs: ProgramData[];
  contracts: ContractData[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function formatSAR(amount: number): string {
  if (amount >= 1e9) return `SAR ${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `SAR ${(amount / 1e6).toFixed(0)}M`;
  if (amount >= 1e3) return `SAR ${(amount / 1e3).toFixed(0)}K`;
  return `SAR ${amount.toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function AuditorDisbursements() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }
  if (!stats) return null;

  const totalAllocated = stats.programs.reduce((s, p) => s + p.budgetTotal, 0);
  const totalDisbursed = stats.programs.reduce((s, p) => s + p.budgetDisbursed, 0);
  const totalRemaining = totalAllocated - totalDisbursed;
  const totalCommitted = stats.programs.reduce((s, p) => s + p.budgetAllocated, 0);
  const disbursedPct = totalAllocated > 0 ? (totalDisbursed / totalAllocated) * 100 : 0;
  const committedPct = totalAllocated > 0 ? (totalCommitted / totalAllocated) * 100 : 0;

  // Get all milestones with completed/verified status for timeline
  const completedMilestones = stats.contracts.flatMap((c) =>
    c.milestones
      .filter((m) => m.status === "COMPLETED" || m.status === "VERIFIED")
      .map((m) => ({ ...m, contractor: c.organization.name, program: c.program.name }))
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8943f" }}>
          FINANCE
        </p>
        <h1 className="text-[22px] mt-0.5" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, color: "#1a1714" }}>
          Disbursements
        </h1>
        <p className="text-[13px]" style={{ color: "#7a7265" }}>
          Payment tracking and milestone verification
        </p>
      </div>

      {/* Budget Summary Card */}
      <div
        className="rounded-[18px] p-4"
        style={{
          background: "#e8e0d0",
          boxShadow: "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
        }}
      >
        {/* Three inset wells */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "ALLOCATED", value: formatSAR(totalAllocated) },
            { label: "DISBURSED", value: formatSAR(totalDisbursed) },
            { label: "REMAINING", value: formatSAR(totalRemaining) },
          ].map((well) => (
            <div
              key={well.label}
              className="p-3 text-center rounded-[14px]"
              style={{
                background: "#e8e0d0",
                boxShadow: "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
              }}
            >
              <p className="font-mono text-[14px] font-bold leading-tight" style={{ color: "#1a1714" }}>
                {well.value}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#7a7265" }}>
                {well.label}
              </p>
            </div>
          ))}
        </div>

        {/* Budget progress bar */}
        <div className="mt-4">
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{
              background: "#e8e0d0",
              boxShadow: "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
            }}
          >
            <div className="h-full flex">
              {disbursedPct > 0 && (
                <div
                  className="h-full rounded-l-full"
                  style={{ width: `${disbursedPct}%`, background: "linear-gradient(90deg, #4a7c59, #6a9c79)" }}
                />
              )}
              {committedPct > disbursedPct && (
                <div
                  className="h-full"
                  style={{
                    width: `${committedPct - disbursedPct}%`,
                    background: "linear-gradient(90deg, #b8943f, #d4b665)",
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex gap-4 mt-1.5 text-[10px] font-mono" style={{ color: "#9a9488" }}>
            <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#4a7c59" }} />Disbursed</span>
            <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#b8943f" }} />Committed</span>
            <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#d9d0be" }} />Remaining</span>
          </div>
        </div>
      </div>

      {/* Contracts with milestone progress */}
      {stats.contracts.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#7a7265" }}>
            ACTIVE CONTRACTS
          </h2>
          {stats.contracts.map((contract) => {
            const completedMs = contract.milestones.filter((m) => m.status === "COMPLETED").length;
            const totalMs = contract.milestones.length;
            const progressPct = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;
            const disbursed = contract.milestones
              .filter((m) => m.status === "COMPLETED" || m.status === "VERIFIED")
              .reduce((s, m) => s + m.disbursementAmount, 0);
            const nextMilestone = contract.milestones.find((m) => m.status === "PENDING" || m.status === "IN_PROGRESS");

            return (
              <div
                key={contract.id}
                className="rounded-[18px] p-4"
                style={{
                  background: "#e8e0d0",
                  boxShadow: "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold" style={{ color: "#1a1714" }}>
                      {contract.organization.name}
                    </h3>
                    <p className="text-[12px]" style={{ color: "#7a7265" }}>
                      {contract.program.name}
                    </p>
                  </div>
                  <span className="font-mono text-[14px] font-bold shrink-0" style={{ color: "#1a1714" }}>
                    {formatSAR(contract.awardAmount)}
                  </span>
                </div>

                {/* Milestone progress */}
                <div className="mt-3">
                  <NeuProgress
                    value={progressPct}
                    variant="green"
                    size="sm"
                    label={`Milestones ${completedMs}/${totalMs}`}
                    showValue
                    groove
                  />
                </div>

                {/* Next milestone */}
                {nextMilestone && (
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-3.5 h-3.5" style={{ color: "#7a7265" }} />
                    <span className="text-[11px]" style={{ color: "#7a7265" }}>
                      Next: {nextMilestone.title ?? "Milestone"}{" "}
                      <span className="font-mono">
                        · {formatSAR(nextMilestone.disbursementAmount)}
                      </span>
                    </span>
                  </div>
                )}

                {/* Disbursed vs total */}
                <div className="flex items-center gap-2 mt-2 text-[11px] font-mono" style={{ color: "#9a9488" }}>
                  <span>Disbursed: {formatSAR(disbursed)} / {formatSAR(contract.awardAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={Wallet}
          title="No disbursements yet"
          description="Payments will appear here as milestones are completed and approved."
        />
      )}

      {/* Disbursement Timeline (when payments exist) */}
      {completedMilestones.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#7a7265" }}>
            PAYMENT TIMELINE
          </h2>
          <div className="space-y-0">
            {completedMilestones.map((ms) => (
              <div
                key={ms.id}
                className="flex gap-3 py-3 border-b"
                style={{ borderColor: "rgba(156,148,130,0.15)" }}
              >
                <div className="flex flex-col items-center">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#4a7c59" }} />
                  <div className="w-px flex-1" style={{ background: "rgba(156,148,130,0.2)" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[14px] font-bold" style={{ color: "#1a1714" }}>
                      {formatSAR(ms.disbursementAmount)}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: "#9a9488" }}>
                      Milestone {ms.sequence}
                    </span>
                  </div>
                  <p className="text-[12px]" style={{ color: "#7a7265" }}>
                    {ms.contractor} · {ms.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: "#4a7c59" }}>
                    <span>AI Verified ✓</span>
                    <span>·</span>
                    <span>FM Approved ✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
