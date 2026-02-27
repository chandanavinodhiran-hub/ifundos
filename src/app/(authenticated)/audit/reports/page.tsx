"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download, Loader2, FileText, Brain, Banknote,
  BarChart3, ChevronDown, ChevronUp, Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ActivityReport {
  total: number;
  categoryCounts: { CREATE: number; UPDATE: number; DELETE: number; LOGIN: number; VERIFY: number; OTHER: number };
}

interface ScoringReport {
  scoredAppCount: number;
  avgCompositeScore: number | null;
  scoreDistribution: { recommended: number; conditional: number; notRecommended: number };
  boostCount: number;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ReportsPage() {
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  function showInfo(msg: string) {
    setInfoMsg(msg);
    setTimeout(() => setInfoMsg(null), 4000);
  }

  // Activity Report
  const [activityRange, setActivityRange] = useState("7");
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityData, setActivityData] = useState<ActivityReport | null>(null);
  const [activityOpen, setActivityOpen] = useState(true);

  // Scoring Report
  const [scoringRange, setScoringRange] = useState("30");
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoringData, setScoringData] = useState<ScoringReport | null>(null);
  const [scoringOpen, setScoringOpen] = useState(true);

  // Financial Report
  const [financialOpen, setFinancialOpen] = useState(true);

  // Export
  const [exportingCSV, setExportingCSV] = useState(false);

  async function generateActivityReport() {
    setActivityLoading(true);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - Number(activityRange) * 24 * 60 * 60 * 1000);
      const params = new URLSearchParams({
        limit: "200",
        dateFrom: from.toISOString().split("T")[0],
        dateTo: now.toISOString().split("T")[0],
      });
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setActivityData({
        total: data.total || 0,
        categoryCounts: data.categoryCounts || { CREATE: 0, UPDATE: 0, DELETE: 0, LOGIN: 0, VERIFY: 0, OTHER: 0 },
      });
    } catch {
      showInfo("Failed to generate activity report");
    } finally {
      setActivityLoading(false);
    }
  }

  async function generateScoringReport() {
    setScoringLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setScoringData({
        scoredAppCount: data.scoredAppCount || 0,
        avgCompositeScore: data.avgCompositeScore ?? null,
        scoreDistribution: data.scoreDistribution || { recommended: 0, conditional: 0, notRecommended: 0 },
        boostCount: data.boostCount || 0,
      });
    } catch {
      showInfo("Failed to generate scoring report");
    } finally {
      setScoringLoading(false);
    }
  }

  async function exportFullCSV() {
    setExportingCSV(true);
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
      showInfo("CSV exported successfully");
    } catch {
      showInfo("Export failed");
    } finally {
      setExportingCSV(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Audit Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generate and export compliance and oversight reports
        </p>
      </div>

      {/* Info Message */}
      {infoMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <Info className="w-4 h-4 shrink-0" />
          {infoMsg}
        </div>
      )}

      {/* Report Card: Platform Activity Summary */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setActivityOpen(!activityOpen)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Platform Activity Summary
            </CardTitle>
            {activityOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </CardHeader>
        {activityOpen && (
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Aggregate view of all platform actions within the selected time range — authentication events, data changes, and system operations.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <Select value={activityRange} onValueChange={setActivityRange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={generateActivityReport} disabled={activityLoading} className="gap-2">
                {activityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Report
              </Button>
            </div>

            {activityData && (
              <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Total Events</p>
                  <p className="text-lg font-bold">{activityData.total.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <CategoryPill label="Created" count={activityData.categoryCounts.CREATE} color="bg-emerald-100 text-emerald-700" />
                  <CategoryPill label="Updated" count={activityData.categoryCounts.UPDATE} color="bg-blue-100 text-blue-700" />
                  <CategoryPill label="Deleted" count={activityData.categoryCounts.DELETE} color="bg-red-100 text-red-700" />
                  <CategoryPill label="Auth" count={activityData.categoryCounts.LOGIN} color="bg-gray-100 text-gray-600" />
                  <CategoryPill label="Verify/AI" count={activityData.categoryCounts.VERIFY} color="bg-purple-100 text-purple-700" />
                  <CategoryPill label="Other" count={activityData.categoryCounts.OTHER} color="bg-amber-100 text-amber-700" />
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Report Card: AI Scoring Audit */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setScoringOpen(!scoringOpen)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Scoring Audit
            </CardTitle>
            {scoringOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </CardHeader>
        {scoringOpen && (
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Overview of AI-generated scores, distribution analysis, and manual override activity for accountability and bias monitoring.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <Select value={scoringRange} onValueChange={setScoringRange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={generateScoringReport} disabled={scoringLoading} className="gap-2">
                {scoringLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                Generate Report
              </Button>
            </div>

            {scoringData && (
              <div className="p-4 rounded-xl bg-muted/30 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Applications Scored</p>
                    <p className="text-xl font-bold text-purple-700">{scoringData.scoredAppCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Average Composite Score</p>
                    <p className="text-xl font-bold text-leaf-700">
                      {scoringData.avgCompositeScore !== null ? scoringData.avgCompositeScore.toFixed(1) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Manual Overrides</p>
                    <p className="text-xl font-bold text-amber-700">{scoringData.boostCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Override Rate</p>
                    <p className="text-xl font-bold text-gray-700">
                      {scoringData.scoredAppCount > 0
                        ? ((scoringData.boostCount / scoringData.scoredAppCount) * 100).toFixed(1) + "%"
                        : "—"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Score Distribution</p>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Recommended: {scoringData.scoreDistribution.recommended}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                      Conditional: {scoringData.scoreDistribution.conditional}
                    </Badge>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      Not Recommended: {scoringData.scoreDistribution.notRecommended}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Report Card: Financial Oversight */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setFinancialOpen(!financialOpen)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              Financial Oversight
            </CardTitle>
            {financialOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
        </CardHeader>
        {financialOpen && (
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Disbursement tracking, budget utilization, and contract payment verification across all programs.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <Select defaultValue="30">
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => showInfo("Financial reporting will be available in the next release")}
                className="gap-2"
              >
                <Banknote className="w-4 h-4" />
                Generate Report
              </Button>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-dashed border-muted-foreground/20">
              <p className="text-sm text-muted-foreground text-center">
                Financial reporting module is being finalized and will be available in the next release.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5 text-leaf-600" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-leaf-100 bg-leaf-50/30">
              <p className="text-sm font-medium mb-1">Full Audit Trail (CSV)</p>
              <p className="text-xs text-muted-foreground mb-3">
                Download the complete audit log with all events, actors, timestamps, and hash chain data.
              </p>
              <Button variant="outline" onClick={exportFullCSV} disabled={exportingCSV} className="gap-2 w-full">
                {exportingCSV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Audit Trail CSV
              </Button>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30">
              <p className="text-sm font-medium mb-1">Scoring Data (CSV)</p>
              <p className="text-xs text-muted-foreground mb-3">
                Export AI scoring results, decision packets, and override records for external analysis.
              </p>
              <Button
                variant="outline"
                onClick={() => showInfo("Scoring data export will be available in the next release")}
                className="gap-2 w-full"
              >
                <Download className="w-4 h-4" />
                Export Scoring CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function CategoryPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`px-3 py-2 rounded-lg text-center ${color}`}>
      <p className="text-lg font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
