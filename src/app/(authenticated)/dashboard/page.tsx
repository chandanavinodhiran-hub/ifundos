"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Loader2,
  Briefcase,
  FileText,
  FolderKanban,
  Settings,
  UserPlus,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Program {
  id: string; name: string; budgetTotal: number; budgetAllocated: number; budgetDisbursed: number; status: string;
}

interface RecentEvent {
  id: string; action: string; resourceType: string; purpose: string | null; timestamp: string;
  actor: { name: string; role: string } | null;
}

interface RFPPipeline {
  id: string; title: string; status: string;
  applications: { status: string }[];
}

interface Stats {
  openRfps: number;
  applicationsInReview: number;
  activeGrants: number;
  totalDisbursed: number;
  atRiskProjects: number;
  programs: Program[];
  recentActivity: RecentEvent[];
  rfpPipelines?: RFPPipeline[];
}

/* ------------------------------------------------------------------ */
/* Action styling                                                      */
/* ------------------------------------------------------------------ */

const ACTION_COLORS: Record<string, { dot: string; bg: string }> = {
  USER_CREATED:          { dot: "bg-leaf-500",   bg: "bg-leaf-50" },
  PROGRAM_CREATED:       { dot: "bg-purple-500", bg: "bg-purple-50" },
  SETTINGS_UPDATED:      { dot: "bg-sand-500",   bg: "bg-sand-50" },
  REGISTRATION:          { dot: "bg-leaf-400",   bg: "bg-leaf-50" },
  APPLICATION_SUBMITTED: { dot: "bg-ocean-500",  bg: "bg-ocean-50" },
  APPLICATION_SCORED:    { dot: "bg-leaf-600",   bg: "bg-leaf-50" },
  RFP_CREATED:           { dot: "bg-purple-500", bg: "bg-purple-50" },
  RFP_PUBLISHED:         { dot: "bg-ocean-600",  bg: "bg-ocean-50" },
  AI_SCORING_COMPLETED:  { dot: "bg-leaf-600",   bg: "bg-leaf-50" },
  APPLICATION_SHORTLISTED: { dot: "bg-green-500", bg: "bg-green-50" },
  CONTRACT_AWARDED:      { dot: "bg-purple-600", bg: "bg-purple-50" },
  QUESTIONNAIRE_SENT:    { dot: "bg-indigo-500", bg: "bg-indigo-50" },
};

function getActionIcon(action: string) {
  if (action.includes("RFP")) return Briefcase;
  if (action.includes("APPLICATION")) return FileText;
  if (action.includes("CONTRACT") || action.includes("GRANT")) return FolderKanban;
  if (action.includes("SETTINGS") || action.includes("PROGRAM")) return Settings;
  if (action.includes("USER") || action.includes("REGISTRATION")) return UserPlus;
  return CheckCircle2;
}

/* ------------------------------------------------------------------ */
/* Pipeline steps                                                      */
/* ------------------------------------------------------------------ */

const PIPELINE_STEPS = [
  "Published",
  "Applications",
  "AI Scored",
  "Shortlisted",
  "Interview",
  "Selection",
  "Award",
];

