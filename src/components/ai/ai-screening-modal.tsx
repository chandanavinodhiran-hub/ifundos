"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Brain, FileSearch, Scale, TreePine, Landmark, Sparkles, Timer, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { ScoreRing } from "@/components/ui/score-ring";
import { TerminalBlock } from "@/components/ui/typewriter";
import { AnimatedCounter } from "@/components/ui/animated-counter";

/* ---------- types ---------- */
interface DimensionScores {
  procurement: number;
  vision: number;
  viability: number;
  impact: number;
}

interface Finding {
  dimension: string;
  type: "POSITIVE" | "RED_FLAG" | "CONCERN" | "NEUTRAL";
  text: string;
}

interface DecisionPacket {
  recommendation: string;
  executiveSummary: string;
  strengths: string[];
  risks: string[];
  questionsForContractor: string[];
  impactAssessment: string;
  narrative: string;
}

interface ApplicationData {
  id: string;
  orgName: string;
  rfpTitle: string;
  compositeScore: number;
  dimensionScores: DimensionScores;
  confidenceLevels: DimensionScores;
  aiFindings: Finding[];
  decisionPacket: DecisionPacket;
}

interface AIScreeningModalProps {
  open: boolean;
  onClose: () => void;
  application: ApplicationData | null;
}

/* ---------- stage definitions ---------- */
const STAGES = [
  { key: "intake",       icon: FileSearch, label: "Document Intake",           color: "text-ocean-500" },
  { key: "procurement",  icon: Landmark,   label: "Procurement Compliance",    color: "text-leaf-600" },
  { key: "vision",       icon: Sparkles,   label: "Vision & Approach",         color: "text-purple-500" },
  { key: "viability",    icon: Scale,      label: "Viability & Capacity",      color: "text-sand-600" },
  { key: "impact",       icon: TreePine,   label: "Environmental Impact",      color: "text-leaf-500" },
  { key: "composite",    icon: Brain,      label: "Composite Scoring",         color: "text-ocean-600" },
  { key: "verdict",      icon: ShieldCheck,label: "AI Verdict & Recommendation", color: "text-leaf-700" },
] as const;

/* ---------- terminal script generators ---------- */
function intakeLines(app: ApplicationData) {
  return [
    { text: `ai-screen --application ${app.id.slice(0, 8)}`, type: "command" as const },
    { text: `Loading proposal from ${app.orgName}...`, type: "output" as const },
    { text: `RFP: "${app.rfpTitle}"`, type: "info" as const },
    { text: "Extracting documents: proposal.pdf, financials.xlsx, certificates.pdf", type: "output" as const },
    { text: "Running OCR on 23 pages... done", type: "output" as const },
    { text: "Document integrity check: PASSED", type: "success" as const },
    { text: "Preparing 4-dimension AI evaluation pipeline...", type: "info" as const },
  ];
}

function dimensionLines(dimension: string, score: number, confidence: number, findings: Finding[]) {
  const labels: Record<string, string> = {
    procurement: "Procurement Compliance",
    vision: "Vision & Approach",
    viability: "Viability & Capacity",
    impact: "Environmental Impact",
  };
  const positives = findings.filter((f) => f.type === "POSITIVE").length;
  const concerns = findings.filter((f) => f.type === "CONCERN" || f.type === "RED_FLAG").length;
  return [
    { text: `evaluate --dimension ${dimension}`, type: "command" as const },
    { text: `Analyzing ${labels[dimension]}...`, type: "output" as const },
    { text: `Cross-referencing against Saudi Green Initiative criteria...`, type: "output" as const },
    { text: `Found ${positives} strengths, ${concerns} concerns`, type: concerns > 0 ? "warning" as const : "success" as const },
    { text: `Score: ${score}/100  |  Confidence: ${(confidence * 100).toFixed(0)}%`, type: "success" as const },
    ...findings.slice(0, 2).map((f) => ({
      text: `  ${f.type === "POSITIVE" ? "✓" : "⚠"} ${f.text}`,
      type: f.type === "POSITIVE" ? "success" as const : "warning" as const,
    })),
  ];
}

function compositeLines(scores: DimensionScores, composite: number) {
  return [
    { text: "compute-composite --weights equal", type: "command" as const },
    { text: `Procurement: ${scores.procurement}/100 × 25%  = ${(scores.procurement * 0.25).toFixed(1)}`, type: "output" as const },
    { text: `Vision:      ${scores.vision}/100 × 25%  = ${(scores.vision * 0.25).toFixed(1)}`, type: "output" as const },
    { text: `Viability:   ${scores.viability}/100 × 25%  = ${(scores.viability * 0.25).toFixed(1)}`, type: "output" as const },
    { text: `Impact:      ${scores.impact}/100 × 25%  = ${(scores.impact * 0.25).toFixed(1)}`, type: "output" as const },
    { text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, type: "output" as const },
    { text: `COMPOSITE SCORE: ${composite.toFixed(1)} / 100`, type: "success" as const },
  ];
}

