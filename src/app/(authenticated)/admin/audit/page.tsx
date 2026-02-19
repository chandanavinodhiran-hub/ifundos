"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Shield, Download, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, Hash, ChevronDown, ChevronUp,
} from "lucide-react";

interface AuditEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  purpose: string | null;
  details: string | null;
  hashPrev: string | null;
  hashCurr: string | null;
  timestamp: string;
  actor: { name: string; email: string; role: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  AUTH_LOGIN: "bg-blue-100 text-blue-800 border-blue-200",
  AUTH_LOGOUT: "bg-gray-100 text-gray-800 border-gray-200",
  USER_CREATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  USER_UPDATED: "bg-amber-100 text-amber-800 border-amber-200",
  USER_DELETED: "bg-red-100 text-red-800 border-red-200",
  PROGRAM_CREATED: "bg-purple-100 text-purple-800 border-purple-200",
  SETTINGS_UPDATED: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const RESOURCE_TYPES = ["USER", "PROGRAM", "APPLICATION", "CONTRACT", "SETTINGS", "RFP"];
const ACTIONS = [
  "AUTH_LOGIN", "AUTH_LOGOUT", "USER_CREATED", "USER_UPDATED", "USER_DELETED",
  "PROGRAM_CREATED", "SETTINGS_UPDATED", "REGISTRATION",
];

const PAGE_SIZE = 25;

export default function AdminAuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterResource, setFilterResource] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));
    if (filterResource !== "all") params.set("resourceType", filterResource);
    if (filterAction !== "all") params.set("action", filterAction);

    const res = await fetch(`/api/audit?${params.toString()}`);
    const data = await res.json();
    setEvents(data.events || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [offset, filterResource, filterAction]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

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

  async function exportCSV() {
    setExporting(true);
    try {
      const res = await fetch("/api/audit/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Audit Trail</h1>
          <p className="text-muted-foreground mt-1">
            Tamper-evident log of all platform actions ({total} total events)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={verifyChain} disabled={verifying} className="gap-2">
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
            Verify Chain
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Chain integrity banner */}
      {chainValid !== null && (
        <Card className={chainValid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}>
          <CardContent className="py-3 flex items-center gap-3">
            {chainValid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Hash Chain Verified</p>
                  <p className="text-xs text-green-700">All audit events are cryptographically linked and intact.</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Chain Integrity Compromised</p>
                  <p className="text-xs text-red-700">One or more events may have been tampered with. Investigate immediately.</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Resource Type</label>
              <Select value={filterResource} onValueChange={(v) => { setFilterResource(v); setOffset(0); }}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Action</label>
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setOffset(0); }}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => { setFilterResource("all"); setFilterAction("all"); setOffset(0); }} className="gap-1">
              <RefreshCw className="w-3 h-3" /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal" />
            Audit Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-teal" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <>
                      <TableRow
                        key={event.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedRow(expandedRow === event.id ? null : event.id)}
                      >
                        <TableCell className="w-8">
                          {expandedRow === event.id ?
                            <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{event.actor?.name || "System"}</p>
                            <p className="text-xs text-muted-foreground">{event.actor?.role || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ACTION_COLORS[event.action] || "bg-gray-100 text-gray-800"}>
                            {event.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {event.resourceType}
                            {event.resourceId && (
                              <span className="text-muted-foreground ml-1">
                                #{event.resourceId.slice(0, 8)}
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {event.purpose || "—"}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-muted-foreground font-mono">
                            {event.hashCurr?.slice(0, 12)}...
                          </code>
                        </TableCell>
                      </TableRow>
                      {expandedRow === event.id && (
                        <TableRow key={`${event.id}-detail`}>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="py-3 px-4 space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Full Hash (Current)</p>
                                  <code className="text-xs font-mono break-all">{event.hashCurr || "N/A"}</code>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Previous Hash</p>
                                  <code className="text-xs font-mono break-all">{event.hashPrev || "GENESIS"}</code>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Actor Email</p>
                                <p className="text-xs">{event.actor?.email || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Resource ID</p>
                                <code className="text-xs font-mono">{event.resourceId || "N/A"}</code>
                              </div>
                              {event.details && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Details</p>
                                  <pre className="text-xs bg-white/50 p-2 rounded mt-1 overflow-x-auto">
                                    {(() => {
                                      try { return JSON.stringify(JSON.parse(event.details), null, 2); }
                                      catch { return event.details; }
                                    })()}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No audit events found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset === 0}
                      onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset + PAGE_SIZE >= total}
                      onClick={() => setOffset(offset + PAGE_SIZE)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
