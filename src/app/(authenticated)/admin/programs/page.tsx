"use client";

import { useState, useEffect } from "react";
import {
  Loader2, ChevronRight, Plus, X, Building2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface ProgramRFP {
  id: string;
  title: string;
  status: string;
  applications: { id: string }[];
}

interface ProgramData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budgetTotal: number;
  budgetAllocated: number;
  budgetDisbursed: number;
  createdAt: string;
  rfps: ProgramRFP[];
  contracts: { id: string }[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function formatSAR(amount: number): string {
  if (amount >= 1_000_000) return `SAR ${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `SAR ${(amount / 1_000).toFixed(0)}K`;
  return `SAR ${amount.toLocaleString()}`;
}

const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
  ACTIVE: { color: "#4a7c59", bg: "rgba(74,124,89,0.1)" },
  DRAFT: { color: "#b87a3f", bg: "rgba(184,122,63,0.1)" },
  CLOSED: { color: "#7a7265", bg: "rgba(122,114,101,0.1)" },
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setPrograms(data.programs ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!formName || !formBudget) return;
    setSaving(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc || undefined,
          budgetTotal: parseFloat(formBudget.replace(/[^0-9.]/g, "")),
          status: formStatus,
        }),
      });
      if (res.ok) {
        setSheetOpen(false);
        setFormName(""); setFormDesc(""); setFormBudget(""); setFormStatus("ACTIVE");
        // Refresh
        const stats = await fetch("/api/stats").then((r) => r.json());
        setPrograms(stats.programs ?? []);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* ── Header ── */}
      <div>
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#b8943f" }}
        >
          ADMINISTRATION
        </p>
        <h1
          className="text-[22px] leading-tight mt-1"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 800, color: "#1a1714" }}
        >
          Programs
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "#7a7265" }}>
          Funding programs and allocation
        </p>
      </div>

      {/* ── Program Cards ── */}
      {programs.map((program) => {
        const isExpanded = expandedId === program.id;
        const totalApps = program.rfps.reduce((sum, r) => sum + r.applications.length, 0);
        const badge = STATUS_BADGE[program.status] ?? STATUS_BADGE.CLOSED;
        const budgetPct = program.budgetTotal > 0
          ? Math.min(100, (program.budgetDisbursed / program.budgetTotal) * 100)
          : 0;
        const allocPct = program.budgetTotal > 0
          ? Math.min(100, (program.budgetAllocated / program.budgetTotal) * 100)
          : 0;

        return (
          <div key={program.id}>
            <button
              className="w-full text-left rounded-[18px] p-4 cursor-pointer"
              style={{
                background: "#e8e0d0",
                boxShadow:
                  "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
              }}
              onClick={() => setExpandedId(isExpanded ? null : program.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-bold" style={{ color: "#1a1714" }}>
                    {program.name}
                  </h3>
                  {program.description && (
                    <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: "#7a7265" }}>
                      {program.description}
                    </p>
                  )}
                  <p
                    className="font-mono text-[15px] font-bold mt-1.5"
                    style={{ color: "#b8943f" }}
                  >
                    {formatSAR(program.budgetTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: badge.color,
                      background: badge.bg,
                      boxShadow:
                        "inset 2px 2px 5px rgba(156,148,130,0.35), inset -2px -2px 5px rgba(255,250,240,0.6)",
                    }}
                  >
                    {program.status}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 transition-transform"
                    style={{
                      color: "#9a9488",
                      transform: isExpanded ? "rotate(90deg)" : "none",
                    }}
                  />
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="mt-3">
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{
                    background: "#e8e0d0",
                    boxShadow:
                      "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
                  }}
                >
                  <div className="h-full flex">
                    {budgetPct > 0 && (
                      <div
                        className="h-full rounded-l-full"
                        style={{
                          width: `${budgetPct}%`,
                          background: "linear-gradient(90deg, #4a7c59, #5a9c6a)",
                        }}
                      />
                    )}
                    {allocPct > budgetPct && (
                      <div
                        className="h-full"
                        style={{
                          width: `${allocPct - budgetPct}%`,
                          background: "linear-gradient(90deg, #b8943f, #d4b665)",
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-[10px] font-mono" style={{ color: "#4a7c59" }}>
                    Disbursed {formatSAR(program.budgetDisbursed)}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "#b8943f" }}>
                    Committed {formatSAR(program.budgetAllocated)}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <p className="text-[12px] mt-3" style={{ color: "#7a7265" }}>
                {program.rfps.length} RFP{program.rfps.length !== 1 ? "s" : ""}
                {" · "}
                {totalApps} Application{totalApps !== 1 ? "s" : ""}
                {" · "}
                {program.contracts.length} Contract{program.contracts.length !== 1 ? "s" : ""}
              </p>
            </button>

            {/* ── Expanded Detail ── */}
            {isExpanded && program.rfps.length > 0 && (
              <div className="mt-3 space-y-2 mx-2">
                <h4
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: "#7a7265" }}
                >
                  RFPs
                </h4>
                {program.rfps.map((rfp) => {
                  const rfpBadge = STATUS_BADGE[rfp.status] ?? STATUS_BADGE.CLOSED;
                  return (
                    <div
                      key={rfp.id}
                      className="rounded-[14px] p-3 flex items-center justify-between"
                      style={{
                        background: "#e8e0d0",
                        boxShadow:
                          "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "#1a1714" }}>
                          {rfp.title}
                        </p>
                        <p className="text-[11px]" style={{ color: "#9a9488" }}>
                          {rfp.applications.length} application{rfp.applications.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0 ml-2"
                        style={{ color: rfpBadge.color, background: rfpBadge.bg }}
                      >
                        {rfp.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {programs.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No programs yet"
          description="Create your first funding program to get started"
          action={
            <Button variant="neu-gold" onClick={() => setSheetOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Program
            </Button>
          }
        />
      )}

      {/* ── FAB — Create Program ── */}
      {programs.length > 0 && (
        <button
          className="fixed bottom-24 right-5 md:bottom-8 md:right-8 w-14 h-14 rounded-full flex items-center justify-center z-40 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #b8943f, #d4b665)",
            boxShadow:
              "4px 4px 12px rgba(156,148,130,0.5), -4px -4px 12px rgba(255,250,240,0.6), 0 0 16px rgba(184,148,63,0.2)",
          }}
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="w-6 h-6" style={{ color: "#fff" }} />
        </button>
      )}

      {/* ── Bottom Sheet — Create Program ── */}
      {sheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setSheetOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
            <div
              className="rounded-t-[24px] p-5 space-y-4"
              style={{
                background: "#e8e0d0",
                boxShadow: "0 -8px 30px rgba(156,148,130,0.3)",
              }}
            >
              <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "rgba(122,114,101,0.3)" }} />
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold" style={{ color: "#1a1714" }}>Create Program</h3>
                <button onClick={() => setSheetOpen(false)} className="cursor-pointer p-1">
                  <X className="w-5 h-5" style={{ color: "#7a7265" }} />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#7a7265" }}>
                  Program Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Desert Greening Initiative"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={{
                    background: "#e8e0d0", color: "#1a1714",
                    boxShadow: "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#7a7265" }}>
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief program description..."
                  rows={2}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                  style={{
                    background: "#e8e0d0", color: "#1a1714",
                    boxShadow: "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
                  }}
                />
              </div>

              {/* Budget */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#7a7265" }}>
                  Budget (SAR)
                </label>
                <input
                  type="text"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  placeholder="e.g. 500000000"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none font-mono"
                  style={{
                    background: "#e8e0d0", color: "#1a1714",
                    boxShadow: "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
                  }}
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#7a7265" }}>
                  Status
                </label>
                <div className="flex gap-2 mt-1.5">
                  {["ACTIVE", "DRAFT"].map((s) => {
                    const active = formStatus === s;
                    const badge = STATUS_BADGE[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setFormStatus(s)}
                        className="px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all"
                        style={{
                          color: active ? badge.color : "#9a9488",
                          background: active ? badge.bg : "#e8e0d0",
                          boxShadow: active
                            ? "3px 3px 8px rgba(156,148,130,0.45), -3px -3px 8px rgba(255,250,240,0.8)"
                            : "inset 2px 2px 6px rgba(140,132,115,0.4), inset -2px -2px 6px rgba(255,250,240,0.5)",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="neu-primary"
                className="w-full"
                disabled={!formName || !formBudget || saving}
                onClick={handleCreate}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Program
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
