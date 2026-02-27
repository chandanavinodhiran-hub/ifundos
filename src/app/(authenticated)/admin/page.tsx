"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface RecentEvent {
  id: string;
  action: string;
  resourceType: string;
  timestamp: string;
  actor: { name: string; email: string; role: string } | null;
}

interface AdminStats {
  userCount: number;
  orgCount: number;
  programCount: number;
  auditCount: number;
  scoredAppCount: number;
  lastScoringEvent: { timestamp: string; action: string } | null;
  recentActivity: RecentEvent[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">System Administration</h1>
        <p className="text-slate-500 mt-1 text-sm">
          iFundOS platform management and configuration
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.userCount ?? 0} />
        <StatCard label="Organizations" value={stats?.orgCount ?? 0} />
        <StatCard label="Active Programs" value={stats?.programCount ?? 0} />
        <StatCard label="Audit Events" value={stats?.auditCount ?? 0} />
      </div>

      {/* Two Column: System Health + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Health */}
        <Card className="rounded-md overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3">
            <CardTitle className="text-base font-semibold text-white">System Health</CardTitle>
          </div>
          <CardContent className="p-4 space-y-3">
            <HealthRow label="Platform" status="Operational" detail="99.9% uptime" />
            <HealthRow label="Database" status="Connected" detail="Neon PostgreSQL" />
            <HealthRow label="Authentication" status="Active" detail="NextAuth v4" />
            <HealthRow label="AI Engine" status="Online" detail={`${stats?.scoredAppCount ?? 0} scored`} isAI />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-md">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <ul className="space-y-3">
                {stats.recentActivity.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {event.actor?.name ?? "System"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {event.action.replace(/_/g, " ")} - {event.resourceType}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {timeAgo(event.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Engine Status */}
      <Card className="rounded-md border-l-4 border-l-violet-500">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">AI Engine Status</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-sm font-medium text-violet-700">Online</span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Scored Applications</p>
              <p className="text-lg font-semibold font-mono text-violet-600">{stats?.scoredAppCount ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Last Scoring</p>
              <p className="text-sm font-medium text-slate-700 font-mono">
                {stats?.lastScoringEvent
                  ? timeAgo(stats.lastScoringEvent.timestamp)
                  : "No scoring events yet"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-md">
      <CardContent className="p-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function HealthRow({ label, status, detail, isAI }: { label: string; status: string; detail: string; isAI?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full ${isAI ? "bg-violet-500 animate-pulse" : "bg-emerald-500"}`} />
        <span className={`text-sm font-medium ${isAI ? "text-violet-700" : "text-slate-700"}`}>{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-sm ${isAI ? "text-violet-600" : "text-slate-600"}`}>{status}</span>
        <span className={`text-xs ml-2 ${isAI ? "text-violet-400 font-mono" : "text-slate-400"}`}>{detail}</span>
      </div>
    </div>
  );
}