function getPipelineStep(rfp: RFPPipeline): number {
  const apps = rfp.applications || [];
  if (rfp.status === "AWARDED") return 7;
  if (apps.some((a) => a.status === "APPROVED")) return 6;
  if (apps.some((a) => a.status === "QUESTIONNAIRE_SUBMITTED" || a.status === "QUESTIONNAIRE_PENDING")) return 5;
  if (apps.some((a) => a.status === "SHORTLISTED")) return 4;
  if (apps.some((a) => a.status === "IN_REVIEW" || a.status === "SCORING")) return 3;
  if (apps.length > 0) return 2;
  return 1;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function FundManagerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Portfolio Overview</h1>
            <p className="text-slate-400 text-sm mt-0.5">Saudi Environmental Fund</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <HeroAction label="Review Applications" href="/dashboard/applications" primary />
          <HeroAction label="Manage RFPs" href="/dashboard/rfps" />
          <HeroAction label="Grants & Contracts" href="/dashboard/grants" />
          <HeroAction label="Impact Dashboard" href="/dashboard/impact" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Open RFPs" value={stats.openRfps} desc="Accepting proposals" delay={0} borderColor="border-l-ocean-500" />
        <KPICard title="In Review" value={stats.applicationsInReview} desc="Awaiting fund manager decision" delay={100} borderColor="border-l-leaf-500" />
        <KPICard title="Active Grants" value={stats.activeGrants} desc="Contracts in progress" delay={200} borderColor="border-l-purple-500" />
        <KPICard title="Total Disbursed" value={stats.totalDisbursed} isCurrency desc="Funds released" delay={300} borderColor="border-l-sand-500" />
        <KPICard title="At Risk" value={stats.atRiskProjects} desc="Projects flagged" delay={400} alert={stats.atRiskProjects > 0} borderColor="border-l-red-500" />
      </div>

      {/* Programs Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Programs Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.programs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No programs created yet</p>
          ) : (
            <div className="space-y-5">
              {stats.programs.map((p) => {
                const allocPct = p.budgetTotal > 0 ? (p.budgetAllocated / p.budgetTotal) * 100 : 0;
                const disbPct = p.budgetTotal > 0 ? (p.budgetDisbursed / p.budgetTotal) * 100 : 0;
                const remainPct = Math.max(0, 100 - allocPct);
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{p.name}</p>
                        <Badge variant="outline" className={p.status === "ACTIVE" ? "bg-leaf-100 text-leaf-800 border-leaf-200" : "bg-gray-100 text-gray-800"}>
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">{formatSAR(p.budgetTotal)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Disbursed: {disbPct.toFixed(1)}%</span>
                        <span className="mx-1">|</span>
                        <span>Allocated: {allocPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="h-full flex">
                          <div className="bg-leaf-600 h-full transition-all duration-1000 rounded-l-full" style={{ width: `${disbPct}%` }} />
                          <div className="bg-ocean-500 h-full transition-all duration-1000" style={{ width: `${Math.max(0, allocPct - disbPct)}%` }} />
                          <div className="bg-gray-200 h-full" style={{ width: `${remainPct}%` }} />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-leaf-600" /> Disbursed ({formatSAR(p.budgetDisbursed)})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-ocean-500" /> Allocated ({formatSAR(p.budgetAllocated)})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-gray-200" /> Remaining
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stats.recentActivity.map((event) => {
                const cfg = ACTION_COLORS[event.action] || { dot: "bg-gray-400", bg: "bg-gray-50" };
                const IconComp = getActionIcon(event.action);
                return (
                  <div key={event.id} className={`flex items-start gap-3 text-sm p-3 rounded-xl ${cfg.bg} transition-colors`}>
                    <div className="mt-0.5 shrink-0">
                      <IconComp className={`w-4 h-4 ${cfg.dot.replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">
                        <span className="font-medium">{event.actor?.name || "System"}</span>{" "}
                        <span className="text-muted-foreground">{event.purpose || event.action.replace(/_/g, " ").toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{event.resourceType}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RFP Pipeline Status */}
      {stats.rfpPipelines && stats.rfpPipelines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">RFP Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {stats.rfpPipelines.map((rfp) => {
              const currentStep = getPipelineStep(rfp);
              return (
                <div key={rfp.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{rfp.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {rfp.applications.length} application{rfp.applications.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-0">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const stepNum = idx + 1;
                      const isComplete = stepNum < currentStep;
                      const isCurrent = stepNum === currentStep;
                      return (
                        <div key={step} className="flex items-center">
                          {idx > 0 && (
                            <div className={`w-4 sm:w-6 lg:w-8 h-0.5 ${isComplete ? "bg-leaf-500" : "bg-gray-200"}`} />
                          )}
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                isComplete
                                  ? "bg-leaf-500 text-white"
                                  : isCurrent
                                    ? "bg-white border-2 border-leaf-500 text-leaf-600"
                                    : "bg-gray-200 text-gray-400"
                              }`}
                            >
                              {isComplete ? "\u2713" : stepNum}
                            </div>
                            <span className={`text-[9px] leading-tight text-center hidden sm:block ${isCurrent ? "text-leaf-600 font-semibold" : "text-muted-foreground"}`}>
                              {step}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function HeroAction({ label, href, primary }: { label: string; href: string; primary?: boolean }) {
  return (
    <button
      onClick={() => window.location.href = href}
      className={`rounded-xl px-3 py-3 text-center transition-colors cursor-pointer ${
        primary
          ? "bg-white/30 hover:bg-white/40 font-semibold"
          : "bg-white/15 hover:bg-white/25"
      }`}
    >
      <p className="text-sm font-medium">{label}</p>
    </button>
  );
}

function KPICard({ title, value, desc, delay, isCurrency, alert, borderColor }: {
  title: string; value: number; desc: string;
  delay: number; isCurrency?: boolean; alert?: boolean; borderColor?: string;
}) {
  const formatted = isCurrency ? formatSARParts(value) : null;
  return (
    <Card className={`overflow-hidden border-l-4 ${borderColor || "border-l-gray-200"} ${alert ? "ring-2 ring-red-200" : ""}`}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold mt-1 text-slate-900">
          {isCurrency && formatted ? (
            <AnimatedCounter end={formatted.num} decimals={formatted.num === 0 ? 0 : 1} suffix={formatted.suffix} duration={1800} delay={delay} />
          ) : (
            <AnimatedCounter end={value} duration={1500} delay={delay} />
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}

/* ---------- Helpers ---------- */

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B SAR`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}

function formatSARParts(amount: number): { num: number; suffix: string } {
  if (amount === 0) return { num: 0, suffix: " SAR" };
  if (amount >= 1_000_000_000) return { num: amount / 1_000_000_000, suffix: "B SAR" };
  if (amount >= 1_000_000) return { num: amount / 1_000_000, suffix: "M SAR" };
  if (amount >= 1_000) return { num: amount / 1_000, suffix: "K SAR" };
  return { num: amount, suffix: " SAR" };
}
