"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2, Search, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface RFP {
  id: string;
  title: string;
  description: string | null;
  eligibilityCriteria: string | null;
  deadline: string | null;
  status: string;
  program: {
    id: string;
    name: string;
    budgetTotal: number;
    budgetAllocated: number;
  };
}

interface OrgInfo {
  trustTier: string;
  capitalization: number | null;
  businessCategories: string | null;
  certifications: string | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


const TIER_ORDER: Record<string, number> = { T0: 0, T1: 1, T2: 2, T3: 3, T4: 4 };

function checkEligibility(
  criteria: string | null,
  org: OrgInfo | null
): { eligible: boolean; reason: string | null } {
  if (!org || !criteria) return { eligible: true, reason: null };
  try {
    const parsed = JSON.parse(criteria);
    // Check trust tier
    if (parsed.minimumTrustTier) {
      const required = TIER_ORDER[parsed.minimumTrustTier] ?? 0;
      const current = TIER_ORDER[org.trustTier] ?? 0;
      if (current < required) {
        return { eligible: false, reason: `Requires ${parsed.minimumTrustTier}+` };
      }
    }
    // Check capitalization
    if (parsed.minimumCapitalization && org.capitalization !== null) {
      if (org.capitalization < Number(parsed.minimumCapitalization)) {
        return { eligible: false, reason: `Min capital: SAR ${Number(parsed.minimumCapitalization).toLocaleString()}` };
      }
    }
    // Check categories
    if (parsed.requiredCategories && Array.isArray(parsed.requiredCategories) && org.businessCategories) {
      try {
        const orgCats: string[] = JSON.parse(org.businessCategories);
        const hasCat = parsed.requiredCategories.some((c: string) => orgCats.includes(c));
        if (!hasCat) {
          return { eligible: false, reason: `Requires: ${parsed.requiredCategories.join(", ")}` };
        }
      } catch { /* skip */ }
    }
    return { eligible: true, reason: null };
  } catch {
    return { eligible: true, reason: null };
  }
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B SAR`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function BrowseRFPsPage() {
  const router = useRouter();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("matching");
  const [org, setOrg] = useState<OrgInfo | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [rfpRes, statsRes] = await Promise.all([
          fetch("/api/rfps?open=true"),
          fetch("/api/stats"),
        ]);
        if (!rfpRes.ok) throw new Error("Failed to fetch RFPs");
        const rfpData = await rfpRes.json();
        setRfps(rfpData.rfps || []);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.organization) {
            setOrg(statsData.organization);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load RFPs");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const programs = useMemo(() => {
    const map = new Map<string, string>();
    rfps.forEach((rfp) => map.set(rfp.program.id, rfp.program.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rfps]);

  const filteredRfps = useMemo(() => {
    return rfps.filter((rfp) => {
      const matchesSearch = searchQuery === "" || rfp.title.toLowerCase().includes(searchQuery.toLowerCase());
      const eligibility = checkEligibility(rfp.eligibilityCriteria, org);

      if (programFilter === "matching") {
        return matchesSearch && eligibility.eligible;
      }
      if (programFilter === "all") {
        return matchesSearch;
      }
      return matchesSearch && rfp.program.id === programFilter;
    });
  }, [rfps, searchQuery, programFilter, org]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(75, 165, 195, 0.7)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sovereign-stone">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 contractor-page-scroll" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)" }}>
      {/* Header */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "rgba(30, 34, 53, 0.4)" }}
        >
          OPPORTUNITIES
        </p>
        <h1 className="text-[22px] font-extrabold text-sovereign-charcoal mt-1">
          Opportunities
        </h1>
        <p className="text-[13px] text-sovereign-stone mt-0.5">
          RFPs matching your profile
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sovereign-stone/60" />
        <input
          type="text"
          placeholder="Search RFPs by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neu-dark/30 border-0 shadow-neu-inset rounded-2xl px-4 py-3 pl-10 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/60 outline-none focus:ring-2 focus:ring-sovereign-gold/30"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setProgramFilter("matching")}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
            programFilter === "matching"
              ? "font-bold"
              : "shadow-neu-inset bg-neu-dark/20 text-sovereign-stone"
          }`}
          style={programFilter === "matching" ? {
            background: "rgba(92, 111, 181, 0.8)",
            color: "#fff",
            border: "1px solid rgba(92, 111, 181, 0.9)",
          } : undefined}
        >
          ✦ Matching
        </button>
        <button
          onClick={() => setProgramFilter("all")}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
            programFilter === "all"
              ? "shadow-neu-raised bg-neu-base text-sovereign-gold"
              : "shadow-neu-inset bg-neu-dark/20 text-sovereign-stone"
          }`}
        >
          All
        </button>
        {programs.map((p) => (
          <button
            key={p.id}
            onClick={() => setProgramFilter(p.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
              programFilter === p.id
                ? "shadow-neu-raised bg-neu-base text-sovereign-gold"
                : "shadow-neu-inset bg-neu-dark/20 text-sovereign-stone"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* RFP Cards */}
      {filteredRfps.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No opportunities found"
          description={
            searchQuery || (programFilter !== "all" && programFilter !== "matching")
              ? "Try adjusting your search or filters"
              : programFilter === "matching"
              ? "No RFPs currently match your profile criteria"
              : "Check back later for new funding opportunities"
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRfps.map((rfp) => {
            const daysLeft = getDaysLeft(rfp.deadline);
            const eligibility = checkEligibility(rfp.eligibilityCriteria, org);

            return (
              <Card
                key={rfp.id}
                variant="neu-raised"
                className="p-4 cursor-pointer neu-press accent-left-green"
                onClick={() => router.push(`/contractor/rfps/${rfp.id}`)}
              >
                {/* Top row: title + eligibility */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-[16px] font-bold text-sovereign-charcoal leading-snug flex-1 min-w-0">
                    {rfp.title}
                  </h3>
                  <div className="shrink-0">
                    {eligibility.eligible ? (
                      <span
                        className="inline-flex items-center gap-1"
                        style={{
                          background: "rgba(74, 140, 106, 0.08)",
                          border: "1px solid rgba(74, 140, 106, 0.15)",
                          color: "rgba(74, 140, 106, 0.85)",
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "1.5px",
                          padding: "3px 10px",
                          borderRadius: 20,
                          textTransform: "uppercase",
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Eligible
                      </span>
                    ) : (
                      <div className="relative group">
                        <Badge variant="neu-critical" className="cursor-help">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Eligible
                        </Badge>
                        {eligibility.reason && (
                          <div className="invisible group-hover:visible absolute right-0 top-full mt-1 w-48 bg-neu-base shadow-neu-raised rounded-xl p-2 z-50 text-xs text-sovereign-stone">
                            {eligibility.reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta row: program badge, budget, deadline */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="neu">{rfp.program.name}</Badge>
                  {rfp.program.budgetTotal > 0 && (
                    <span
                      className="text-[13px] font-mono"
                      style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.5)" }}
                    >
                      {formatSAR(rfp.program.budgetTotal)}
                    </span>
                  )}
                  {daysLeft !== null && daysLeft >= 0 && (
                    <span
                      className="text-[13px]"
                      style={{ fontWeight: 500, color: "rgba(30, 34, 53, 0.5)" }}
                    >
                      {daysLeft}d left
                    </span>
                  )}
                  {daysLeft !== null && daysLeft < 0 && (
                    <span className="text-[12px] font-semibold text-sovereign-stone/60">
                      Expired
                    </span>
                  )}
                </div>

                {/* Description */}
                {rfp.description && (
                  <p className="text-[13px] text-sovereign-stone line-clamp-2">
                    {rfp.description}
                  </p>
                )}

                {/* AI Match indicator */}
                {eligibility.eligible && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-ember" style={{ background: "rgba(74, 140, 106, 0.7)" }} />
                    <span className="text-[12px]" style={{ color: "rgba(74, 140, 106, 0.7)" }}>
                      Strong match — your profile meets all eligibility criteria
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