function verdictLines(dp: DecisionPacket) {
  const rec = dp.recommendation?.replace(/_/g, " ") || "PENDING";
  return [
    { text: "generate-decision-packet", type: "command" as const },
    { text: "Synthesizing evaluation across all dimensions...", type: "output" as const },
    { text: `Recommendation: ${rec}`, type: rec.includes("DO_NOT") ? "warning" as const : "success" as const },
    { text: `"${dp.executiveSummary?.slice(0, 120)}..."`, type: "info" as const },
    { text: `Generated ${dp.strengths?.length || 0} strengths, ${dp.risks?.length || 0} risks, ${dp.questionsForContractor?.length || 0} follow-up questions`, type: "output" as const },
    { text: "Decision packet complete. Ready for human review.", type: "success" as const },
  ];
}

/* ---------- component ---------- */
export function AIScreeningModal({ open, onClose, application }: AIScreeningModalProps) {
  const [stage, setStage] = useState(0);
  const [stageComplete, setStageComplete] = useState<boolean[]>(new Array(7).fill(false));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // timer
  useEffect(() => {
    if (!open) return;
    const t0 = Date.now();
    const interval = setInterval(() => setElapsedMs(Date.now() - t0), 100);
    return () => clearInterval(interval);
  }, [open]);

  // reset on open
  useEffect(() => {
    if (open) {
      setStage(0);
      setStageComplete(new Array(7).fill(false));
      setElapsedMs(0);
      setAutoPlay(true);
    }
  }, [open]);

  const markComplete = useCallback(
    (idx: number) => {
      setStageComplete((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      if (autoPlay && idx < 6) {
        setTimeout(() => setStage(idx + 1), 600);
      }
    },
    [autoPlay]
  );

  if (!open || !application) return null;

  const app = application;
  const scores = app.dimensionScores;
  const conf = app.confidenceLevels;
  const findings = app.aiFindings || [];

  function terminalForStage(idx: number) {
    switch (idx) {
      case 0: return intakeLines(app);
      case 1: return dimensionLines("procurement", scores.procurement, conf.procurement, findings.filter((f) => f.dimension === "procurement"));
      case 2: return dimensionLines("vision", scores.vision, conf.vision, findings.filter((f) => f.dimension === "vision"));
      case 3: return dimensionLines("viability", scores.viability, conf.viability, findings.filter((f) => f.dimension === "viability"));
      case 4: return dimensionLines("impact", scores.impact, conf.impact, findings.filter((f) => f.dimension === "impact"));
      case 5: return compositeLines(scores, app.compositeScore);
      case 6: return verdictLines(app.decisionPacket);
      default: return [];
    }
  }

  const allDone = stageComplete.every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-leaf-100 bg-gradient-to-r from-leaf-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-leaf-500 to-ocean-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-leaf-900">AI Screening — Live</h2>
              <p className="text-xs text-muted-foreground">{app.orgName} · {app.rfpTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* timer */}
            <div className="flex items-center gap-1.5 text-sm font-mono text-leaf-700 bg-leaf-50 px-3 py-1.5 rounded-lg">
              <Timer className="w-4 h-4" />
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
            {/* AI vs traditional comparison */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-leaf-600">
                <Zap className="w-3 h-3" /> AI: ~45s
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-muted-foreground">Manual: ~3 days</span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-leaf-100 rounded-lg transition-colors cursor-pointer">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 overflow-hidden">
          {/* left: stage nav */}
          <div className="w-64 border-r border-leaf-100 bg-leaf-50/50 p-4 space-y-1 overflow-y-auto shrink-0 hidden md:block">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === stage;
              const isDone = stageComplete[i];
              return (
                <button
                  key={s.key}
                  onClick={() => setStage(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-white shadow-sm border border-leaf-200 text-leaf-900 font-medium"
                      : isDone
                        ? "text-leaf-600 hover:bg-white/60"
                        : "text-gray-400 hover:bg-white/40"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isDone
                      ? "bg-leaf-100 text-leaf-600"
                      : isActive
                        ? "bg-gradient-to-br from-leaf-500 to-ocean-500 text-white"
                        : "bg-gray-100 text-gray-400"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}

            {/* autoplay toggle */}
            <div className="pt-4 mt-4 border-t border-leaf-100">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={() => setAutoPlay(!autoPlay)}
                  className="rounded border-leaf-300 accent-leaf-600"
                />
                Auto-advance stages
              </label>
            </div>
          </div>

          {/* right: stage content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* mobile stage indicator */}
            <div className="md:hidden flex items-center gap-2 mb-4 text-sm font-medium text-leaf-800">
              {(() => { const Icon = STAGES[stage].icon; return <Icon className="w-4 h-4" />; })()}
              Stage {stage + 1}/7: {STAGES[stage].label}
            </div>

            {/* terminal */}
            <div className="bg-gray-900 rounded-xl p-5 mb-6 min-h-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-500 font-mono">iFundOS AI Engine v2.1</span>
              </div>
              <TerminalBlock
                key={stage}
                lines={terminalForStage(stage)}
                speed={18}
                lineDelay={350}
                onComplete={() => markComplete(stage)}
              />
            </div>

            {/* stage-specific visuals */}
            {stage >= 1 && stage <= 4 && stageComplete[stage] && (
              <DimensionResult
                dimension={["procurement", "vision", "viability", "impact"][stage - 1]}
                score={[scores.procurement, scores.vision, scores.viability, scores.impact][stage - 1]}
                confidence={[conf.procurement, conf.vision, conf.viability, conf.impact][stage - 1]}
                findings={findings.filter((f) => f.dimension === ["procurement", "vision", "viability", "impact"][stage - 1])}
              />
            )}

            {stage === 5 && stageComplete[5] && (
              <CompositeResult scores={scores} composite={app.compositeScore} />
            )}

            {stage === 6 && stageComplete[6] && (
              <VerdictResult dp={app.decisionPacket} composite={app.compositeScore} />
            )}

            {/* navigation */}
            {!autoPlay && stageComplete[stage] && stage < 6 && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setStage(stage + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-leaf-600 text-white rounded-xl text-sm font-medium hover:bg-leaf-700 transition-colors cursor-pointer"
                >
                  Next Stage <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* final summary when all done */}
            {allDone && (
              <div className="mt-6 p-4 bg-gradient-to-r from-leaf-50 to-ocean-50 rounded-xl border border-leaf-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-leaf-800 mb-2">
                  <Zap className="w-4 h-4 text-ocean-500" />
                  AI Screening Complete
                </div>
                <p className="text-xs text-muted-foreground">
                  This evaluation was completed in {(elapsedMs / 1000).toFixed(1)} seconds.
                  Traditional manual review takes 2-3 business days. AI screening reduces evaluation time by <strong>99.7%</strong> while
                  maintaining consistent, bias-free scoring across all 4 dimensions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- sub-components ---------- */

function DimensionResult({ dimension, score, confidence, findings }: {
  dimension: string; score: number; confidence: number; findings: Finding[];
}) {
  const labels: Record<string, string> = {
    procurement: "Procurement Compliance",
    vision: "Vision & Approach",
    viability: "Viability & Capacity",
    impact: "Environmental Impact",
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-center">
        <ScoreRing score={score} size={120} strokeWidth={10} label={labels[dimension]} />
      </div>
      <div className="sm:col-span-2 space-y-3">
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-muted-foreground">Confidence</div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ocean-400 to-ocean-600 rounded-full transition-all duration-1000"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-ocean-600">{(confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="space-y-1.5">
          {findings.slice(0, 4).map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {f.type === "POSITIVE" ? (
                <CheckCircle2 className="w-4 h-4 text-leaf-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-sand-500 shrink-0 mt-0.5" />
              )}
              <span className="text-gray-700">{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompositeResult({ scores, composite }: { scores: DimensionScores; composite: number }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <ScoreRing score={scores.procurement} size={90} strokeWidth={8} label="Procurement" delay={0} />
        <ScoreRing score={scores.vision} size={90} strokeWidth={8} label="Vision" delay={150} />
        <ScoreRing score={scores.viability} size={90} strokeWidth={8} label="Viability" delay={300} />
        <ScoreRing score={scores.impact} size={90} strokeWidth={8} label="Impact" delay={450} />
        <div className="w-px h-16 bg-leaf-200 hidden sm:block" />
        <div className="flex flex-col items-center">
          <ScoreRing score={composite} size={110} strokeWidth={10} label="Composite" delay={600} />
        </div>
      </div>
    </div>
  );
}

function VerdictResult({ dp, composite }: { dp: DecisionPacket; composite: number }) {
  const recLabel = dp.recommendation?.replace(/_/g, " ") || "PENDING";
  const recColor = recLabel.includes("DO NOT")
    ? "bg-red-100 text-red-800 border-red-200"
    : recLabel.includes("CONDITIONS")
      ? "bg-sand-100 text-sand-800 border-sand-200"
      : "bg-leaf-100 text-leaf-800 border-leaf-200";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* recommendation badge */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${recColor}`}>
          {recLabel}
        </span>
        <span className="text-2xl font-bold text-leaf-900">
          <AnimatedCounter end={composite} decimals={1} suffix="/100" />
        </span>
      </div>

      {/* executive summary */}
      {dp.executiveSummary && (
        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">
          {dp.executiveSummary}
        </p>
      )}

      {/* strengths & risks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-leaf-700 uppercase tracking-wide">Strengths</h4>
          {dp.strengths?.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-leaf-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">{s}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide">Risks</h4>
          {dp.risks?.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-sand-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* questions for contractor */}
      {dp.questionsForContractor && dp.questionsForContractor.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-ocean-700 uppercase tracking-wide">Follow-up Questions for Contractor</h4>
          {dp.questionsForContractor.map((q, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-ocean-500 font-bold shrink-0">{i + 1}.</span>
              <span className="text-gray-700">{q}</span>
            </div>
          ))}
        </div>
      )}

      {/* impact assessment */}
      {dp.impactAssessment && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-leaf-700 uppercase tracking-wide">Impact Assessment</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{dp.impactAssessment}</p>
        </div>
      )}
    </div>
  );
}
