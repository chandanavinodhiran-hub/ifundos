"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase, GitPullRequest, FolderKanban, DollarSign, Activity, TrendingUp,
  Loader2, AlertTriangle, ArrowRight, BarChart3,
} from "lucide-react";

interface Program {
  id: string; name: string; budgetTotal: number; budgetAllocated: number; budgetDisbursed: number; status: string;
}

interface RecentEvent {
  id: string; action: string; resourceType: string; purpose: string | null; timestamp: string;
  actor: { name: string; role: string } | null;
}

interface Stats {
  openRfps: number;
  applicationsInReview: number;
  activeGrants: number;
  totalDisbursed: number;
  atRiskProjects: number;
  programs: Program[];
  recentActivity: RecentEvent[];
}

const ACTION_DOTS: Record<string, string> = {
  AUTH_LOGIN: "bg-blue-500",
  AUTH_LOGOUT: "bg-gray-400",
  USER_CREATED: "bg-emerald-500",
  PROGRAM_CREATED: "bg-purple-500",
  SETTINGS_UPDATED: "bg-amber-500",
  REGISTRATION: "bg-teal-500",
};

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
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Portfolio Overview</h1>
        <p className="text-muted-foreground mt-1">Saudi Environmental Fund — Fund Manager Dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard title="Open RFPs" value={String(stats.openRfps)} desc="Accepting proposals" icon={Briefcase} color="bg-blue-50 text-blue-600" />
        <SummaryCard title="In Review" value={String(stats.applicationsInReview)} desc="Applications scoring" icon={GitPullRequest} color="bg-amber-50 text-amber-600" />
        <SummaryCard title="Active Grants" value={String(stats.activeGrants)} desc="Contracts in progress" icon={FolderKanban} color="bg-emerald-50 text-emerald-600" />
        <SummaryCard title="Total Disbursed" value={formatSAR(stats.totalDisbursed)} desc="Funds released" icon={DollarSign} color="bg-teal-50 text-teal-600" />
        <SummaryCard title="At Risk" value={String(stats.atRiskProjects)} desc="Projects flagged" icon={AlertTriangle} color="bg-red-50 text-red-600" />
      </div>

      {/* Programs Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal" />
            Programs Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.programs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No programs created yet</p>
          ) : (
            <div className="space-y-5">
              {stats.programs.map((p) => {
                const allocPct = p.budgetTotal > 0 ? (p.budgetAllocated / p.budgetTotal) * 100 : 0;
                const disbPct = p.budgetTotal > 0 ? (p.budgetDisbursed / p.budgetTotal) * 100 : 0;
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{p.name}</p>
                        <Badge variant="outline" className={p.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800"}>
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {formatSAR(p.budgetTotal)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Allocated: {allocPct.toFixed(1)}%</span>
                        <span className="mx-1">|</span>
                        <span>Disbursed: {disbPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="h-full flex">
                          <div
                            className="bg-teal h-full transition-all"
                            style={{ width: `${disbPct}%` }}
                          />
                          <div
                            className="bg-teal/30 h-full transition-all"
                            style={{ width: `${Math.max(0, allocPct - disbPct)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-teal" /> Disbursed ({formatSAR(p.budgetDisbursed)})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-teal/30" /> Allocated ({formatSAR(p.budgetAllocated)})
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

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" onClick={() => window.location.href = "/dashboard/rfps"}>
              Create New RFP <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => window.location.href = "/dashboard/applications"}>
              Review Applications <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => window.location.href = "/dashboard/grants"}>
              Manage Contracts <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => window.location.href = "/dashboard/impact"}>
              Impact Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {stats.recentActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ACTION_DOTS[event.action] || "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">
                        <span className="font-medium">{event.actor?.name || "System"}</span>{" "}
                        <span className="text-muted-foreground">{event.purpose || event.action.replace(/_/g, " ").toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{event.resourceType}</Badge>
                  </div>
                ))}
              </div>
            )}
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
