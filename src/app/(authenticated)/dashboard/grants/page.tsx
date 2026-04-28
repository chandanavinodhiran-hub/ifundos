"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
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
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import DynamicShadowCard from "@/components/DynamicShadowCard";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface RecallPatient {
  id: string;
  patient: string;
  finding: string;
  secondary: string;
  aiPriority: number;
  recommendation: string;
  whyNow: string;
  estimatedValue: string;
  badge: string;
  urgency: "urgent" | "high" | "routine";
  supplySignal: string;
  showProbability?: string;
  valueContext: string;
}

/* ------------------------------------------------------------------ */
/* Static Demo Data                                                    */
/* ------------------------------------------------------------------ */

const DEMO_RECALLS: RecallPatient[] = [
  {
    id: "recall-1",
    patient: "Maria Lopez",
    finding: "Missing teeth #19, #30",
    secondary: "No pain reported",
    aiPriority: 91,
    recommendation: "Schedule implant consultation",
    whyNow: "Delay reduces implant success probability",
    estimatedValue: "$4,000–$6,000",
    badge: "HIGH VALUE",
    urgency: "high",
    supplySignal: "Likely supply demand: Bone graft + membrane",
    valueContext: "Implant case opportunity",
  },
  {
    id: "recall-2",
    patient: "James Carter",
    finding: "Severe pain — tooth #14",
    secondary: "Prior root canal history",
    aiPriority: 88,
    recommendation: "Urgent endo consult",
    whyNow: "Pain-driven case — high show probability",
    estimatedValue: "$1,200–$2,500",
    badge: "URGENT",
    urgency: "urgent",
    supplySignal: "Likely supply demand: Endo kit + anesthetic",
    showProbability: "High show probability (pain-driven)",
    valueContext: "Urgent endo case",
  },
  {
    id: "recall-3",
    patient: "Ava Singh",
    finding: "Ortho recall — elastic change",
    secondary: "Assistant-driven visit",
    aiPriority: 87,
    recommendation: "Routine ortho visit",
    whyNow: "Recurring revenue",
    estimatedValue: "$300+",
    badge: "RECURRING",
    urgency: "routine",
    supplySignal: "Likely supply demand: Elastics + ortho supplies",
    valueContext: "Recurring ortho revenue",
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function accentBarClass(urgency: RecallPatient["urgency"]): string {
  if (urgency === "urgent") return "accent-left-critical";
  if (urgency === "high") return "accent-left-amber";
  return "";
}

function badgeVariant(badge: string): "neu-critical" | "neu-gold" | "neu-verified" | "neu" {
  if (badge === "URGENT") return "neu-critical";
  if (badge === "HIGH VALUE") return "neu-gold";
  if (badge === "RECURRING") return "neu-verified";
  return "neu";
}

function priorityVariant(score: number): "gold" | "green" | "amber" | "critical" {
  if (score >= 85) return "gold";
  if (score >= 70) return "green";
  if (score >= 50) return "amber";
  return "critical";
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function RecallEnginePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" /></div>}>
      <RecallEngineInner />
    </Suspense>
  );
}

function RecallEngineInner() {
  const router = useRouter();
  const [selectedRecall, setSelectedRecall] = useState<RecallPatient | null>(null);

  return (
    <div className="space-y-6 pb-safe page-enter">
      {/* ── Page Header ── */}
      <div className="animate-in-1">
        <p className="text-eyebrow">RECALL ENGINE</p>
        <h1 className="text-xl font-bold text-sovereign-charcoal mt-1">
          AI-Prioritized Patient Recall
        </h1>
        <p className="text-[12px] text-sovereign-stone mt-0.5">
          Who to bring back, when, and why
        </p>
      </div>

      {/* ── 3 Compact Stat Wells ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-in-2">
        {/* Patients to Recall */}
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-3 sm:p-6 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 300, color: "#2C3044" }}>
            <AnimatedCounter end={11} duration={1000} />
          </span>
          <span className="label-style mt-1 text-center leading-tight">Patients to Recall</span>
          <span className="text-[9px] text-sovereign-stone mt-0.5">This week</span>
        </DynamicShadowCard>

        {/* High Value Opportunities */}
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-3 sm:p-6 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 300, color: "#2C3044" }}>
            <AnimatedCounter end={6} duration={1000} />
          </span>
          <span className="label-style mt-1 text-center leading-tight">High Value</span>
          <span className="text-[9px] text-sovereign-stone mt-0.5">Implant / Crown / Endo</span>
        </DynamicShadowCard>

        {/* Expected Recall Revenue */}
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-3 sm:p-6 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(18px, 4.5vw, 28px)", fontWeight: 300, color: "#2C3044" }}>
            $<AnimatedCounter end={18500} duration={1200} />
          </span>
          <span className="label-style mt-1 text-center leading-tight">Expected Recall Revenue</span>
          <span className="text-[9px] text-sovereign-stone mt-0.5">Next 7 Days</span>
        </DynamicShadowCard>
      </div>

      {/* ── Recall Cards — extra top margin for clear visual separation ── */}
      <div className="space-y-3 stagger-children animate-in-3" style={{ marginTop: 32 }}>
        {DEMO_RECALLS.map((recall) => (
          <DynamicShadowCard
            key={recall.id}
            intensity={2}
            onClick={() => setSelectedRecall(recall)}
            className={`relative w-full text-left bg-neu-base rounded-[18px] shadow-neu-raised neu-press p-4 ${accentBarClass(recall.urgency)} transition-shadow cursor-pointer`}
          >
            {/* Top row: patient name + badge */}
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-sovereign-charcoal truncate leading-snug">
                  {recall.patient}
                </p>
                <p className="text-xs text-sovereign-stone truncate mt-0.5 italic">
                  {recall.finding}
                </p>
                <p className="text-xs text-sovereign-stone/60 truncate mt-0.5 hidden sm:block">
                  {recall.secondary}
                </p>
              </div>
              <Badge variant={badgeVariant(recall.badge)} className="shrink-0 ml-3">
                {recall.badge}
              </Badge>
            </div>

            {/* AI Priority Score bar */}
            <NeuProgress
              value={recall.aiPriority}
              variant={priorityVariant(recall.aiPriority)}
              size="sm"
              showValue
              label="AI Priority Score"
              className="mb-1"
            />
            <p className="text-[10px] text-sovereign-stone/55 mb-3">High Value · Act Now</p>

            {/* Recall recommendation */}
            <p className="text-[12px] font-semibold text-sovereign-charcoal mb-1">
              {recall.recommendation}
            </p>

            {/* Why now + value row */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-sovereign-stone/70 flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                {recall.whyNow}
              </p>
              <span className="font-mono text-xs font-semibold text-sovereign-charcoal ml-2 shrink-0">
                {recall.estimatedValue}
              </span>
            </div>

            {/* Show probability signal (urgent cases only) */}
            {recall.showProbability && (
              <p className="text-[10px] text-sovereign-stone/55 mt-1">
                {recall.showProbability}
              </p>
            )}

            {/* Supply signal */}
            <p className="text-[10px] text-sovereign-stone/45 mt-1.5">
              {recall.supplySignal}
            </p>
          </DynamicShadowCard>
        ))}
      </div>

      {/* ── AI Insight Panel ── */}
      <div className="animate-in-4">
        <div style={{ height: 1, background: "rgba(30, 34, 53, 0.08)", marginBottom: 16 }} />
        <p
          className="mb-3"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: "uppercase" as const,
            color: "rgba(30, 34, 53, 0.5)",
          }}
        >
          AI INSIGHT
        </p>
        <DynamicShadowCard inset intensity={1} className="rounded-[18px] p-4">
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 32, height: 32, background: "rgba(92, 111, 181, 0.10)" }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: "rgba(92, 111, 181, 0.65)" }} />
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "rgba(30, 34, 53, 0.7)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Pain + implant cases drive majority of revenue.{" "}
              Prioritize these for immediate scheduling.
            </p>
          </div>
        </DynamicShadowCard>

        {/* Link to Pipeline */}
        <button
          onClick={() => router.push("/dashboard/applications")}
          className="mt-3 w-full text-center text-xs font-semibold cursor-pointer transition-colors"
          style={{ color: "var(--accent)", padding: "8px 0" }}
        >
          View Processing Pipeline <ArrowRight className="w-3 h-3 inline ml-1" style={{ verticalAlign: "middle" }} />
        </button>
      </div>

      {/* ── Recall Detail Dialog ── */}
      {selectedRecall && (
        <Dialog
          open={!!selectedRecall}
          onOpenChange={() => setSelectedRecall(null)}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-neu-base border-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-sovereign-charcoal">
                {selectedRecall.patient}
              </DialogTitle>
              <p className="text-[11px] text-sovereign-stone mt-0.5">
                Source: Chairside Voice Capture
              </p>
            </DialogHeader>

            <div className="space-y-6 mt-4 pb-safe">
              {/* Info tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <InfoTile label="Finding" value={selectedRecall.finding} />
                <InfoTile label="Status" value={selectedRecall.secondary} />
                <InfoTile label="AI Priority" value={`${selectedRecall.aiPriority}`} mono />
                <InfoTile label="Estimated Value" value={selectedRecall.estimatedValue} mono />
                <InfoTile label="Case Type" value={selectedRecall.valueContext} />
                <InfoTile label="Urgency" value={selectedRecall.urgency.toUpperCase()} />
              </div>

              {/* Recall Recommendation */}
              <div className="bg-neu-dark/40 rounded-2xl p-4">
                <p className="text-[10px] font-medium tracking-widest uppercase text-sovereign-stone/60 mb-2">Recall Recommendation</p>
                <p className="text-[15px] font-semibold text-sovereign-charcoal">
                  {selectedRecall.recommendation}
                </p>
              </div>

              {/* Why Now */}
              <div className="bg-neu-dark/40 rounded-2xl p-4">
                <p className="text-[10px] font-medium tracking-widest uppercase text-sovereign-stone/60 mb-2">Why Now</p>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 shrink-0 text-sovereign-stone mt-0.5" />
                  <p className="text-[14px] text-sovereign-charcoal/85 leading-relaxed">
                    {selectedRecall.whyNow}
                  </p>
                </div>
              </div>

              {/* Priority Bar */}
              <div className="bg-neu-dark/40 rounded-2xl p-4">
                <p className="text-[10px] font-medium tracking-widest uppercase text-sovereign-stone/60 mb-3">AI Priority Score</p>
                <NeuProgress
                  value={selectedRecall.aiPriority}
                  variant={priorityVariant(selectedRecall.aiPriority)}
                  label={`${selectedRecall.aiPriority}`}
                  showValue
                />
                <p className="text-[11px] text-sovereign-stone/50 mt-2">High Value · Act Now</p>
              </div>

              {/* Completion indicator */}
              <div className="flex items-center gap-3 p-4 bg-neu-dark/40 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-verified shrink-0" />
                <p className="text-[14px] font-medium text-sovereign-charcoal">
                  AI recall queued — ready to schedule
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="neu-gold"
                  size="sm"
                  className="text-white font-semibold"
                  onClick={() => setSelectedRecall(null)}
                >
                  Schedule Recall
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="neu-outline"
                  size="sm"
                  onClick={() => setSelectedRecall(null)}
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
/* Sub-components                                                      */
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
    <div className="neu-info-tile rounded-xl p-3">
      <p className="text-[10px] font-medium tracking-widest uppercase text-sovereign-stone/60">{label}</p>
      <p
        className={`text-[14px] font-semibold text-sovereign-charcoal mt-1 truncate ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
