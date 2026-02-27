"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, FolderKanban, Clock, Loader2, Star, CalendarClock,
  ArrowRight, TrendingUp, Target, Bell, MessageSquare, X,
  CheckCircle2, Info, Award, AlertTriangle,
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
  id: string; title: string; deadline: string;
}

interface OrgInfo {
  name: string; trustTier: string; preQualificationScore: number;
  capitalization: number | null; businessCategories: string | null; certifications: string | null;
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

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  SCORING: "bg-yellow-100 text-yellow-700 animate-pulse",
  IN_REVIEW: "bg-orange-100 text-orange-700",
  SHORTLISTED: "bg-leaf-100 text-leaf-700",
  QUESTIONNAIRE_PENDING: "bg-purple-100 text-purple-700",
  QUESTIONNAIRE_SUBMITTED: "bg-indigo-100 text-indigo-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  T0: { label: "Unrated", color: "bg-gray-100 text-gray-600" },
  T1: { label: "Bronze", color: "bg-amber-100 text-amber-700" },
  T2: { label: "Silver", color: "bg-gray-200 text-gray-700" },
  T3: { label: "Gold", color: "bg-yellow-100 text-yellow-700" },
  T4: { label: "Platinum", color: "bg-indigo-100 text-indigo-700" },
};

const TIER_THRESHOLDS: Record<string, string> = {
  T0: "SAR 10M",
  T1: "SAR 50M",
  T2: "SAR 200M",
  T3: "SAR 500M",
  T4: "Unlimited",
};

