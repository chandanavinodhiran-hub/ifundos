"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreWell } from "@/components/ui/score-well";
import { NeuProgress } from "@/components/ui/neu-progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, CheckCircle2, ShoppingCart, AlertTriangle, Clock, Package } from "lucide-react";
import DynamicShadowCard from "@/components/DynamicShadowCard";

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
/* Order Suggestion Data                                               */
/* ------------------------------------------------------------------ */

interface OrderItem {
  product: string;
  qty: string;
  reason: string;
  value: number;
}

interface OrderSuggestion {
  title: string;
  subtitle: string;
  items: OrderItem[];
  total: number;
}

const FULL_ORDER: OrderSuggestion = {
  title: "Patterson Order Suggestion",
  subtitle: "Generated from chairside observations and treatment demand signals",
  items: [
    { product: "Bone graft material", qty: "3 units", reason: "Implant consults + extraction follow-ups", value: 450 },
    { product: "Membrane", qty: "3 units", reason: "Graft-supported implant cases", value: 360 },
    { product: "Implant surgical kit", qty: "2 kits", reason: "Upcoming implant consultations", value: 600 },
    { product: "Composite refill", qty: "5 packs", reason: "Restorative demand detected", value: 300 },
  ],
  total: 1710,
};

const IMPLANT_ORDER: OrderSuggestion = {
  title: "Implant Demand Order Suggestion",
  subtitle: "Generated from chairside observations and treatment demand signals",
  items: [
    { product: "Bone graft material", qty: "3 units", reason: "Implant consults + extraction follow-ups", value: 450 },
    { product: "Membrane", qty: "3 units", reason: "Graft-supported implant cases", value: 360 },
    { product: "Implant surgical kit", qty: "2 kits", reason: "Upcoming implant consultations", value: 600 },
  ],
  total: 1410,
};

/* ------------------------------------------------------------------ */
/* Static Demo Data                                                    */
/* ------------------------------------------------------------------ */

