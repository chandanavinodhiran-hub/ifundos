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
  Zap, Eye, Lock,
} from "lucide-react";

interface AuditEvent {
  id: string; action: string; resourceType: string; resourceId: string | null;
  purpose: string | null; timestamp: string;
  actor: { name: string; email: string; role: string } | null;
}

interface BoostAction {
  id: string; actionType: string; targetType: string; targetId: string;
  reason: string | null; boostAmount: number; timestamp: string;
  actor: { name: string; role: string } | null;
}

interface AuditorStats {
  totalEvents: number;
  eventsToday: number;
  boostCount: number;
  flaggedEvents: number;
  recentEvents: AuditEvent[];
  boostActions: BoostAction[];
}

const ACTION_COLORS: Record<string, string> = {
  AUTH_LOGIN: "bg-blue-100 text-blue-800 border-blue-200",
  AUTH_LOGOUT: "bg-gray-100 text-gray-800 border-gray-200",
  USER_CREATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  USER_UPDATED: "bg-amber-100 text-amber-800 border-amber-200",
  USER_DELETED: "bg-red-100 text-red-800 border-red-200",
  PROGRAM_CREATED: "bg-purple-100 text-purple-800 border-purple-200",
  SETTINGS_UPDATED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  REGISTRATION: "bg-teal-100 text-teal-800 border-teal-200",
};

const BOOST_COLORS: Record<string, string> = {
  SCORE_BOOST: "bg-green-100 text-green-800 border-green-200",
  TRUST_UPGRADE: "bg-blue-100 text-blue-800 border-blue-200",
  PRIORITY_FLAG: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function AuditorDashboard() {
  const [stats, setStats] = useState<AuditorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

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
    } catch {
      setChainValid(false);
    } finally {
      setVerifying(false);
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Audit Dashboard</h1>
          <p className="text-muted-foreground mt-1">National Audit Bureau — System Oversight</p>
        </div>
        <Button onClick={verifyChain} disabled={verifying} className="gap-2">
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
                  <p className="text-xs text-green-700">All {stats.totalEvents} audit events are cryptographically linked and verified.</p>
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
        <SummaryCard
          title="Events Today"
          value={String(stats.eventsToday)}
          desc="Last 24 hours"
          icon={Activity}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          title="Flagged Items"
          value={String(stats.flaggedEvents)}
          desc="Requires review"
          icon={AlertTriangle}
          color="bg-amber-50 text-amber-600"
        />
        <SummaryCard
          title="Boost Actions"
          value={String(stats.boostCount)}
          desc="Score modifications"
          icon={Zap}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Recent Events + Boost Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal" />
              Recent Events (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentEvents.length === 0 ? (
              <div className="text-center py-10">
                <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No events in the last 24 hours</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {stats.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
              <Zap className="w-5 h-5 text-teal" />
              Boost Actions Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.boostActions.length === 0 ? (
              <div className="text-center py-10">
                <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No boost actions recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Boost actions track score modifications and trust tier changes
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.boostActions.map((boost) => (
                    <TableRow key={boost.id}>
                      <TableCell>
                        <Badge variant="outline" className={BOOST_COLORS[boost.actionType] || "bg-gray-100 text-gray-800"}>
                          {boost.actionType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{boost.actor?.name || "System"}</TableCell>
                      <TableCell className="text-xs">
                        <code className="font-mono">{boost.targetType}: {boost.targetId.slice(0, 8)}</code>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {boost.boostAmount > 0 ? "+" : ""}{boost.boostAmount}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(boost.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-teal" />
                <p className="text-sm font-medium">Hash Chain</p>
              </div>
              <p className="text-xs text-muted-foreground">
                SHA-256 cryptographic chain linking all {stats.totalEvents} audit events. Each event&apos;s
                hash depends on the previous, creating tamper-evident logging.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-teal" />
                <p className="text-sm font-medium">Real-Time Monitoring</p>
              </div>
              <p className="text-xs text-muted-foreground">
                All user actions, authentication events, and data mutations are logged in real-time
                with actor identification and purpose tracking.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-teal" />
                <p className="text-sm font-medium">Boost Tracking</p>
              </div>
              <p className="text-xs text-muted-foreground">
                All score modifications and trust tier changes are independently tracked with full
                attribution and justification records.
              </p>
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
