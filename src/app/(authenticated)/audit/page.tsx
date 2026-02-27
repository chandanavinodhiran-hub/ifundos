"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Shield, Activity, AlertTriangle, CheckCircle, XCircle, Loader2, Hash,
  Zap, Eye, Lock, ArrowUp, ArrowDown, Brain, BarChart3,
} from "lucide-react";

interface AuditEvent {
  id: string; action: string; resourceType: string; resourceId: string | null;
  purpose: string | null; timestamp: string;
  actor: { name: string; email: string; role: string } | null;
}

interface BoostAction {
  id: string; boostType: string; targetType: string; targetId: string;
  reason: string | null; originalAiScore: number | null; timestamp: string;
  actor: { name: string; role: string } | null;
}

interface AuditorStats {
  totalEvents: number;
  eventsToday: number;
  eventsAvg7d: number;
  boostCount: number;
  flaggedEvents: number;
  recentEvents: AuditEvent[];
  boostActions: BoostAction[];
  scoredAppCount: number;
  avgCompositeScore: number | null;
  lastScoredAt: string | null;
  scoreDistribution: { recommended: number; conditional: number; notRecommended: number };
}

/* ------------------------------------------------------------------ */
/* Event color mapping — full category coverage                        */
/* ------------------------------------------------------------------ */
const ACTION_COLORS: Record<string, string> = {
  // Auth — de-emphasized gray
  AUTH_LOGIN: "bg-gray-100 text-gray-500 border-gray-200",
  AUTH_LOGOUT: "bg-gray-100 text-gray-500 border-gray-200",
  // Applications — blue
  APPLICATION_SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
  APPLICATION_UPDATED: "bg-blue-100 text-blue-800 border-blue-200",
  // AI scoring — purple
  AI_SCORING_COMPLETED: "bg-purple-100 text-purple-800 border-purple-200",
  SCORING: "bg-purple-100 text-purple-800 border-purple-200",
  // Workflow — teal/ocean
  APPLICATION_SHORTLISTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  QUESTIONNAIRE_SENT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  // Boost actions — amber
  BOOST_UP: "bg-amber-100 text-amber-800 border-amber-200",
  BOOST_DOWN: "bg-amber-100 text-amber-800 border-amber-200",
  BOOST_MONITOR: "bg-amber-100 text-amber-800 border-amber-200",
  BOOST_SHUTDOWN: "bg-amber-100 text-amber-800 border-amber-200",
  // Contract / Finance — green
  CONTRACT_AWARDED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DISBURSEMENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  // Lifecycle — standard
  USER_CREATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  USER_UPDATED: "bg-blue-100 text-blue-800 border-blue-200",
  USER_DELETED: "bg-red-100 text-red-800 border-red-200",
  PROGRAM_CREATED: "bg-purple-100 text-purple-800 border-purple-200",
  SETTINGS_UPDATED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  REGISTRATION: "bg-leaf-100 text-leaf-800 border-leaf-200",
  SYSTEM_INITIALIZED: "bg-leaf-100 text-leaf-800 border-leaf-200",
};

const BOOST_COLORS: Record<string, string> = {
  UP: "bg-leaf-100 text-leaf-800 border-leaf-200",
  DOWN: "bg-red-100 text-red-800 border-red-200",
  MONITOR: "bg-amber-100 text-amber-800 border-amber-200",
  SHUTDOWN: "bg-red-100 text-red-800 border-red-200",
  SCORE_BOOST: "bg-leaf-100 text-leaf-800 border-leaf-200",
  TRUST_UPGRADE: "bg-blue-100 text-blue-800 border-blue-200",
  PRIORITY_FLAG: "bg-amber-100 text-amber-800 border-amber-200",
};

function isAuthEvent(action: string) {
  return action === "AUTH_LOGIN" || action === "AUTH_LOGOUT";
}

