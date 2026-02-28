"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Application {
  id: string;
  rfpId: string;
  status: string;
  proposedBudget: number;
  compositeScore: number | null;
  questionnaireStatus: string;
  createdAt: string;
  submittedAt: string | null;
  rfp: { title: string; deadline: string | null };
}

interface Deadline {
  id: string;
  title: string;
  deadline: string;
}

interface OrgInfo {
  name: string;
  trustTier: string;
  preQualificationScore: number;
  capitalization: number | null;
  businessCategories: string | null;
  certifications: string | null;
}

interface ContractorStats {
  organization: OrgInfo | null;
  openRfps: number;
  applications: Application[];
  activeContracts: number;
  pendingMilestones: number;
  totalReceived: number;
  statusCounts: Record<string, number>;
  upcomingDeadlines: Deadline[];
  appliedRfpIds: string[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const TIER_LABELS: Record<string, { label: string; dot: string }> = {
  T0: { label: "Unrated", dot: "#9a9488" },
  T1: { label: "Bronze", dot: "#b87a3f" },
  T2: { label: "Silver", dot: "#8a8275" },
  T3: { label: "Gold", dot: "#b8943f" },
  T4: { label: "Platinum", dot: "#7a7265" },
};

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ContractorHome() {
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

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

  const org = stats.organization;
  const trustTier = org?.trustTier ?? "T0";
  const tierInfo = TIER_LABELS[trustTier] || TIER_LABELS.T0;
  const firstName = session?.user?.name?.split(" ")[0] ?? org?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Count active applications (not draft, not rejected)
  const activeApps = stats.applications.filter(
    (a) => !["DRAFT", "REJECTED"].includes(a.status)
  ).length;

  // Build pulse — most urgent action item
  const pulse = buildPulse(stats);

  // Build timeline events
  const timeline = buildTimeline(stats);

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-[100px] md:pb-0">
      {/* ── Date + Greeting ──────────────────────────────────── */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "#b8943f" }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-extrabold text-sovereign-charcoal mt-1">
          {greeting}, {firstName}
        </h1>
        <p className="text-[13px] text-sovereign-stone mt-0.5">
          {org?.name ?? "Your Organization"}
        </p>
      </div>

      {/* ── Tier Badge ───────────────────────────────────────── */}
      <div>
        <Badge variant="neu" className="inline-flex items-center gap-1.5 px-3 py-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: tierInfo.dot }}
          />
          <span className="text-[11px] font-bold text-sovereign-charcoal">
            {tierInfo.label} · {trustTier}
          </span>
        </Badge>
      </div>

      {/* ── Signal Strip — 3 wells ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: activeApps, isMoney: false },
          { label: "Contracts", value: stats.activeContracts, isMoney: false },
          { label: "Pending", value: stats.totalReceived, isMoney: true },
        ].map((well) => (
          <div
            key={well.label}
            className="p-3 text-center rounded-[18px]"
            style={{
              background: "#e8e0d0",
              boxShadow: "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
            }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sovereign-stone leading-tight">
              {well.label}
            </p>
            {well.isMoney ? (
              <>
                <p className="text-[26px] font-extrabold leading-none mt-1 font-mono" style={{ color: "#b8943f" }}>
                  {formatSAR(well.value)}
                </p>
                <p className="text-[9px] text-sovereign-stone">SAR</p>
              </>
            ) : (
              <p className="text-[26px] font-extrabold text-sovereign-charcoal leading-none mt-1">
                <AnimatedCounter end={well.value} duration={800} />
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Pulse Card ───────────────────────────────────────── */}
      {pulse ? (
        <Card
          variant="neu-raised"
          className={`p-5 cursor-pointer neu-press ${pulse.accent}`}
          onClick={() => router.push(pulse.href)}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <pulse.icon className="w-5 h-5" style={{ color: pulse.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-sovereign-charcoal leading-snug">
                {pulse.title}
              </p>
              <p className="text-[12px] text-sovereign-stone mt-1 leading-relaxed">
                {pulse.subtitle}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-sovereign-stone shrink-0 mt-1" />
          </div>
        </Card>
      ) : (
        <Card variant="neu-inset" className="p-5 text-center">
          <CheckCircle2 className="w-6 h-6 mx-auto mb-2" style={{ color: "#4a7c59" }} />
          <p className="text-[14px] font-bold text-sovereign-charcoal">All caught up</p>
          <p className="text-[12px] text-sovereign-stone mt-1">
            No urgent actions right now
          </p>
        </Card>
      )}

      {/* ── Timeline Feed ────────────────────────────────────── */}
      {timeline.length > 0 && (
        <div className="space-y-0">
          {timeline.map((item, i) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-3"
              style={{
                borderBottom: i < timeline.length - 1 ? "1px solid rgba(156,148,130,0.15)" : "none",
              }}
            >
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: item.dotColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-sovereign-charcoal leading-snug">
                  {item.text}
                </p>
              </div>
              <span className="text-[11px] font-mono text-sovereign-stone whitespace-nowrap shrink-0">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pulse builder                                                       */
/* ------------------------------------------------------------------ */

interface PulseItem {
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  title: string;
  subtitle: string;
  href: string;
  urgency: number;
}

function buildPulse(stats: ContractorStats): PulseItem | null {
  const items: PulseItem[] = [];

  for (const app of stats.applications) {
    // Questionnaire pending — highest urgency
    if (app.questionnaireStatus === "PENDING" || app.status === "QUESTIONNAIRE_PENDING") {
      items.push({
        accent: "accent-left-amber",
        icon: AlertTriangle,
        iconColor: "#b87a3f",
        title: `Action required: Complete questionnaire`,
        subtitle: `Interview questionnaire for "${app.rfp.title}" is waiting for your response.`,
        href: `/contractor/applications/${app.id}/questionnaire`,
        urgency: 0,
      });
    }
    // App scored — show score
    else if (app.status === "IN_REVIEW" && app.compositeScore !== null) {
      items.push({
        accent: "accent-left-gold",
        icon: Sparkles,
        iconColor: "#b8943f",
        title: `Your application for ${app.rfp.title.replace(/\s*—.*$/, "")} was scored`,
        subtitle: `AI Score: ${Math.round(app.compositeScore)} — View score breakdown →`,
        href: "/contractor/applications",
        urgency: 1,
      });
    }
    // App approved
    else if (app.status === "APPROVED") {
      items.push({
        accent: "accent-left-green",
        icon: CheckCircle2,
        iconColor: "#4a7c59",
        title: `Application approved!`,
        subtitle: `Your proposal for "${app.rfp.title}" has been approved. Check your contracts.`,
        href: "/contractor/contracts",
        urgency: 2,
      });
    }
  }

  items.sort((a, b) => a.urgency - b.urgency);
  return items[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Timeline builder                                                    */
/* ------------------------------------------------------------------ */

interface TimelineItem {
  id: string;
  text: string;
  dotColor: string;
  time: string;
}

function buildTimeline(stats: ContractorStats): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const app of stats.applications) {
    // Scored
    if (app.compositeScore !== null) {
      items.push({
        id: `scored-${app.id}`,
        text: `AI scored your application for ${app.rfp.title}`,
        dotColor: "#b8943f",
        time: app.submittedAt ? relativeTime(app.submittedAt) : relativeTime(app.createdAt),
      });
    }
    // Submitted
    if (app.submittedAt) {
      items.push({
        id: `submitted-${app.id}`,
        text: `Application submitted for ${app.rfp.title}`,
        dotColor: "#4a7c59",
        time: relativeTime(app.submittedAt),
      });
    }
  }

  // Registration event (always at bottom)
  items.push({
    id: "registered",
    text: "Registration completed",
    dotColor: "#4a7c59",
    time: "Feb 15",
  });

  return items.slice(0, 5);
}
