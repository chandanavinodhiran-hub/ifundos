"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock } from "lucide-react";

interface AppInfo {
  id: string;
  status: string;
  proposedBudget: number;
  createdAt: string;
  rfp: { title: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Submitted", color: "rgba(30, 34, 53, 0.45)" },
  SCORING: { label: "AI Scoring", color: "rgba(75, 165, 195, 0.7)" },
  IN_REVIEW: { label: "In Review", color: "rgba(75, 165, 195, 0.7)" },
  SHORTLISTED: { label: "Shortlisted", color: "rgba(74, 140, 106, 0.7)" },
  QUESTIONNAIRE_PENDING: { label: "Questionnaire Pending", color: "rgba(75, 165, 195, 0.7)" },
  QUESTIONNAIRE_SUBMITTED: { label: "Questionnaire Submitted", color: "rgba(74, 140, 106, 0.7)" },
  APPROVED: { label: "Approved", color: "#4a7c59" },
  AWARDED: { label: "Awarded", color: "#4a7c59" },
};

function formatSAR(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

export default function ContractsPage() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.applications && Array.isArray(data.applications)) {
          setApps(data.applications.filter(
            (a: AppInfo) => a.status === "APPROVED" || a.status === "AWARDED"
          ));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(75, 165, 195, 0.7)" }} />
      </div>
    );
  }

  const hasContracts = apps.length > 0;

  return (
    <div className="space-y-5 contractor-page-scroll">
      {/* Header */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "rgba(30, 34, 53, 0.4)" }}
        >
          CONTRACTS
        </p>
        <h1 className="text-[22px] font-extrabold text-sovereign-charcoal mt-1">
          Contracts
        </h1>
        <p className="text-[13px] text-sovereign-stone mt-0.5">
          Active work and milestone delivery
        </p>
      </div>

      {hasContracts ? (
        <div className="space-y-3">
          {apps.map((app) => {
            const statusInfo = STATUS_LABELS[app.status] || { label: app.status, color: "#7a7265" };
            return (
              <Card key={app.id} variant="neu-raised" className="p-4 accent-left-green">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-sovereign-charcoal leading-snug">
                      {app.rfp.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="neu-gold">{statusInfo.label}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[18px] font-mono font-bold" style={{ color: "rgba(75, 165, 195, 0.8)" }}>
                      {formatSAR(app.proposedBudget)}
                    </p>
                    <p className="text-[10px] text-sovereign-stone uppercase">SAR</p>
                  </div>
                </div>

                {/* Milestone placeholder */}
                <div className="mt-4">
                  <Card variant="neu-inset" className="p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#4a7c59" }} />
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-sovereign-charcoal">Contract awarded</p>
                        <p className="text-[11px] text-sovereign-stone">Milestones will appear once the fund manager sets them up</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <ContractsEmptyState />
      )}

      {/* Pipeline info — show non-approved apps */}
      {!hasContracts && (
        <PipelineStatus />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Seed illustration for empty contracts state                         */
/* ------------------------------------------------------------------ */

function drawSeedSapling(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const W = 48, H = 48;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.scale(dpr, dpr);

  const cx = W / 2;

  /* Ground shadow */
  const sg = ctx.createRadialGradient(cx, 40, 0, cx, 40, 12);
  sg.addColorStop(0, "rgba(40, 80, 45, 0.06)");
  sg.addColorStop(1, "rgba(40, 80, 45, 0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(cx, 40, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  /* Seed body — rounder, dormant */
  ctx.beginPath();
  ctx.ellipse(cx, 34, 7, 5.5, 0, 0, Math.PI * 2);
  const sd = ctx.createRadialGradient(cx - 2, 32, 0, cx, 34, 7);
  sd.addColorStop(0, "rgba(130, 175, 135, 0.7)");
  sd.addColorStop(0.5, "rgba(100, 155, 105, 0.65)");
  sd.addColorStop(1, "rgba(65, 120, 70, 0.7)");
  ctx.fillStyle = sd;
  ctx.fill();
  ctx.strokeStyle = "rgba(40, 95, 50, 0.15)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  /* Tiny sprout — just a stub emerging */
  ctx.beginPath();
  ctx.moveTo(cx - 0.3, 29);
  ctx.bezierCurveTo(cx - 0.5, 26, cx + 0.5, 23, cx + 0.2, 20);
  ctx.lineTo(cx + 0.7, 20);
  ctx.bezierCurveTo(cx + 1, 23, cx - 0.2, 26, cx + 0.3, 29);
  ctx.closePath();
  const stg = ctx.createLinearGradient(0, 29, 0, 20);
  stg.addColorStop(0, "rgba(75, 145, 80, 0.6)");
  stg.addColorStop(1, "rgba(95, 170, 100, 0.7)");
  ctx.fillStyle = stg;
  ctx.fill();

  /* One tiny leaf bud */
  ctx.save();
  ctx.translate(cx + 0.3, 21);
  ctx.rotate(0.4);
  ctx.beginPath();
  ctx.ellipse(2.5, -1.5, 3, 1.5, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(80, 160, 90, 0.55)";
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Empty State                                                         */
/* ------------------------------------------------------------------ */

function ContractsEmptyState() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawn = useRef(false);

  useEffect(() => {
    if (canvasRef.current && !drawn.current) {
      drawSeedSapling(canvasRef.current);
      drawn.current = true;
    }
  });

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          background: "rgba(74, 140, 106, 0.08)",
        }}
      >
        <div className="sapling-bob">
          <div className="sapling-stem-flex">
            <canvas ref={canvasRef} style={{ display: "block", pointerEvents: "none" }} />
          </div>
        </div>
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 400,
          color: "rgba(30, 34, 53, 0.7)",
          marginBottom: 4,
        }}
      >
        No contracts yet
      </h3>
      <p
        style={{
          fontSize: 14,
          fontWeight: 400,
          color: "rgba(30, 34, 53, 0.4)",
          maxWidth: 320,
        }}
      >
        When your application is approved, your contract with milestone schedule will appear here.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline Status                                                     */
/* ------------------------------------------------------------------ */

function PipelineStatus() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.applications && Array.isArray(data.applications)) {
          setApps(data.applications.filter(
            (a: AppInfo) => !["DRAFT", "REJECTED", "APPROVED", "AWARDED"].includes(a.status)
          ));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || apps.length === 0) return null;

  return (
    <div className="space-y-2">
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 2.5,
          color: "rgba(30, 34, 53, 0.4)",
          textTransform: "uppercase",
        }}
      >
        In the pipeline
      </p>
      {apps.slice(0, 3).map((app) => {
        const statusInfo = STATUS_LABELS[app.status] || { label: app.status, color: "#7a7265" };
        return (
          <Card
            key={app.id}
            variant="neu-inset"
            className="p-3"
            style={{ borderLeft: "3px solid rgba(75, 165, 195, 0.25)" }}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 shrink-0" style={{ color: statusInfo.color }} />
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 16, fontWeight: 400, color: "rgba(30, 34, 53, 0.75)" }}>{app.rfp.title}</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: statusInfo.color }}>{statusInfo.label}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
