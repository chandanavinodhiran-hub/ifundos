"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

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

/* ---------- step config ---------- */
const STEPS = [
  { key: "intake", label: "Document intake" },
  { key: "procurement", label: "Procurement integrity" },
  { key: "vision", label: "Vision alignment" },
  { key: "viability", label: "Scientific viability" },
  { key: "impact", label: "Impact potential" },
  { key: "composite", label: "Composite scoring" },
  { key: "brief", label: "Generating brief" },
];

const STAGE_LABELS = [
  "Document Intake",
  "Procurement Compliance",
  "Vision & Approach",
  "Scientific Viability",
  "Impact Assessment",
  "Composite Scoring",
  "AI Verdict",
];

const STEP_DURATIONS = [1200, 1800, 1600, 2000, 1800, 1400, 1000];

/* ---------- component ---------- */
export function AIScreeningModal({ open, onClose, application }: AIScreeningModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(7).fill(false));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [frozen, setFrozen] = useState(false);

  // Elapsed timer
  useEffect(() => {
    if (!open || frozen) return;
    const t0 = Date.now();
    const interval = setInterval(() => setElapsedMs(Date.now() - t0), 100);
    return () => clearInterval(interval);
  }, [open, frozen]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setCompletedSteps(new Array(7).fill(false));
      setElapsedMs(0);
      setFrozen(false);
    }
  }, [open]);

  // Auto-advance steps
  useEffect(() => {
    if (!open || frozen || currentStep >= 7) return;

    const timer = setTimeout(() => {
      setCompletedSteps((prev) => {
        const next = [...prev];
        next[currentStep] = true;
        return next;
      });
      if (currentStep < 6) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setFrozen(true);
      }
    }, STEP_DURATIONS[currentStep]);

    return () => clearTimeout(timer);
  }, [open, currentStep, frozen]);

  const handleViewResults = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open || !application) return null;

  const app = application;
  const scores = app.dimensionScores;
  const allDone = completedSteps.every(Boolean);
  const progressPct = (completedSteps.filter(Boolean).length / 7) * 100;

  function getStepScore(idx: number): number | null {
    if (idx === 1) return scores.procurement;
    if (idx === 2) return scores.vision;
    if (idx === 3) return scores.viability;
    if (idx === 4) return scores.impact;
    if (idx === 5) return app.compositeScore;
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "rgba(30, 34, 53, 0.6)", backdropFilter: "blur(8px)", zIndex: 200 }}
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "calc(100% - 48px)",
          maxWidth: 360,
          background: "#F0F2F8",
          borderRadius: 24,
          boxShadow:
            "8px 8px 24px rgba(155,161,180,0.4), -8px -8px 24px rgba(255,255,255,0.7), 0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "22px 24px" }}
        >
          <div className="flex items-center gap-3">
            {/* Gold orb in inset well */}
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "#E6E9EF",
                boxShadow:
                  "inset 3px 3px 8px rgba(155,161,180,0.4), inset -3px -3px 8px rgba(255,255,255,0.6)",
              }}
            >
              <div
                className={allDone ? "animate-gold-pulse" : "animate-ember"}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #7B8DC8, #5C6FB5)",
                  boxShadow: "0 0 10px rgba(92,111,181,0.5)",
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1E2235",
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.3,
                }}
              >
                AI Screening — Live
              </p>
              <p style={{ fontSize: 12, color: "#9CA0B0", lineHeight: 1.3 }}>
                {app.orgName} · {app.rfpTitle}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="cursor-pointer shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#E6E9EF",
              boxShadow:
                "3px 3px 8px rgba(155,161,180,0.4), -3px -3px 8px rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
            }}
          >
            <X style={{ width: 14, height: 14, color: "#9CA0B0" }} />
          </button>
        </div>

        {/* ── Dark Embedded Screen ── */}
        <div
          style={{
            margin: "0 20px",
            background: "#1E2235",
            borderRadius: 16,
            padding: 20,
            boxShadow:
              "inset 3px 3px 10px rgba(0,0,0,0.4), inset -2px -2px 8px rgba(40,45,70,0.3)",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "#9CA0B0",
            lineHeight: 1.7,
            minHeight: 180,
          }}
        >
          {/* Stage label inside screen */}
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#5C6FB5",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Stage {Math.min(currentStep + 1, 7)}/7:{" "}
            {STAGE_LABELS[Math.min(currentStep, 6)]}
          </p>

          {/* Processing steps */}
          {STEPS.map((step, i) => {
            const isDone = completedSteps[i];
            const isCurrent = i === currentStep && !allDone;
            const score = getStepScore(i);

            return (
              <div
                key={step.key}
                className="flex items-center"
                style={{ height: 24, gap: 8 }}
              >
                {/* Status dot */}
                {isDone ? (
                  <span style={{ color: "#3D8B5E", fontSize: 10, width: 12, textAlign: "center" }}>●</span>
                ) : isCurrent ? (
                  <span
                    className="animate-ember"
                    style={{ color: "#5C6FB5", fontSize: 10, width: 12, textAlign: "center" }}
                  >
                    ●
                  </span>
                ) : (
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, width: 12, textAlign: "center" }}>○</span>
                )}

                {/* Label */}
                <span
                  style={{
                    flex: 1,
                    color: isDone ? "#9CA0B0" : isCurrent ? "#E8EBF5" : "rgba(255,255,255,0.3)",
                    fontWeight: isCurrent ? 500 : 400,
                  }}
                >
                  {step.label}
                </span>

                {/* Right side: check + score, or processing */}
                {isDone && (
                  <span className="flex items-center" style={{ gap: 8 }}>
                    <span style={{ color: "#3D8B5E" }}>✓</span>
                    {score != null && (
                      <span style={{ color: "#E8EBF5", fontWeight: 500, minWidth: 20, textAlign: "right" }}>
                        {Math.round(score)}
                      </span>
                    )}
                  </span>
                )}
                {isCurrent && (
                  <span
                    className="animate-pulse"
                    style={{ color: "#5C6FB5", fontSize: 10 }}
                  >
                    processing
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Progress Bar ── */}
        <div
          style={{
            margin: "16px 20px",
            height: 6,
            borderRadius: 3,
            background: "#E6E9EF",
            boxShadow:
              "inset 3px 3px 8px rgba(155,161,180,0.4), inset -3px -3px 8px rgba(255,255,255,0.7)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 3,
              background: "linear-gradient(135deg, #5C6FB5, #7B8DC8)",
              boxShadow: allDone
                ? "0 0 12px rgba(92,111,181,0.5)"
                : "0 0 8px rgba(92,111,181,0.35)",
              width: `${progressPct}%`,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* ── Footer — Timing Comparison ── */}
        <div
          style={{
            padding: "16px 24px 22px",
            display: "flex",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {[
            { label: "Elapsed", value: `${(elapsedMs / 1000).toFixed(1)}s`, color: "#5C6FB5", strike: false },
            { label: "AI avg", value: "~45s", color: "#9CA0B0", strike: false },
            { label: "Manual", value: "~3 days", color: "#C47F3A", strike: true },
          ].map((metric) => (
            <div
              key={metric.label}
              className="text-center flex-1"
              style={{
                background: "#E6E9EF",
                borderRadius: 12,
                padding: "8px 10px",
                boxShadow:
                  "inset 2px 2px 5px rgba(155,161,180,0.4), inset -2px -2px 5px rgba(255,255,255,0.5)",
              }}
            >
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: metric.color,
                  textDecoration: metric.strike ? "line-through" : "none",
                  lineHeight: 1.3,
                }}
              >
                {metric.value}
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: "#9CA0B0",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Completion State — View Results ── */}
        {allDone && (
          <div style={{ padding: "0 24px 22px" }}>
            <button
              onClick={handleViewResults}
              className="cursor-pointer w-full transition-transform active:scale-[0.97]"
              style={{
                background: "#1E2235",
                color: "#E8EBF5",
                borderRadius: 14,
                padding: "14px 0",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow:
                  "4px 4px 12px rgba(155,161,180,0.4), -4px -4px 12px rgba(255,255,255,0.6)",
                border: "none",
                letterSpacing: "0.3px",
              }}
            >
              View Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
