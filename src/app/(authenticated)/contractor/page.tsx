"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, FolderKanban, Clock, Loader2, Star, CalendarClock,
  ArrowRight, TrendingUp, Target,
} from "lucide-react";

interface Application {
  id: string;
  status: string;
  proposedBudget: number;
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
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
  SCORING: "bg-amber-100 text-amber-800 border-amber-200",
  IN_REVIEW: "bg-purple-100 text-purple-800 border-purple-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  WITHDRAWN: "bg-gray-100 text-gray-600 border-gray-200",
};

const TIER_COLORS: Record<string, string> = {
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
  SILVER: "bg-gray-100 text-gray-700 border-gray-300",
  BRONZE: "bg-amber-100 text-amber-800 border-amber-300",
  UNRATED: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function ContractorDashboard() {
  const [stats, setStats] = useState<ContractorStats | null>(null);
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
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  if (!stats) return null;

  const org = stats.organization;
  const qualScore = org?.preQualificationScore ?? 0;
  const trustTier = org?.trustTier ?? "UNRATED";

  return (
    <div className="space-y-6">
      {/* Header with org info */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Contractor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {org?.name ?? "Your Organization"} — Contractor Portal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={TIER_COLORS[trustTier] || TIER_COLORS.UNRATED}>
            <Star className="w-3 h-3 mr-1" /> {trustTier}
          </Badge>
        </div>
      </div>

      {/* Pre-qualification Score + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Pre-qual Score Card */}
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
                  Trust Tier: <span className="font-medium text-foreground">{trustTier}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score determines eligibility for higher-value RFPs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
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
          <div className="flex items-center gap-1.5 text-xs">
            {Object.entries(stats.statusCounts)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status.replace("_", " ")}: {count}
                </Badge>
              ))}
          </div>
        </CardHeader>
        <CardContent>
          {stats.applications.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No applications yet</p>
              <p className="text-xs text-muted-foreground mt-1">Browse open RFPs to submit your first proposal</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFP Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proposed Budget</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      {app.rfp.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[app.status] || ""}>
                        {app.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatSAR(app.proposedBudget)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {app.rfp.deadline ? new Date(app.rfp.deadline).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
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
                      <Badge variant="outline" className={
                        daysLeft <= 7 ? "bg-red-100 text-red-800 border-red-200" :
                        daysLeft <= 14 ? "bg-amber-100 text-amber-800 border-amber-200" :
                        "bg-green-100 text-green-800 border-green-200"
                      }>
                        {daysLeft} days left
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" disabled>
              Browse Open RFPs <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" disabled>
              Submit New Proposal <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" disabled>
              Upload Evidence <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" disabled>
              View Contract Details <ArrowRight className="w-4 h-4" />
            </Button>
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
