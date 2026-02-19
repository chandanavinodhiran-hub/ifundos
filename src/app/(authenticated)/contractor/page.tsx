"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, FolderKanban, Clock, Loader2, Star, CalendarClock,
  ArrowRight, TrendingUp, Target, Bell, MessageSquare,
} from "lucide-react";

interface Application {
  id: string;
  status: string;
  proposedBudget: number;
  questionnaireStatus: string;
  createdAt: string;
  rfp: { title: string; deadline: string | null };
}

interface Deadline {
  id: string; title: string; deadline: string;
}

interface OrgInfo {
  name: string; trustTier: string; preQualificationScore: number;
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
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  SCORING: "bg-yellow-100 text-yellow-700 animate-pulse",
  IN_REVIEW: "bg-orange-100 text-orange-700",
  SHORTLISTED: "bg-teal-100 text-teal-700",
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

export default function ContractorDashboard() {
  const [stats, setStats] = useState<ContractorStats | null>(null);
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
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  if (!stats) return null;

  const org = stats.organization;
  const qualScore = org?.preQualificationScore ?? 0;
  const trustTier = org?.trustTier ?? "T0";
  const tierInfo = TIER_LABELS[trustTier] || TIER_LABELS.T0;

  // Find applications needing questionnaire action
  const pendingQuestionnaires = stats.applications.filter(
    (a) => a.questionnaireStatus === "PENDING" || a.status === "QUESTIONNAIRE_PENDING"
  );

  return (
    <div className="space-y-6">
      {/* Questionnaire Notification Banner */}
      {pendingQuestionnaires.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-purple-800">
              You have been shortlisted! Complete your interview questionnaire{pendingQuestionnaires.length > 1 ? "s" : ""}.
            </p>
            <div className="mt-2 space-y-1">
              {pendingQuestionnaires.map((app) => (
                <button
                  key={app.id}
                  onClick={() => router.push(`/contractor/applications/${app.id}/questionnaire`)}
                  className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900 hover:underline"
                >
                  <MessageSquare className="w-4 h-4" />
                  {app.rfp.title} — Complete Questionnaire
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Contractor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {org?.name ?? "Your Organization"} — Contractor Portal
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${tierInfo.color}`}>
          <Star className="w-3.5 h-3.5" /> {tierInfo.label} ({trustTier})
        </span>
      </div>

      {/* Pre-qualification Score + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
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
                  Score determines eligibility for higher-value RFPs
                </p>
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
            <FileText className="w-5 h-5 text-teal" />
            My Applications ({stats.applications.length})
          </CardTitle>
          <button
            onClick={() => router.push("/contractor/applications")}
            className="text-sm text-teal hover:text-teal-600 font-medium flex items-center gap-1"
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
                className="mt-4 px-4 py-2 bg-teal text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
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
                    <th className="pb-2 font-medium text-muted-foreground">Budget</th>
                    <th className="pb-2 font-medium text-muted-foreground">Deadline</th>
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
                      <td className="py-3 font-mono text-xs">
                        {formatSAR(app.proposedBudget)}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {app.rfp.deadline ? new Date(app.rfp.deadline).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3">
                        {(app.questionnaireStatus === "PENDING" || app.status === "QUESTIONNAIRE_PENDING") && (
                          <button
                            onClick={() => router.push(`/contractor/applications/${app.id}/questionnaire`)}
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          >
                            Answer Questionnaire
                          </button>
                        )}
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
              <CalendarClock className="w-5 h-5 text-teal" />
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
                  return (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due: {date.toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        daysLeft <= 7 ? "bg-red-100 text-red-700" :
                        daysLeft <= 14 ? "bg-amber-100 text-amber-700" :
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
              <TrendingUp className="w-5 h-5 text-teal" />
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
            <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium text-muted-foreground" disabled>
              Upload Evidence <ArrowRight className="w-4 h-4" />
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium text-muted-foreground" disabled>
              View Contracts <ArrowRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
