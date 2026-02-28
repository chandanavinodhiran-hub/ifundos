"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Loader2,
  Briefcase,
  FileText,
  AlertTriangle,
  ChevronRight,
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
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatSARParts(amount: number): { num: number; suffix: string } {
  if (amount === 0) return { num: 0, suffix: " SAR" };
  if (amount >= 1_000_000_000) return { num: amount / 1_000_000_000, suffix: "B SAR" };
  if (amount >= 1_000_000) return { num: amount / 1_000_000, suffix: "M SAR" };
  if (amount >= 1_000) return { num: amount / 1_000, suffix: "K SAR" };
  return { num: amount, suffix: " SAR" };
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function roleDotColor(role: string): string {
  if (role === "FUND_MANAGER") return "#4a7c59";
  if (role === "CONTRACTOR") return "#7a7265";
  if (role === "AUDITOR") return "#b87a3f";
  if (role === "ADMIN") return "#1a1714";
  return "#9a9488";
}

function formatAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Auth ", "")
    .replace("Ai ", "AI ");
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function FundManagerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  if (!stats) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* Build decision feed items — urgency-sorted */
  const decisions: DecisionItem[] = [];

  if (stats.applicationsInReview > 0) {
    decisions.push({
      id: "apps-review",
      accent: "accent-left-gold",
      icon: FileText,
      title: `${stats.applicationsInReview} application${stats.applicationsInReview !== 1 ? "s" : ""} awaiting decision`,
      subtitle: "Review and shortlist or reject",
      href: "/dashboard/applications",
      urgency: 1,
    });
  }

  if (stats.atRiskProjects > 0) {
    decisions.push({
      id: "at-risk",
      accent: "accent-left-critical",
      icon: AlertTriangle,
      title: `${stats.atRiskProjects} grant${stats.atRiskProjects !== 1 ? "s" : ""} at risk`,
      subtitle: "Evidence overdue or milestones delayed",
      href: "/dashboard/grants",
      urgency: 0,
    });
  }

  if (stats.openRfps > 0) {
    decisions.push({
      id: "open-rfps",
      accent: "accent-left-amber",
      icon: Briefcase,
      title: `${stats.openRfps} open RFP${stats.openRfps !== 1 ? "s" : ""} accepting proposals`,
      subtitle: "Monitor submissions and deadlines",
      href: "/dashboard/rfps",
      urgency: 2,
    });
  }

  decisions.sort((a, b) => a.urgency - b.urgency);
  const pulse = decisions[0] ?? null;

  return (
    <div className="desktop:flex desktop:gap-8">
      {/* ── Primary Zone ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6 desktop:max-w-[720px]">
        {/* Greeting */}
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "#b8943f" }}
          >
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-sovereign-charcoal mt-1">
            {greeting}, Fatimah
          </h1>
        </div>

        {/* Stat Strip — 4 columns, horizontal row on all sizes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Disbursed */}
          <Card variant="neu-inset" className="p-3 md:col-span-1 col-span-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sovereign-stone leading-tight">
              Disbursed
            </p>
            <p className="font-mono text-lg md:text-xl font-bold text-sovereign-gold mt-1 tabular-nums leading-none">
              {(() => {
                const parts = formatSARParts(stats.totalDisbursed);
                return (
                  <AnimatedCounter end={parts.num} decimals={parts.num === 0 ? 0 : 1} suffix={parts.suffix} duration={1800} delay={0} />
                );
              })()}
            </p>
            <p className="text-[9px] text-sovereign-stone mt-2">Released</p>
          </Card>

          {/* Open RFPs */}
          <Card variant="neu-inset" className="p-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sovereign-stone leading-tight">
              Open RFPs
            </p>
            <p className="font-sans text-xl font-extrabold text-sovereign-charcoal mt-1 leading-none">
              <AnimatedCounter end={stats.openRfps} duration={1500} delay={100} />
            </p>
            <p className="text-[9px] text-sovereign-stone mt-2">Accepting</p>
          </Card>

          {/* In Review */}
          <Card variant="neu-inset" className="p-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sovereign-stone leading-tight">
              In Review
            </p>
            <p className="font-sans text-xl font-extrabold text-sovereign-gold mt-1 leading-none">
              <AnimatedCounter end={stats.applicationsInReview} duration={1500} delay={200} />
            </p>
            <p className="text-[9px] text-sovereign-stone mt-2">Awaiting</p>
          </Card>

          {/* Active Grants */}
          <Card variant="neu-inset" className="p-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sovereign-stone leading-tight">
              Grants
            </p>
            <p className="font-sans text-xl font-extrabold text-sovereign-charcoal mt-1 leading-none">
              <AnimatedCounter end={stats.activeGrants} duration={1500} delay={300} />
            </p>
            {stats.atRiskProjects > 0 ? (
              <p className="text-[9px] text-critical font-semibold mt-2">
                {stats.atRiskProjects} at risk
              </p>
            ) : (
              <p className="text-[9px] text-sovereign-stone mt-2">On track</p>
            )}
          </Card>
        </div>

        {/* Pulse — Single Most Urgent Item */}
        <div>
          {pulse ? (
            <button
              onClick={() => router.push(pulse.href)}
              className="w-full text-left cursor-pointer"
            >
              <Card variant="neu-raised" className="relative overflow-hidden transition-all hover:scale-[1.01]">
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      boxShadow: "inset 3px 3px 8px rgba(140,132,115,0.5), inset -3px -3px 8px rgba(255,250,240,0.6)",
                    }}
                  >
                    <pulse.icon className="w-5 h-5 text-sovereign-stone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sovereign-charcoal">{pulse.title}</p>
                    <p className="text-xs text-sovereign-stone mt-0.5">{pulse.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sovereign-stone shrink-0" />
                </CardContent>
              </Card>
            </button>
          ) : (
            <Card variant="neu-inset" className="p-5">
              <p className="text-sm text-sovereign-charcoal font-medium text-center">
                All on track. No urgent items.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* ── Side Zone (desktop only) ─────────────────────────── */}
      <div className="hidden desktop:block desktop:w-[340px] desktop:shrink-0 desktop:sticky desktop:top-0 desktop:self-start space-y-5 pt-1">
        {/* Activity Stream */}
        <div>
          <h2
            className="text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#7a7265" }}
          >
            Activity Stream
          </h2>
          <div className="space-y-0">
            {stats.recentActivity.slice(0, 15).map((event) => (
              <button
                key={event.id}
                className="w-full flex items-start gap-3 py-2.5 border-b cursor-pointer text-left"
                style={{ borderColor: "rgba(156,148,130,0.15)" }}
                onClick={() => {
                  if (event.resourceType === "RFP") router.push("/dashboard/rfps");
                  else if (event.resourceType === "APPLICATION") router.push("/dashboard/applications");
                  else router.push("/dashboard");
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                  style={{ background: roleDotColor(event.actor?.role ?? "") }}
                />
                <span className="flex-1 min-w-0 text-[13px] leading-snug" style={{ color: "#1a1714" }}>
                  {event.actor?.name ?? "System"} — {formatAction(event.action)}
                </span>
                <span
                  className="text-[11px] font-mono shrink-0 whitespace-nowrap"
                  style={{ color: "#9a9488" }}
                >
                  {relativeTime(event.timestamp)}
                </span>
              </button>
            ))}
            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-[13px] py-6 text-center" style={{ color: "#9a9488" }}>
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DecisionItem {
  id: string;
  accent: string;
  icon: typeof Briefcase;
  title: string;
  subtitle: string;
  href: string;
  urgency: number;
}
