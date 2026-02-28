"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { NeuProgress } from "@/components/ui/neu-progress";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface AppData {
  id: string;
  status: string;
  compositeScore: number | null;
  organization: { name: string };
  rfp: { title: string };
  decisionPacket: { recommendation: string | null } | null;
}

interface RfpData {
  id: string;
  title: string;
  status: string;
  applications: AppData[];
}

interface ContractData {
  id: string;
  status: string;
  awardAmount: number;
  organization: { name: string };
  milestones: { id: string; status: string; amount: number }[];
}

interface ProgramData {
  id: string;
  name: string;
  budgetTotal: number;
  budgetAllocated: number;
  budgetDisbursed: number;
  status: string;
  rfps: RfpData[];
  contracts: ContractData[];
}

interface Stats {
  programs: ProgramData[];
  fmName: string;
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

function programHealth(program: ProgramData): { color: string; label: string } {
  const allApps = program.rfps.flatMap((r) => r.applications);
  const hasDivergent = allApps.some((a) => {
    const rec = a.decisionPacket?.recommendation;
    if (!rec) return false;
    const aiRec = rec === "RECOMMEND";
    return (aiRec && a.status === "REJECTED") || (!aiRec && ["SHORTLISTED", "APPROVED"].includes(a.status));
  });
  if (hasDivergent) return { color: "#b87a3f", label: "Review recommended" };
  return { color: "#4a7c59", label: "On track" };
}

function concordanceRate(apps: AppData[]): number {
  let aligned = 0;
  let total = 0;
  for (const a of apps) {
    const rec = a.decisionPacket?.recommendation;
    if (!rec || a.status === "SUBMITTED" || a.status === "SCORING" || a.status === "IN_REVIEW") continue;
    total++;
    const aiRec = rec === "RECOMMEND";
    const aiNotRec = rec === "DO_NOT_RECOMMEND";
    const fmRejected = a.status === "REJECTED";
    const fmAdvanced = ["SHORTLISTED", "APPROVED", "QUESTIONNAIRE_PENDING", "QUESTIONNAIRE_SUBMITTED"].includes(a.status);
    if ((aiRec && fmAdvanced) || (aiNotRec && fmRejected)) aligned++;
  }
  return total === 0 ? 100 : Math.round((aligned / total) * 100);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function AuditorPrograms() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8943f" }}>
          OVERSIGHT
        </p>
        <h1 className="text-[22px] mt-0.5" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, color: "#1a1714" }}>
          Programs
        </h1>
        <p className="text-[13px]" style={{ color: "#7a7265" }}>
          Budget allocation and program health
        </p>
      </div>

      {/* Program Cards */}
      {stats.programs.map((program) => {
        const health = programHealth(program);
        const totalApps = program.rfps.reduce((sum, r) => sum + r.applications.length, 0);
        const activeGrants = program.contracts.filter((c) => c.status === "ACTIVE").length;
        const disbursedPct = program.budgetTotal > 0 ? (program.budgetDisbursed / program.budgetTotal) * 100 : 0;
        const committedPct = program.budgetTotal > 0 ? (program.budgetAllocated / program.budgetTotal) * 100 : 0;
        const expanded = expandedId === program.id;

        return (
          <div key={program.id}>
            <button
              className="w-full text-left rounded-[18px] p-4 cursor-pointer"
              style={{
                background: "#e8e0d0",
                boxShadow: "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
              }}
              onClick={() => setExpandedId(expanded ? null : program.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-bold" style={{ color: "#1a1714" }}>
                    {program.name}
                  </h3>
                  <p className="font-mono text-[15px] font-bold mt-1" style={{ color: "#1a1714" }}>
                    {formatSAR(program.budgetTotal)}
                  </p>
                </div>
                <ChevronRight
                  className="w-5 h-5 shrink-0 transition-transform duration-200"
                  style={{
                    color: "#9a9488",
                    transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                />
              </div>

              {/* Budget bar */}
              <div className="mt-3">
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

              {/* Stats row */}
              <p className="text-[12px] mt-3" style={{ color: "#7a7265" }}>
                {program.rfps.length} RFP{program.rfps.length !== 1 ? "s" : ""} · {activeGrants} Active Grant{activeGrants !== 1 ? "s" : ""} · {totalApps} Application{totalApps !== 1 ? "s" : ""}
              </p>

              {/* Health indicator */}
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full" style={{ background: health.color }} />
                <span className="text-[12px] font-semibold" style={{ color: health.color }}>
                  {health.label}
                </span>
              </div>

              {/* Fund manager */}
              <p className="text-[11px] mt-1.5" style={{ color: "#9a9488" }}>
                Managed by {stats.fmName}
              </p>
            </button>

            {/* Expanded — Program Detail */}
            {expanded && (
              <div className="mt-3 space-y-3">
                {/* Concordance rate */}
                {(() => {
                  const allApps = program.rfps.flatMap((r) => r.applications);
                  const rate = concordanceRate(allApps);
                  const divergent = allApps.filter((a) => {
                    const rec = a.decisionPacket?.recommendation;
                    if (!rec) return false;
                    const aiRec = rec === "RECOMMEND";
                    return (aiRec && a.status === "REJECTED");
                  }).length;
                  return (
                    <div
                      className="p-3 rounded-[14px] text-center"
                      style={{
                        background: "#e8e0d0",
                        boxShadow: "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
                      }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7a7265" }}>
                        CONCORDANCE RATE
                      </p>
                      <p
                        className="font-sans font-extrabold text-[24px] mt-0.5"
                        style={{ color: rate === 100 ? "#4a7c59" : "#b87a3f" }}
                      >
                        {rate}%
                      </p>
                      {divergent > 0 && (
                        <p className="text-[11px] mt-0.5" style={{ color: "#b87a3f" }}>
                          {divergent} divergent decision{divergent !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Per-RFP breakdown */}
                {program.rfps.map((rfp) => (
                  <div
                    key={rfp.id}
                    className="rounded-[14px] p-3"
                    style={{
                      background: "#e8e0d0",
                      boxShadow: "4px 4px 10px rgba(156,148,130,0.35), -4px -4px 10px rgba(255,250,240,0.7)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[14px] font-bold" style={{ color: "#1a1714" }}>{rfp.title}</h4>
                        <span
                          className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            background: rfp.status === "OPEN" ? "rgba(74,124,89,0.1)" : "rgba(122,114,101,0.1)",
                            color: rfp.status === "OPEN" ? "#4a7c59" : "#7a7265",
                          }}
                        >
                          {rfp.status}
                        </span>
                      </div>
                      <span className="text-[12px] font-mono" style={{ color: "#7a7265" }}>
                        {rfp.applications.length} apps
                      </span>
                    </div>

                    {/* AI scoring completion */}
                    {(() => {
                      const scored = rfp.applications.filter((a) => a.compositeScore !== null).length;
                      const total = rfp.applications.length;
                      const pct = total > 0 ? Math.round((scored / total) * 100) : 0;
                      return (
                        <div className="mt-2">
                          <NeuProgress
                            value={pct}
                            variant="gold"
                            size="sm"
                            label="AI Scoring"
                            showValue
                            groove
                          />
                        </div>
                      );
                    })()}

                    {/* Concordance for this RFP */}
                    <p className="text-[11px] mt-2" style={{ color: "#7a7265" }}>
                      Decision concordance: {concordanceRate(rfp.applications)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {stats.programs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[14px]" style={{ color: "#9a9488" }}>No programs found</p>
        </div>
      )}
    </div>
  );
}