const TIER_NEXT: Record<string, string> = {
  T0: "Bronze (T1)",
  T1: "Silver (T2)",
  T2: "Gold (T3)",
  T3: "Platinum (T4)",
  T4: "Platinum (T4)",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-leaf-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ContractorDashboard() {
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
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
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  if (!stats) return null;

  const org = stats.organization;
  const qualScore = org?.preQualificationScore ?? 0;
  const trustTier = org?.trustTier ?? "T0";
  const tierInfo = TIER_LABELS[trustTier] || TIER_LABELS.T0;
  const appliedRfpIds = new Set(stats.appliedRfpIds || []);

  // Build notification banners from application statuses
  const banners: { id: string; type: "blue" | "amber" | "green"; icon: React.ReactNode; text: string; action?: { label: string; href: string } }[] = [];

  for (const app of stats.applications) {
    if (dismissedBanners.has(app.id)) continue;

    if (app.status === "APPROVED") {
      banners.push({
        id: app.id,
        type: "green",
        icon: <Award className="w-5 h-5 mt-0.5 shrink-0" />,
        text: `Congratulations! Your application for ${app.rfp.title} has been approved.`,
      });
    } else if (
      (app.questionnaireStatus === "PENDING" || app.status === "QUESTIONNAIRE_PENDING")
    ) {
      banners.push({
        id: app.id,
        type: "amber",
        icon: <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />,
        text: `Action required: Complete the interview questionnaire for ${app.rfp.title}.`,
        action: { label: "Complete Questionnaire", href: `/contractor/applications/${app.id}/questionnaire` },
      });
    } else if (app.status === "IN_REVIEW" && app.compositeScore !== null) {
      banners.push({
        id: app.id,
        type: "blue",
        icon: <Bell className="w-5 h-5 mt-0.5 shrink-0" />,
        text: `Your application for ${app.rfp.title} has been scored. AI Score: ${Math.round(app.compositeScore)}/100.`,
      });
    }
  }

  const visibleBanners = banners.slice(0, 2);

  const BANNER_STYLES = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    green: "bg-green-50 border-green-200 text-green-800",
  };

  const dismissBanner = (id: string) => {
    setDismissedBanners((prev) => new Set(prev).add(id));
  };

  return (
    <div className="space-y-6">
      {/* Status Notification Banners */}
      {visibleBanners.map((banner) => (
        <div key={banner.id} className={`border rounded-lg p-4 flex items-start gap-3 ${BANNER_STYLES[banner.type]}`}>
          {banner.icon}
          <div className="flex-1">
            <p className="font-medium text-sm">{banner.text}</p>
            {banner.action && (
              <button
                onClick={() => router.push(banner.action!.href)}
                className="mt-1.5 flex items-center gap-1 text-sm font-medium hover:underline"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {banner.action.label}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <button onClick={() => dismissBanner(banner.id)} className="shrink-0 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Contractor Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {org?.name ?? "Your Organization"} — Contractor Portal
          </p>
        </div>
        {/* Tier Badge with Tooltip */}
        <div className="relative group">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${tierInfo.color} cursor-help`}>
            <Star className="w-3.5 h-3.5" /> {tierInfo.label} ({trustTier})
            <Info className="w-3 h-3 opacity-50" />
          </span>
          <div className="invisible group-hover:visible absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 text-xs text-gray-700 leading-relaxed">
            {tierInfo.label} tier contractors are eligible for RFPs up to {TIER_THRESHOLDS[trustTier]}.
            Complete projects successfully to advance to {TIER_NEXT[trustTier]}.
          </div>
        </div>
      </div>

      {/* Pre-qualification Score + Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="sm:col-span-2 lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e5e7eb" strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#00B4D8" strokeWidth="3"
                    strokeDasharray={`${qualScore}, 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  {qualScore}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pre-Qualification Score</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Trust Tier: <span className="font-medium text-foreground">{tierInfo.label}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Eligible for RFPs up to <span className="font-semibold text-leaf-700">{TIER_THRESHOLDS[trustTier]}</span>
                </p>
                <div className="relative group/tip mt-1">
                  <button className="text-xs text-ocean-600 hover:text-ocean-700 font-medium flex items-center gap-0.5">
                    How to improve your score <ArrowRight className="w-3 h-3" />
                  </button>
                  <div className="invisible group-hover/tip:visible absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 z-50 text-xs text-gray-600 leading-relaxed">
                    Complete projects successfully and maintain high milestone verification rates to advance your trust tier.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SummaryCard title="Open RFPs" value={String(stats.openRfps)} desc="Available to apply" icon={Target} color="bg-blue-50 text-blue-600" />
        <SummaryCard title="Active Contracts" value={String(stats.activeContracts)} desc="Awarded grants" icon={FolderKanban} color="bg-emerald-50 text-emerald-600" />
        <SummaryCard title="Pending Milestones" value={String(stats.pendingMilestones)} desc="Awaiting verification" icon={Clock} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Application Pipeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-leaf-600" />
            My Applications ({stats.applications.length})
          </CardTitle>
          <button
            onClick={() => router.push("/contractor/applications")}
            className="text-sm text-leaf-600 hover:text-leaf-700 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </CardHeader>
        <CardContent>
          {stats.applications.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No applications yet</p>
              <p className="text-xs text-muted-foreground mt-1">Browse open RFPs to submit your first proposal</p>
              <button
                onClick={() => router.push("/contractor/rfps")}
                className="mt-4 px-4 py-2 bg-leaf-600 text-white text-sm rounded-lg hover:bg-leaf-700 transition-colors"
              >
                Browse RFPs
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">RFP Title</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 font-medium text-muted-foreground hidden sm:table-cell">AI Score</th>
                    <th className="pb-2 font-medium text-muted-foreground hidden md:table-cell">Budget</th>
                    <th className="pb-2 font-medium text-muted-foreground hidden lg:table-cell">Deadline</th>
                    <th className="pb-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.applications.slice(0, 5).map((app) => (
                    <tr key={app.id} className="border-b last:border-0">
                      <td className="py-3 font-medium max-w-[250px] truncate">
                        {app.rfp.title}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-700"}`}>
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        {app.compositeScore !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium">{Math.round(app.compositeScore)}</span>
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${getScoreColor(app.compositeScore)}`} style={{ width: `${Math.min(app.compositeScore, 100)}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-xs hidden md:table-cell">
                        {formatSAR(app.proposedBudget)}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {app.rfp.deadline ? new Date(app.rfp.deadline).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          {(app.questionnaireStatus === "PENDING" || app.status === "QUESTIONNAIRE_PENDING") && (
                            <button
                              onClick={() => router.push(`/contractor/applications/${app.id}/questionnaire`)}
                              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                            >
                              Answer Questionnaire
                            </button>
                          )}
                          <button
                            onClick={() => router.push("/contractor/applications")}
                            className="text-xs text-leaf-600 hover:text-leaf-700 font-medium flex items-center gap-0.5"
                          >
                            View Details <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-leaf-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingDeadlines.map((d) => {
                  const date = new Date(d.deadline);
                  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const hasApplied = appliedRfpIds.has(d.id);
                  return (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{d.title}</p>
                          {hasApplied && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Applied
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due: {date.toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        daysLeft < 30 ? "bg-red-100 text-red-700" :
                        daysLeft <= 60 ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {daysLeft} days left
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-leaf-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button onClick={() => router.push("/contractor/rfps")} className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium">
              Browse Open RFPs <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => router.push("/contractor/applications")} className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium">
              View My Applications <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
            {stats.activeContracts > 0 ? (
              <>
                <button onClick={() => router.push("/contractor/evidence")} className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium">
                  Submit Evidence <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => router.push("/contractor/contracts")} className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium">
                  View Contracts <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                <div className="w-full px-4 py-3 rounded-lg border opacity-50 cursor-not-allowed">
                  <p className="text-sm font-medium text-muted-foreground">Submit Evidence</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Available after contract award</p>
                </div>
                <div className="w-full px-4 py-3 rounded-lg border opacity-50 cursor-not-allowed">
                  <p className="text-sm font-medium text-muted-foreground">View Contracts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Available after contract award</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function SummaryCard({ title, value, desc, icon: Icon, color }: {
  title: string; value: string; desc: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B SAR`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}