const DEMO_DEMAND: ImpactData = {
  summary: {
    totalContracts: 11,
    activeContracts: 7,
    completedContracts: 4,
    totalAwardAmount: 3200,
    totalBudget: 6800,
    totalDisbursed: 1400,
    totalTreesTarget: 11,
    totalTreesPlanted: 7,
  },
  milestoneStats: {
    total: 7,
    verified: 3,
    pending: 0,
    evidenceSubmitted: 4,
    completionRate: 43,
  },
  evidenceStats: {
    total: 7,
    approved: 3,
    rejected: 2,
    pending: 4,
    byType: {},
  },
  contractorPerformance: [
    {
      contractorName: "Implant-driven demand",
      trustTier: "T3",
      rfpTitle: "5 implant opportunities detected",
      awardAmount: 4200,
      aiScore: 82,
      milestonesTotal: 5,
      milestonesCompleted: 5,
      completionRate: 100,
      contractStatus: "ACTIVE",
    },
  ],
  programBreakdown: [
    { name: "Implant Cases",   budgetTotal: 4200, budgetAllocated: 4200, budgetDisbursed: 2100, allocationPct: 100, disbursedPct: 50 },
    { name: "Restorative",     budgetTotal: 1200, budgetAllocated: 1000, budgetDisbursed: 600,  allocationPct: 83,  disbursedPct: 50 },
    { name: "Endodontics",     budgetTotal: 900,  budgetAllocated: 900,  budgetDisbursed: 500,  allocationPct: 100, disbursedPct: 56 },
    { name: "Ortho Supplies",  budgetTotal: 500,  budgetAllocated: 400,  budgetDisbursed: 300,  allocationPct: 80,  disbursedPct: 60 },
  ],
  applicationStats: {
    total: 11,
    approved: 4,
    avgScore: 82,
  },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ImpactDashboardPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderModal, setOrderModal] = useState<OrderSuggestion | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setData(DEMO_DEMAND);
    setLoading(false);
  }, []);

  function openModal(type: "full" | "implant") {
    setOrderModal(type === "implant" ? IMPLANT_ORDER : FULL_ORDER);
  }

  function handleQueueOrder() {
    setOrderModal(null);
    setToast(true);
    setTimeout(() => setToast(false), 4000);
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-safe page-enter">
        <div>
          <div className="skeleton-bar h-2 w-16 mb-2" style={{ opacity: 0.4 }} />
          <div className="skeleton-bar h-6 w-44" style={{ opacity: 0.5 }} />
        </div>
        <div className="skeleton-card p-5" style={{ height: 200 }}>
          <div className="skeleton-bar h-2 w-28 mb-4" style={{ opacity: 0.4 }} />
          <div className="flex flex-col items-center gap-2">
            <div className="skeleton-circle w-20 h-20" />
            <div className="skeleton-bar h-2 w-16" style={{ opacity: 0.3 }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2].map(i => (
            <div key={i} className="skeleton-card p-4" style={{ height: 80 }}>
              <div className="skeleton-bar h-2 w-16 mb-2" style={{ opacity: 0.4 }} />
              <div className="skeleton-bar h-8 w-10 mx-auto" style={{ opacity: 0.5 }} />
            </div>
          ))}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton-card p-5" style={{ height: 140 }}>
            <div className="skeleton-bar h-2 w-24 mb-3" style={{ opacity: 0.4 }} />
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(j => (
                <div key={j} className="skeleton-bar h-16" style={{ opacity: 0.3, borderRadius: 14 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-critical">No data</p>
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

  const disbursedPct = summary.totalBudget > 0
    ? Math.round((summary.totalDisbursed / summary.totalBudget) * 100)
    : 0;

  const awardedPct = summary.totalBudget > 0
    ? Math.round((summary.totalAwardAmount / summary.totalBudget) * 100)
    : 0;

  return (
    <div className="space-y-4 pb-safe page-enter">

      {/* ── Success Toast ── */}
      {toast && (
        <div
          className="animate-in-1"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 14,
            background: "rgba(74, 140, 106, 0.1)",
            border: "1px solid rgba(74, 140, 106, 0.25)",
            boxShadow: "0 2px 12px rgba(74, 140, 106, 0.1)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#4a8c6a" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(30, 34, 53, 0.8)" }}>
            Order suggestion queued for clinic review.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="animate-in-1">
        <p className="text-eyebrow">PATTERSON SIGNALS</p>
        <h1 className="text-xl font-bold text-sovereign-charcoal font-display">Patterson Demand Signals</h1>
        <p className="text-[12px] text-sovereign-stone mt-0.5">AI-generated supply demand from chairside activity</p>
      </div>

      {/* ============ Estimated Order Value Card ============ */}
      <DynamicShadowCard intensity={2} className="animate-in-2">
        <Card variant="neu-raised">
          <CardContent className="p-5 pt-5 space-y-4">
            <div className="flex items-center gap-2 text-sovereign-stone">
              <Wallet className="w-4 h-4" />
              <span className="text-eyebrow">ESTIMATED ORDER VALUE</span>
            </div>

            {/* Value summary insets */}
            <div className="grid grid-cols-3 gap-2 text-center budget-grid-responsive">
              <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-2 sm:p-3">
                <p className="text-sovereign-charcoal" style={{ lineHeight: 1.2 }}>
                  <span className="mono-data" style={{ fontSize: "clamp(8px, 2vw, 12px)" }}>$</span>
                  <span className="stat-number" style={{ fontSize: "clamp(20px, 5vw, 36px)" }}>{formatDollarNum(summary.totalBudget)}</span>
                </p>
                <p className="text-[10px] text-sovereign-stone uppercase mt-1 leading-tight">Total Opportunity</p>
              </div>
              <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-2 sm:p-3">
                <p className="text-sovereign-gold" style={{ lineHeight: 1.2 }}>
                  <span className="mono-data" style={{ fontSize: "clamp(8px, 2vw, 12px)" }}>$</span>
                  <span className="stat-number" style={{ fontSize: "clamp(20px, 5vw, 36px)" }}>{formatDollarNum(summary.totalAwardAmount)}</span>
                </p>
                <p className="text-[10px] text-sovereign-stone uppercase mt-1 leading-tight">
                  <span className="sm:hidden">High Conf.</span>
                  <span className="hidden sm:inline">High Confidence</span>
                  {" "}Orders
                </p>
              </div>
              <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-2 sm:p-3">
                <p className="text-verified" style={{ lineHeight: 1.2 }}>
                  <span className="mono-data" style={{ fontSize: "clamp(8px, 2vw, 12px)" }}>$</span>
                  <span className="stat-number" style={{ fontSize: "clamp(20px, 5vw, 36px)" }}>{formatDollarNum(summary.totalDisbursed)}</span>
                </p>
                <p className="text-[10px] text-sovereign-stone uppercase mt-1 leading-tight">
                  <span className="sm:hidden">Reorders</span>
                  <span className="hidden sm:inline">Immediate Reorders</span>
                </p>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-3">
              <NeuProgress
                value={awardedPct}
                variant="gold"
                label="High Confidence Orders"
                showValue
                delay={200}
              />
              <NeuProgress
                value={disbursedPct}
                variant="green"
                label="Immediate Reorders"
                showValue
                delay={400}
              />
            </div>

            {/* Create Order Suggestion CTA */}
            <div className="pt-1 flex justify-end">
              <Button
                variant="neu-gold"
                size="sm"
                className="text-white font-semibold gap-2"
                onClick={() => openModal("full")}
              >
                <ShoppingCart className="w-4 h-4" />
                Create Order Suggestion
              </Button>
            </div>

          </CardContent>
        </Card>
      </DynamicShadowCard>

      {/* ============ Demand by Category Card ============ */}
      {programBreakdown.length > 0 && (
        <DynamicShadowCard intensity={2} className="neu-raised w-full p-5 space-y-3">
          <p className="label-style">Demand by Category</p>
          {programBreakdown.map((p, i) => (
            <div key={p.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sovereign-charcoal truncate mr-2">{p.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="mono-data">{formatDollar(p.budgetTotal)}</span>
                  {p.name === "Implant Cases" && (
                    <button
                      onClick={() => openModal("implant")}
                      className="cursor-pointer text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                      style={{
                        color: "rgba(92, 111, 181, 0.9)",
                        background: "rgba(92, 111, 181, 0.08)",
                        border: "1px solid rgba(92, 111, 181, 0.18)",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(92, 111, 181, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(92, 111, 181, 0.08)";
                      }}
                    >
                      Create Order
                    </button>
                  )}
                </div>
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
                  Allocated: {p.allocationPct}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-verified" />
                  Ordered: {p.disbursedPct}%
                </span>
              </div>
            </div>
          ))}
        </DynamicShadowCard>
      )}

      {/* ============ Signal Execution Status Card ============ */}
      <DynamicShadowCard intensity={2}>
        <Card variant="neu-raised">
          <CardContent className="p-5 pt-5 space-y-4">
            <div className="flex items-center gap-2 text-sovereign-stone">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-eyebrow">SIGNAL EXECUTION STATUS</span>
            </div>

            <NeuProgress
              value={milestoneStats.completionRate}
              variant="gold"
              label="Execution Rate"
              showValue
            />

            <div className="space-y-2">
              <MilestoneRow
                label="Orders Created"
                value={milestoneStats.verified}
                total={milestoneStats.total}
                variant="green"
              />
              <MilestoneRow
                label="Pending Orders"
                value={milestoneStats.evidenceSubmitted}
                total={milestoneStats.total}
                variant="amber"
              />
            </div>

            {/* Order Actions */}
            <div className="pt-3 border-t border-neu-dark/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sovereign-stone mb-2">Order Actions</p>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-2 sm:p-3 text-center">
                  <p className="font-sans font-extrabold text-verified" style={{ fontSize: "clamp(18px, 4vw, 26px)", lineHeight: 1 }}>{evidenceStats.approved}</p>
                  <p className="text-[9px] sm:text-[10px] text-sovereign-stone mt-1">Orders Generated</p>
                </div>
                <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-2 sm:p-3 text-center">
                  <p className="font-sans font-extrabold text-sovereign-gold" style={{ fontSize: "clamp(18px, 4vw, 26px)", lineHeight: 1 }}>{evidenceStats.pending}</p>
                  <p className="text-[9px] sm:text-[10px] text-sovereign-stone mt-1">Awaiting Review</p>
                </div>
                <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-2 sm:p-3 text-center">
                  <p className="font-sans font-extrabold text-critical" style={{ fontSize: "clamp(18px, 4vw, 26px)", lineHeight: 1 }}>{evidenceStats.rejected}</p>
                  <p className="text-[9px] sm:text-[10px] text-sovereign-stone mt-1">Low Priority Signals</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DynamicShadowCard>

      {/* ============ Top Demand Drivers Card ============ */}
      <DynamicShadowCard intensity={2}>
        <Card variant="neu-raised">
          <CardContent className="p-5 pt-5 space-y-3">
            <span className="text-eyebrow text-sovereign-stone">TOP DEMAND DRIVERS</span>

            {contractorPerformance.length === 0 ? (
              <p className="text-center text-sovereign-stone text-sm py-6">
                No demand data available yet.
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

                    {/* Score + signals */}
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
                          label={`Signals Generated: ${cp.milestonesCompleted}`}
                          size="sm"
                        />
                        <p className="text-[10px] font-mono text-sovereign-stone text-right">
                          {formatDollar(cp.awardAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DynamicShadowCard>

      {/* ============ Clinical-to-Order Conversion Card ============ */}
      <DynamicShadowCard intensity={2}>
        <Card variant="neu-raised">
          <CardContent className="p-5 pt-5 space-y-4">
            <span className="text-eyebrow text-sovereign-stone">CLINICAL-TO-ORDER CONVERSION</span>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-2 sm:p-3 text-center">
                <p className="font-sans font-extrabold text-sovereign-charcoal" style={{ fontSize: "clamp(20px, 5vw, 26px)", lineHeight: 1 }}>
                  {applicationStats.total}
                </p>
                <p className="text-[10px] text-sovereign-stone uppercase mt-1">Observations Captured</p>
              </div>
              <div className="bg-neu-dark rounded-[14px] shadow-neu-inset p-2 sm:p-3 text-center">
                <p className="font-sans font-extrabold text-verified" style={{ fontSize: "clamp(20px, 5vw, 26px)", lineHeight: 1 }}>
                  {applicationStats.approved}
                </p>
                <p className="text-[10px] text-sovereign-stone uppercase mt-1">Orders Generated</p>
              </div>
            </div>

            <NeuProgress
              value={
                applicationStats.total > 0
                  ? Math.round((applicationStats.approved / applicationStats.total) * 100)
                  : 0
              }
              variant="green"
              label="Conversion Rate"
              showValue
              delay={200}
            />
          </CardContent>
        </Card>
      </DynamicShadowCard>

      {/* ============ Order Suggestion Modal ============ */}
      {orderModal && (
        <Dialog open={!!orderModal} onOpenChange={() => setOrderModal(null)}>
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-neu-base border-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-sovereign-charcoal">
                {orderModal.title}
              </DialogTitle>
              <p className="text-[12px] text-sovereign-stone mt-0.5">
                {orderModal.subtitle}
              </p>
            </DialogHeader>

            <div className="space-y-4 mt-2 pb-2">

              {/* Metadata row */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Source", value: "IDENT.OS Demand Engine" },
                  { label: "Clinic", value: "Dr. Patel Dental Group" },
                  { label: "Confidence", value: "High" },
                  { label: "Timeframe", value: "Next 7 days" },
                ].map((m) => (
                  <div key={m.label} className="bg-neu-dark/40 rounded-xl p-2.5">
                    <p className="text-[9px] font-semibold tracking-widest uppercase text-sovereign-stone/50 mb-0.5">{m.label}</p>
                    <p className="text-[12px] font-semibold text-sovereign-charcoal leading-snug">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Section 1 — Demand Trigger */}
              <div className="bg-neu-dark/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "rgba(92, 111, 181, 0.65)" }} />
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-sovereign-stone/60">Demand Trigger</p>
                </div>
                <p className="text-[15px] font-semibold text-sovereign-charcoal mb-1">
                  5 implant-related opportunities detected from 11 chairside observations.
                </p>
                <p className="text-[13px] text-sovereign-charcoal/70 leading-relaxed">
                  Primary drivers: missing teeth, extraction follow-ups, implant consultations.
                </p>
              </div>

              {/* Section 2 — Recommended Patterson Order */}
              <div className="bg-neu-dark/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 shrink-0" style={{ color: "rgba(92, 111, 181, 0.65)" }} />
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-sovereign-stone/60">Recommended Patterson Order</p>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 mb-2 px-1">
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-sovereign-stone/40">Product</span>
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-sovereign-stone/40 text-right">Qty</span>
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-sovereign-stone/40 text-right">Value</span>
                </div>

                <div className="space-y-0">
                  {orderModal.items.map((item, i) => (
                    <div
                      key={item.product}
                      className="grid grid-cols-[1fr_auto_auto] gap-x-3 py-3 items-start"
                      style={{
                        borderBottom: i < orderModal.items.length - 1 ? "1px solid rgba(30,34,53,0.06)" : "none",
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-sovereign-charcoal leading-snug">{item.product}</p>
                        <p className="text-[11px] text-sovereign-stone/65 mt-0.5 leading-snug">{item.reason}</p>
                      </div>
                      <span className="text-[12px] font-mono text-sovereign-charcoal/70 text-right shrink-0 mt-0.5">{item.qty}</span>
                      <span className="text-[13px] font-mono font-semibold text-sovereign-charcoal text-right shrink-0 mt-0.5">${item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div
                  className="flex items-center justify-between pt-3 mt-1"
                  style={{ borderTop: "1px solid rgba(30,34,53,0.1)" }}
                >
                  <span className="text-[12px] font-bold tracking-wider uppercase text-sovereign-charcoal/60">Total</span>
                  <span className="text-[18px] font-bold font-mono text-sovereign-charcoal">${orderModal.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Section 3 — AI Reasoning */}
              <div className="bg-neu-dark/40 rounded-2xl p-4">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-sovereign-stone/60 mb-3">Why IDENT.OS recommends this order</p>
                <ul className="space-y-2">
                  {[
                    "Implant cases are driving the highest projected supply demand",
                    "Bone graft and membrane usage is likely within the next 7 days",
                    "Composite demand was detected from restorative observations",
                    "Ordering now reduces stockout risk before scheduled treatment",
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "rgba(92, 111, 181, 0.5)" }}
                      />
                      <span className="text-[13px] text-sovereign-charcoal/80 leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 4 — Suggested Patterson Action */}
              <div className="bg-neu-dark/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 shrink-0" style={{ color: "rgba(92, 111, 181, 0.65)" }} />
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-sovereign-stone/60">Suggested Patterson Action</p>
                </div>
                <p className="text-[14px] font-semibold text-sovereign-charcoal mb-2">
                  Queue this as a Patterson order recommendation for clinic review.
                </p>
                <p className="text-[11px] text-sovereign-stone/55 italic">
                  No order is submitted automatically. Clinic approval required.
                </p>
              </div>

              {/* Footer buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="neu-outline"
                  size="sm"
                  onClick={() => setOrderModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="neu-outline"
                  size="sm"
                  onClick={() => setOrderModal(null)}
                >
                  Edit Quantities
                </Button>
                <Button
                  variant="neu-gold"
                  size="sm"
                  className="text-white font-semibold ml-auto"
                  onClick={handleQueueOrder}
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Queue Patterson Order
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

function formatDollar(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount}`;
}

function formatDollarNum(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return String(amount);
}
