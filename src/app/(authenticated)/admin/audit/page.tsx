"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight,
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

interface CategoryCounts {
  CREATE: number;
  UPDATE: number;
  DELETE: number;
  LOGIN: number;
  VERIFY: number;
  OTHER: number;
}

function getActionColor(action: string): string {
  if (action.includes("CREATE") || action.includes("CREATED")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (action.includes("UPDATE") || action.includes("UPDATED")) return "bg-blue-100 text-blue-800 border-blue-200";
  if (action.includes("DELETE") || action.includes("DELETED")) return "bg-red-100 text-red-800 border-red-200";
  if (action.includes("LOGIN") || action.includes("AUTH")) return "bg-amber-100 text-amber-800 border-amber-200";
  if (action.includes("VERIFY") || action.includes("SCORE") || action.includes("AI")) return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

const RESOURCE_TYPES = ["USER", "PROGRAM", "APPLICATION", "CONTRACT", "SETTINGS", "RFP", "SYSTEM"];
const ACTIONS = [
  "AUTH_LOGIN", "AUTH_LOGOUT", "USER_CREATED", "USER_UPDATED", "USER_DELETED",
  "PROGRAM_CREATED", "SETTINGS_UPDATED", "REGISTRATION", "SYSTEM_INITIALIZED",
  "AI_SCORING_COMPLETED", "APPLICATION_SHORTLISTED",
];

const PAGE_SIZE = 25;

export default function AdminAuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterResource, setFilterResource] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({ CREATE: 0, UPDATE: 0, DELETE: 0, LOGIN: 0, VERIFY: 0, OTHER: 0 });
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  function applyDatePreset(preset: string) {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "today") {
      const today = now.toISOString().split("T")[0];
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === "7days") {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setDateFrom(from.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    } else if (preset === "30days") {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setDateFrom(from.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    } else {
      setDateFrom("");
      setDateTo("");
    }
    setOffset(0);
  }

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));
    if (filterResource !== "all") params.set("resourceType", filterResource);
    if (filterAction !== "all") params.set("action", filterAction);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch(`/api/audit?${params.toString()}`);
    const data = await res.json();
    setEvents(data.events || []);
    setTotal(data.total || 0);
    if (data.categoryCounts) setCategoryCounts(data.categoryCounts);
    setLoading(false);
  }, [offset, filterResource, filterAction, dateFrom, dateTo]);

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

  function clearAllFilters() {
    setFilterResource("all");
    setFilterAction("all");
    setDateFrom("");
    setDateTo("");
    setDatePreset("all");
    setOffset(0);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Audit Trail</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Tamper-evident log of all platform actions ({total} total events)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={verifyChain} disabled={verifying} className="gap-2 flex-1 sm:flex-none">
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
            <span className="hidden sm:inline">Verify Chain</span>
            <span className="sm:hidden">Verify</span>
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={exporting} className="gap-2 flex-1 sm:flex-none">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Chain integrity banner */}
      {chainValid !== null && (
        <Card className={`rounded-md ${chainValid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
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
      <Card className="rounded-md">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 sm:flex-wrap">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Resource Type</label>
                <Select value={filterResource} onValueChange={(v) => { setFilterResource(v); setOffset(0); }}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {RESOURCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Action</label>
                <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setOffset(0); }}>
                  <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
                <RefreshCw className="w-3 h-3" /> Clear Filters
              </Button>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["all", "today", "7days", "30days"] as const).map((preset) => (
                  <Button
                    key={preset}
                    variant={datePreset === preset ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7 px-2.5"
                    onClick={() => applyDatePreset(preset)}
                  >
                    {preset === "all" ? "All Time" : preset === "today" ? "Today" : preset === "7days" ? "7 Days" : "30 Days"}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setDatePreset("custom"); setOffset(0); }}
                  className="h-7 text-xs w-full sm:w-[140px]"
                />
                <span className="text-xs text-slate-400">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setDatePreset("custom"); setOffset(0); }}
                  className="h-7 text-xs w-full sm:w-[140px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Created: {categoryCounts.CREATE}
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Updated: {categoryCounts.UPDATE}
        </Badge>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Deleted: {categoryCounts.DELETE}
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Login: {categoryCounts.LOGIN}
        </Badge>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          Verify: {categoryCounts.VERIFY}
        </Badge>
        {categoryCounts.OTHER > 0 && (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Other: {categoryCounts.OTHER}
          </Badge>
        )}
      </div>

      {/* Audit Table */}
      <Card className="rounded-md">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Audit Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead className="hidden sm:table-cell">Purpose</TableHead>
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
                            <ChevronUp className="w-4 h-4 text-slate-400" /> :
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          }
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{event.actor?.name || "System"}</p>
                            <p className="text-xs text-slate-500">{event.actor?.role || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getActionColor(event.action)}>
                            {event.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {event.resourceType}
                            {event.resourceId && (
                              <span className="text-slate-400 ml-1">
                                #{event.resourceId.slice(0, 8)}
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate hidden sm:table-cell">
                          {event.purpose || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <code className="text-xs text-slate-500 font-mono">
                              {event.hashCurr?.slice(0, 12)}...
                            </code>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRow === event.id && (
                        <TableRow key={`${event.id}-detail`}>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="py-3 px-4 space-y-2 text-sm">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-slate-500">Full Hash (Current)</p>
                                  <code className="text-xs font-mono break-all">{event.hashCurr || "N/A"}</code>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-500">Previous Hash</p>
                                  <code className="text-xs font-mono break-all">{event.hashPrev || "GENESIS"}</code>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500">Actor Email</p>
                                <p className="text-xs">{event.actor?.email || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500">Resource ID</p>
                                <code className="text-xs font-mono">{event.resourceId || "N/A"}</code>
                              </div>
                              {event.details && (
                                <div>
                                  <p className="text-xs font-medium text-slate-500">Details</p>
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
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                        No audit events found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-500">
                    Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}
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
                    <span className="text-sm text-slate-500">
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