export default function AuditorDashboard() {
  const [stats, setStats] = useState<AuditorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [chainEventCount, setChainEventCount] = useState<number | null>(null);
  const [showAuthEvents, setShowAuthEvents] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  async function verifyChain() {
    setVerifying(true);
    try {
      const res = await fetch("/api/audit/verify", { method: "POST" });
      const data = await res.json();
      setChainValid(data.valid === true);
      setChainEventCount(data.totalEvents ?? null);
    } catch {
      setChainValid(false);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  if (!stats) return null;

  const filteredEvents = showAuthEvents
    ? stats.recentEvents
    : stats.recentEvents.filter((e) => !isAuthEvent(e.action));

  const eventsDiff = stats.eventsToday - stats.eventsAvg7d;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Audit Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">National Audit Bureau — System Oversight</p>
        </div>
        <Button onClick={verifyChain} disabled={verifying} className="gap-2 w-full sm:w-auto">
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
          Verify Hash Chain
        </Button>
      </div>

      {/* Chain Integrity Banner */}
      {chainValid !== null && (
        <Card className={chainValid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}>
          <CardContent className="py-3 flex items-center gap-3">
            {chainValid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Hash Chain Intact</p>
                  <p className="text-xs text-green-700">
                    All {chainEventCount ?? stats.totalEvents} audit events are cryptographically linked and verified.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Chain Integrity Compromised</p>
                  <p className="text-xs text-red-700">Potential tampering detected. Investigate immediately.</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Events"
          value={String(stats.totalEvents)}
          desc="Audit log entries"
          icon={Shield}
          color="bg-blue-50 text-blue-600"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Events Today</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold">{stats.eventsToday}</p>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${eventsDiff >= 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {eventsDiff >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(eventsDiff)} vs avg
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  7-day avg: {stats.eventsAvg7d}/day
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.flaggedEvents > 0 ? "border-l-4 border-l-amber-500" : ""}>
          <CardContent className={`pt-6 ${stats.flaggedEvents > 0 ? "bg-amber-50/50 rounded-r-xl" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flagged Items</p>
                <p className="text-3xl font-bold mt-1">{stats.flaggedEvents}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.flaggedEvents > 0 ? "Requires review" : "No items flagged"}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${stats.flaggedEvents > 0 ? "bg-amber-100 text-amber-600" : "bg-amber-50 text-amber-600"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <SummaryCard
          title="Boost Actions"
          value={String(stats.boostCount)}
          desc={stats.boostCount === 0 ? "No manual score overrides" : "Score modifications"}
          icon={Zap}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* AI Scoring Overview */}
      <Card className="border-l-4 border-l-violet-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            AI Scoring Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100">
              <p className="text-xs font-medium text-muted-foreground">Applications Scored</p>
              <p className="text-2xl font-bold text-violet-700 font-mono mt-1">{stats.scoredAppCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-50/30 border border-violet-100">
              <p className="text-xs font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold text-violet-700 font-mono mt-1">
                {stats.avgCompositeScore !== null ? stats.avgCompositeScore.toFixed(1) : "—"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <p className="text-xs font-medium text-muted-foreground">Score Distribution</p>
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700">Recommended</span>
                  <span className="font-bold">{stats.scoreDistribution.recommended}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-700">Conditional</span>
                  <span className="font-bold">{stats.scoreDistribution.conditional}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-700">Not Rec.</span>
                  <span className="font-bold">{stats.scoreDistribution.notRecommended}</span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
              <p className="text-xs font-medium text-muted-foreground">Last Score Generated</p>
              <p className="text-sm font-medium text-gray-700 mt-2">
                {stats.lastScoredAt
                  ? new Date(stats.lastScoredAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "No scores yet"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <p className="text-xs font-medium text-muted-foreground">Manual Overrides</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{stats.boostCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events + Boost Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-leaf-600" />
                Recent Events (24h)
              </CardTitle>
              <button
                onClick={() => setShowAuthEvents(!showAuthEvents)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  showAuthEvents
                    ? "bg-gray-200 text-gray-700"
                    : "bg-leaf-100 text-leaf-700"
                }`}
              >
                {showAuthEvents ? "Show All" : "Hiding Auth Events"}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-10">
                <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {showAuthEvents ? "No events in the last 24 hours" : "No non-auth events in the last 24 hours"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      isAuthEvent(event.action)
                        ? "bg-gray-50/50 hover:bg-gray-50"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <Badge variant="outline" className={`text-xs ${ACTION_COLORS[event.action] || "bg-gray-100 text-gray-800"}`}>
                        {event.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{event.actor?.name || "System"}</span>
                        {event.purpose && (
                          <span className="text-muted-foreground"> — {event.purpose}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{event.resourceType}</span>
                        {event.resourceId && (
                          <>
                            <span>•</span>
                            <code className="font-mono">{event.resourceId.slice(0, 8)}</code>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boost Actions Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-leaf-600" />
              Boost Actions Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.boostActions.length === 0 ? (
              <div className="text-center py-10">
                <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No boost actions recorded yet</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
                  Boost actions record every manual override of AI scores, trust tier changes,
                  and monitoring flags. Each action requires justification and is permanently logged.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.boostActions.map((boost) => (
                    <TableRow key={boost.id}>
                      <TableCell>
                        <Badge variant="outline" className={BOOST_COLORS[boost.boostType] || "bg-gray-100 text-gray-800"}>
                          {boost.boostType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{boost.actor?.name || "System"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {boost.reason || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {boost.originalAiScore !== null ? boost.originalAiScore.toFixed(1) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(boost.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Integrity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-leaf-600" />
            System Integrity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-leaf-600" />
                <p className="text-sm font-medium">Hash Chain Status</p>
              </div>
              {chainValid === null ? (
                <p className="text-xs text-muted-foreground">
                  ⏳ Not yet verified — click &quot;Verify Hash Chain&quot; to run integrity check
                </p>
              ) : chainValid ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-xs text-green-700">
                    Verified — {chainEventCount ?? stats.totalEvents} events, no breaks detected
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700">
                    Integrity compromised — investigate immediately
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-violet-600" />
                <p className="text-sm font-medium">AI Scoring Engine</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <p className="text-xs text-muted-foreground">Online — Demo Mode</p>
              </div>
              {stats.scoredAppCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.scoredAppCount} applications scored
                </p>
              )}
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-leaf-600" />
                <p className="text-sm font-medium">Monitoring Summary</p>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Events/day (7d avg): <span className="font-medium text-foreground">{stats.eventsAvg7d}</span></p>
                <p>Manual overrides: <span className="font-medium text-foreground">{stats.boostCount}</span></p>
                <p>Flagged items: <span className="font-medium text-foreground">{stats.flaggedEvents}</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
