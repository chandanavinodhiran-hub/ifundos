"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NeuProgress } from "@/components/ui/neu-progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Eye,
  FileText,
  AlertTriangle,
  Shield,
  Camera,
  Plane,
  BarChart3,
} from "lucide-react";
import DynamicShadowCard from "@/components/DynamicShadowCard";

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

interface EvidenceRecord {
  id: string;
  type: string;
  filePath: string | null;
  submittedAt: string;
  reviewStatus: string;
  slideSolveCheck: string;
  milestone: { id: string; sequence: number; title: string };
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PHOTO: Camera,
  DRONE: Plane,
  SENSOR: BarChart3,
  REPORT: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  PHOTO: "Photo",
  DRONE: "Drone",
  SENSOR: "Sensor",
  REPORT: "Report",
};

/* ------------------------------------------------------------------ */
/* Urgency helpers                                                     */
/* ------------------------------------------------------------------ */

type Urgency = "evidence" | "overdue" | "ontrack";

function getUrgency(contract: ContractItem): Urgency {
  const hasEvidence = contract.milestones.some(
    (m) => m.status === "EVIDENCE_SUBMITTED"
  );
  if (hasEvidence) return "evidence";

  const hasFailed = contract.milestones.some((m) => m.status === "FAILED");
  if (hasFailed) return "overdue";

  return "ontrack";
}

function urgencyOrder(u: Urgency): number {
  if (u === "evidence") return 0;
  if (u === "overdue") return 1;
  return 2;
}

function accentBarClass(u: Urgency): string {
  if (u === "evidence") return "accent-left-amber";
  if (u === "overdue") return "accent-left-critical";
  return "";
}

function nextActionBadge(contract: ContractItem) {
  const evidenceMs = contract.milestones.find(
    (m) => m.status === "EVIDENCE_SUBMITTED"
  );
  if (evidenceMs) {
    return (
      <Badge variant="neu-amber">
        <Eye className="w-3 h-3 mr-1" />
        Review Evidence
      </Badge>
    );
  }

  const failedMs = contract.milestones.find((m) => m.status === "FAILED");
  if (failedMs) {
    return (
      <Badge variant="neu-critical">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Overdue
      </Badge>
    );
  }

  const pendingMs = contract.milestones.find((m) => m.status === "PENDING");
  if (pendingMs) {
    return (
      <Badge variant="neu">
        <Clock className="w-3 h-3 mr-1" />
        Awaiting
      </Badge>
    );
  }

  return (
    <Badge variant="neu-verified">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Complete
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ActiveGrantsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" /></div>}>
      <ActiveGrantsInner />
    </Suspense>
  );
}

function ActiveGrantsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterEvidence = searchParams.get("filter") === "evidence";
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] =
    useState<ContractItem | null>(null);
  const [evidenceForContract, setEvidenceForContract] = useState<EvidenceRecord[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/contracts")
      .then((r) => r.json())
      .then((data) => setContracts(data.contracts || []))
      .catch(() => setError("Failed to load grants"))
      .finally(() => setLoading(false));
  }, []);

  /* Fetch evidence when a contract is selected */
  const fetchEvidence = useCallback((contractId: string) => {
    fetch(`/api/evidence?contractId=${contractId}`)
      .then((r) => r.json())
      .then((data) => setEvidenceForContract(data.evidenceRecords || []))
      .catch(() => setEvidenceForContract([]));
  }, []);

  const openContract = useCallback((contract: ContractItem) => {
    setSelectedContract(contract);
    fetchEvidence(contract.id);
  }, [fetchEvidence]);

  async function handleEvidenceReview(id: string, decision: "APPROVED" | "REJECTED") {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/evidence/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          slideSolveCheck: decision === "APPROVED" ? "PASS" : "FAIL",
        }),
      });
      if (res.ok && selectedContract) {
        fetchEvidence(selectedContract.id);
      }
    } catch {
      // handled
    } finally {
      setReviewingId(null);
    }
  }

  /* Stats */
  const summaryStats = useMemo(() => {
    const active = contracts.filter((c) => c.status === "ACTIVE").length;
    const totalDisbursed = contracts.reduce(
      (s, c) =>
        s +
        c.disbursements
          .filter((d) => d.status === "RELEASED" || d.status === "APPROVED")
          .reduce((ds, d) => ds + d.amount, 0),
      0
    );
    const pendingEvidence = contracts.reduce(
      (s, c) =>
        s +
        c.milestones.filter((m) => m.status === "EVIDENCE_SUBMITTED").length,
      0
    );
    return { active, totalDisbursed, pendingEvidence };
  }, [contracts]);

  /* Sort by urgency, optionally filter to evidence-pending only */
  const sorted = useMemo(() => {
    let list = [...contracts];
    if (filterEvidence) {
      list = list.filter((c) => c.milestones.some((m) => m.status === "EVIDENCE_SUBMITTED"));
    }
    return list.sort(
      (a, b) => urgencyOrder(getUrgency(a)) - urgencyOrder(getUrgency(b))
    );
  }, [contracts, filterEvidence]);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="space-y-6 pb-safe page-enter">
        <div>
          <div className="skeleton-bar h-2 w-20 mb-2" style={{ opacity: 0.4 }} />
          <div className="skeleton-bar h-6 w-36" style={{ opacity: 0.5 }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card p-4" style={{ height: 90 }}>
              <div className="flex flex-col items-center gap-2">
                <div className="skeleton-bar h-8 w-12" style={{ opacity: 0.5 }} />
                <div className="skeleton-bar h-2 w-14" style={{ opacity: 0.3 }} />
              </div>
            </div>
          ))}
        </div>
        {[1,2].map(i => (
          <div key={i} className="skeleton-card p-4" style={{ height: 120 }}>
            <div className="skeleton-bar h-4 w-40 mb-2" style={{ opacity: 0.5 }} />
            <div className="skeleton-bar h-3 w-32 mb-3" style={{ opacity: 0.3 }} />
            <div className="skeleton-bar h-2 w-full mb-2" style={{ opacity: 0.2 }} />
            <div className="flex items-center justify-between">
              <div className="skeleton-bar h-5 w-20" style={{ opacity: 0.3 }} />
              <div className="skeleton-bar h-5 w-16" style={{ opacity: 0.3 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-critical">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-safe page-enter">
      {/* ── Page Header ── */}
      <div className="animate-in-1">
        <p className="text-eyebrow">{filterEvidence ? "EVIDENCE REVIEW" : "GRANTS"}</p>
        <h1 className="text-xl font-bold text-sovereign-charcoal mt-1">
          {filterEvidence ? "Grants with Pending Evidence" : "Active Grants"}
        </h1>
      </div>

      {/* ── 3 Compact Stat Wells ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-in-2">
        {/* Active count */}
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-3 sm:p-6 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 300, color: "#2C3044" }}>
            <AnimatedCounter end={summaryStats.active} duration={1000} />
          </span>
          <span className="label-style mt-1">Active</span>
        </DynamicShadowCard>

        {/* Total Disbursed */}
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-3 sm:p-6 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 300, color: "#2C3044" }}>
            {formatSAR(summaryStats.totalDisbursed)}
          </span>
          <span className="label-style mt-1">Disbursed</span>
        </DynamicShadowCard>

        {/* Pending Evidence */}
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-3 sm:p-6 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 300, color: "#2C3044" }}>
            <AnimatedCounter end={summaryStats.pendingEvidence} duration={1000} />
          </span>
          <span className="label-style mt-1">Pending</span>
        </DynamicShadowCard>
      </div>

      {/* ── Grant Cards ── */}
      {sorted.length === 0 ? (
        <DynamicShadowCard inset intensity={1} className="neu-empty-inset p-8">
          <div className="smart-empty">
            <div className="smart-empty-icon">
              <FileText className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
            </div>
            <h3>No grants awarded yet</h3>
            <p>
              Grants appear here after applications are shortlisted and contracts awarded from the Pipeline.
              Reviewing pending applications is the first step toward active grants.
            </p>
            <button
              onClick={() => router.push('/dashboard/applications')}
              className="smart-empty-action"
            >
              Go to Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </DynamicShadowCard>
      ) : (
        <div className="space-y-3 stagger-children animate-in-3">
          {sorted.map((contract) => {
            const urgency = getUrgency(contract);
            const totalMs = contract.milestones.length;
            const verifiedMs = contract.milestones.filter(
              (m) => m.status === "VERIFIED"
            ).length;
            const progressPct = totalMs > 0 ? Math.round((verifiedMs / totalMs) * 100) : 0;

            return (
              <DynamicShadowCard
                key={contract.id}
                intensity={2}
                onClick={() => openContract(contract)}
                className={`relative w-full text-left bg-neu-base rounded-[18px] shadow-neu-raised neu-press p-4 ${accentBarClass(urgency)} transition-shadow`}
              >
                {/* Top row: contractor + budget */}
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-sovereign-charcoal truncate leading-snug">
                      {contract.organization.name}
                    </p>
                    <p className="text-xs text-sovereign-stone truncate mt-0.5">
                      {contract.application.rfp.title}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-sovereign-charcoal ml-3 shrink-0 tabular-nums">
                    {formatSAR(contract.awardAmount)}
                  </span>
                </div>

                {/* Progress bar */}
                <NeuProgress
                  value={progressPct}
                  variant={
                    urgency === "overdue"
                      ? "critical"
                      : urgency === "evidence"
                        ? "amber"
                        : "gold"
                  }
                  size="sm"
                  showValue
                  label={`${verifiedMs}/${totalMs} milestones`}
                  className="mb-2"
                />

                {/* Bottom row: next action badge */}
                <div className="flex items-center justify-between">
                  {nextActionBadge(contract)}
                  <Badge variant="neu" className="text-[10px]">
                    {contract.status}
                  </Badge>
                </div>
              </DynamicShadowCard>
            );
          })}
        </div>
      )}

      {/* ── Contract Detail Dialog ── */}
      {selectedContract && (
        <Dialog
          open={!!selectedContract}
          onOpenChange={() => setSelectedContract(null)}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-neu-base border-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-sovereign-charcoal">
                {selectedContract.organization.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 mt-3">
              {/* Contract info tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <InfoTile label="RFP" value={selectedContract.application.rfp.title} />
                <InfoTile label="Program" value={selectedContract.program.name} />
                <InfoTile
                  label="Award"
                  value={`${formatSAR(selectedContract.awardAmount)} SAR`}
                  mono
                />
                <InfoTile
                  label="AI Score"
                  value={
                    selectedContract.application.compositeScore
                      ? `${selectedContract.application.compositeScore}/100`
                      : "N/A"
                  }
                />
                <InfoTile
                  label="Awarded"
                  value={new Date(selectedContract.createdAt).toLocaleDateString()}
                />
                <InfoTile
                  label="Trust Tier"
                  value={selectedContract.organization.trustTier}
                />
              </div>

              {selectedContract.justification && (
                <div className="bg-neu-dark/40 rounded-2xl p-3">
                  <p className="text-eyebrow mb-1">Award Justification</p>
                  <p className="text-sm text-sovereign-charcoal">
                    {selectedContract.justification}
                  </p>
                </div>
              )}

              {/* Milestone Journey */}
              <div>
                <p className="text-eyebrow mb-3">Milestone Journey</p>
                <div className="relative">
                  <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-sovereign-warm/30" />
                  <div className="space-y-3">
                    {selectedContract.milestones.map((m) => (
                      <div key={m.id} className="relative flex items-start gap-3">
                        <div
                          className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            m.status === "VERIFIED"
                              ? "bg-sovereign-gold border-sovereign-gold text-white"
                              : m.status === "EVIDENCE_SUBMITTED"
                                ? "bg-neu-light border-amber/60 text-amber"
                                : m.status === "FAILED"
                                  ? "bg-neu-light border-critical/60 text-critical"
                                  : "bg-neu-light border-sovereign-warm/40 text-sovereign-stone"
                          }`}
                        >
                          {m.status === "VERIFIED" ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : m.status === "EVIDENCE_SUBMITTED" ? (
                            <Eye className="w-4 h-4 animate-ember" />
                          ) : m.status === "FAILED" ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-xs font-bold">{m.sequence}</span>
                          )}
                        </div>

                        <div className="flex-1 neu-display-inset rounded-2xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="font-semibold text-sm text-sovereign-charcoal truncate">
                                {m.title}
                              </p>
                              <Badge
                                variant={
                                  m.status === "VERIFIED"
                                    ? "neu-verified"
                                    : m.status === "EVIDENCE_SUBMITTED"
                                      ? "neu-amber"
                                      : m.status === "FAILED"
                                        ? "neu-critical"
                                        : "neu"
                                }
                                className="text-[10px] shrink-0"
                              >
                                {m.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <span className="font-mono text-xs font-medium text-sovereign-charcoal ml-2 shrink-0 tabular-nums">
                              {formatSAR(m.disbursementAmount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-sovereign-stone">
                            <span>{(m.disbursementPct * 100).toFixed(0)}% of contract</span>
                            {m.verifiedAt && (
                              <span className="flex items-center gap-1 text-verified">
                                <CheckCircle2 className="w-3 h-3" />
                                {new Date(m.verifiedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inline Evidence Review */}
              {evidenceForContract.filter((e) => e.reviewStatus === "PENDING").length > 0 && (
                <div>
                  <p className="text-eyebrow mb-3">Pending Evidence</p>
                  <div className="space-y-2">
                    {evidenceForContract
                      .filter((e) => e.reviewStatus === "PENDING")
                      .map((ev) => {
                        const TypeIcon = TYPE_ICONS[ev.type] || FileText;
                        return (
                          <div
                            key={ev.id}
                            className="relative neu-display-inset rounded-2xl p-3 accent-left-amber"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-neu-dark/40 flex items-center justify-center">
                                  <TypeIcon className="w-3.5 h-3.5 text-sovereign-stone" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-sovereign-charcoal">
                                    M{ev.milestone.sequence}: {ev.milestone.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="neu" className="text-[10px]">
                                      {TYPE_LABELS[ev.type] || ev.type}
                                    </Badge>
                                    <Badge
                                      variant={ev.slideSolveCheck === "PASS" ? "neu-verified" : ev.slideSolveCheck === "FAIL" ? "neu-critical" : "neu"}
                                      className="text-[10px]"
                                    >
                                      <Shield className="w-3 h-3 mr-0.5" />
                                      AI: {ev.slideSolveCheck}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] text-sovereign-stone shrink-0">
                                {new Date(ev.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="neu-gold"
                                size="sm"
                                className="flex-1"
                                disabled={reviewingId === ev.id}
                                onClick={() => handleEvidenceReview(ev.id, "APPROVED")}
                              >
                                {reviewingId === ev.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="neu-outline"
                                size="sm"
                                className="flex-1"
                                disabled={reviewingId === ev.id}
                                onClick={() => handleEvidenceReview(ev.id, "REJECTED")}
                              >
                                {reviewingId === ev.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Payment History */}
              {selectedContract.disbursements.length > 0 && (
                <div>
                  <p className="text-eyebrow mb-3">Payment History</p>
                  <div className="space-y-2">
                    {selectedContract.disbursements.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between neu-display-inset rounded-2xl p-3"
                      >
                        <div className="flex items-center gap-2">
                          {d.status === "RELEASED" ? (
                            <CheckCircle2 className="w-4 h-4 text-sovereign-gold" />
                          ) : (
                            <Clock className="w-4 h-4 text-sovereign-stone" />
                          )}
                          <span className="font-mono text-sm tabular-nums">
                            {formatSAR(d.amount)} SAR
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={d.status === "RELEASED" ? "neu-gold" : "neu"}
                            className="text-[10px]"
                          >
                            {d.status}
                          </Badge>
                          {d.releasedAt && (
                            <span className="text-[11px] text-sovereign-stone">
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
                  variant="neu-gold"
                  size="sm"
                  onClick={() => {
                    window.location.href = `/dashboard/rfps/${selectedContract.application.rfp.id}`;
                  }}
                >
                  View RFP
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="neu-outline"
                  size="sm"
                  onClick={() => setSelectedContract(null)}
                >
                  Close
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

function InfoTile({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="neu-info-tile rounded-xl p-2.5">
      <p className="text-eyebrow text-[10px]">{label}</p>
      <p
        className={`text-sm font-semibold text-sovereign-charcoal mt-0.5 truncate ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}
