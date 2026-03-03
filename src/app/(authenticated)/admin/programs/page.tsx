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
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const NEU_RAISED: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.55)",
  backdropFilter: "blur(12px)",
  borderTop: "1.5px solid rgba(255, 255, 255, 0.8)",
  borderLeft: "1.5px solid rgba(255, 255, 255, 0.7)",
  borderBottom: "1.5px solid rgba(255, 255, 255, 0.15)",
  borderRight: "1.5px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "10px 10px 25px rgba(155, 161, 180, 0.4), -10px -10px 25px rgba(255, 255, 255, 0.8)",
};

const NEU_INSET_INPUT: React.CSSProperties = {
  background: "rgba(228, 231, 238, 0.5)",
  boxShadow: "inset 4px 4px 10px rgba(155, 161, 180, 0.25), inset -4px -4px 10px rgba(255, 255, 255, 0.7)",
  color: "rgba(30, 34, 53, 0.85)",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function formatSAR(amount: number): string {
  if (amount >= 1_000_000) return `SAR ${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `SAR ${(amount / 1_000).toFixed(0)}K`;
  return `SAR ${amount.toLocaleString()}`;
}

const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
  ACTIVE: { color: "rgba(74, 140, 106, 0.85)", bg: "rgba(74, 140, 106, 0.1)" },
  DRAFT: { color: "rgba(175, 148, 63, 0.85)", bg: "rgba(175, 148, 63, 0.1)" },
  CLOSED: { color: "rgba(30, 34, 53, 0.5)", bg: "rgba(30, 34, 53, 0.06)" },
  OPEN: { color: "rgba(75, 130, 180, 0.85)", bg: "rgba(75, 130, 180, 0.1)" },
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
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-[100px] md:pb-0">
      {/* ── Header ── */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif", letterSpacing: "2.5px" }}
        >
          ADMINISTRATION
        </p>
        <h1
          className="text-[22px] leading-tight mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "rgba(30, 34, 53, 0.85)" }}
        >
          Programs
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
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
              className="w-full text-left rounded-[20px] p-5 cursor-pointer"
              style={{ ...NEU_RAISED, borderRadius: "20px" }}
              onClick={() => setExpandedId(isExpanded ? null : program.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px]" style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}>
                    {program.name}
                  </h3>
                  {program.description && (
                    <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                      {program.description}
                    </p>
                  )}
                  <p
                    className="font-mono text-[16px] mt-1.5"
                    style={{ color: "rgba(30, 34, 53, 0.75)", fontWeight: 500 }}
                  >
                    {formatSAR(program.budgetTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="px-3 py-1 rounded-full text-[11px] uppercase shrink-0"
                    style={{
                      color: badge.color,
                      background: badge.bg,
                      fontWeight: 600,
                      letterSpacing: "1px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {program.status}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 transition-transform"
                    style={{
                      color: "rgba(30, 34, 53, 0.2)",
                      transform: isExpanded ? "rotate(90deg)" : "none",
                    }}
                  />
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="mt-3">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(30, 34, 53, 0.08)" }}
                >
                  <div className="h-full flex">
                    {budgetPct > 0 && (
                      <div
                        className="h-full rounded-l-full"
                        style={{
                          width: `${budgetPct}%`,
                          background: "rgba(74, 140, 106, 0.75)",
                        }}
                      />
                    )}
                    {allocPct > budgetPct && (
                      <div
                        className="h-full"
                        style={{
                          width: `${allocPct - budgetPct}%`,
                          background: "rgba(175, 148, 63, 0.75)",
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-[12px]" style={{ color: "rgba(74, 140, 106, 0.85)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
                    Disbursed {formatSAR(program.budgetDisbursed)}
                  </span>
                  <span className="text-[12px]" style={{ color: "rgba(175, 148, 63, 0.85)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
                    Committed {formatSAR(program.budgetAllocated)}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <p className="text-[12px] mt-3" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
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
                  style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "2.5px" }}
                >
                  RFPs
                </h4>
                {program.rfps.map((rfp) => {
                  const rfpBadge = STATUS_BADGE[rfp.status] ?? STATUS_BADGE.CLOSED;
                  return (
                    <div
                      key={rfp.id}
                      className="rounded-[14px] p-4 flex items-center justify-between"
                      style={{ ...NEU_RAISED, borderRadius: "14px" }}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] truncate" style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}>
                          {rfp.title}
                        </p>
                        <p className="text-[13px]" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
                          {rfp.applications.length} application{rfp.applications.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-[11px] uppercase shrink-0 ml-2"
                        style={{
                          color: rfpBadge.color,
                          background: rfpBadge.bg,
                          fontWeight: 600,
                          letterSpacing: "1px",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
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
            <Button variant="neu-primary" onClick={() => setSheetOpen(true)}>
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
            background: "linear-gradient(135deg, #5C6FB5, #7B8DC8)",
            boxShadow:
              "6px 6px 16px rgba(155, 161, 180, 0.45), -6px -6px 16px rgba(255, 255, 255, 0.8), 0 0 16px rgba(92, 111, 181, 0.2)",
          }}
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="w-6 h-6" style={{ color: "#fff" }} />
        </button>
      )}

      {/* ── Bottom Sheet — Create Program ── */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(30, 34, 53, 0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
            <div
              className="rounded-t-[24px] p-5 space-y-4"
              style={{
                background: "var(--surface-light)",
                boxShadow: "0 -8px 30px rgba(155, 161, 180, 0.3)",
              }}
            >
              <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "rgba(30, 34, 53, 0.15)" }} />
              <div className="flex items-center justify-between">
                <h3 className="text-[18px]" style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.85)", fontFamily: "'DM Sans', sans-serif" }}>Create Program</h3>
                <button onClick={() => setSheetOpen(false)} className="cursor-pointer p-1">
                  <X className="w-5 h-5" style={{ color: "rgba(30, 34, 53, 0.4)" }} />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Program Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Desert Greening Initiative"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none"
                  style={NEU_INSET_INPUT}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief program description..."
                  rows={2}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                  style={NEU_INSET_INPUT}
                />
              </div>

              {/* Budget */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Budget (SAR)
                </label>
                <input
                  type="text"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  placeholder="e.g. 500000000"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl text-[14px] outline-none font-mono"
                  style={NEU_INSET_INPUT}
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(30, 34, 53, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>
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
                        className="px-4 py-2 rounded-xl text-[12px] font-medium cursor-pointer transition-all"
                        style={{
                          color: active ? badge.color : "rgba(30, 34, 53, 0.4)",
                          background: active ? badge.bg : "transparent",
                          border: active ? "none" : "1px solid rgba(30, 34, 53, 0.1)",
                          fontFamily: "'DM Sans', sans-serif",
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
