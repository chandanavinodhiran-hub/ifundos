"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Program {
  id: string;
  name: string;
  description: string | null;
  budgetTotal: number;
  budgetAllocated: number;
  budgetDisbursed: number;
  status: string;
  rfps: { id: string; title: string; status: string; deadline: string }[];
  _count: { contracts: number };
}

interface ScoringWeights {
  procurementIntegrity: number;
  visionAlignment: number;
  scientificViability: number;
  impactPotential: number;
}

interface SystemToggles {
  requireMfaFundManagers: boolean;
  autoScoreOnSubmission: boolean;
  enableSlideSolveChecks: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-leaf-100 text-leaf-800 border-leaf-200",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-200",
  DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

function formatSAR(n: number): string {
  return `SAR ${n.toLocaleString()}`;
}

function formatBudgetInput(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString();
}

function parseBudgetInput(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export default function SystemConfigurationPage() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [weights, setWeights] = useState<ScoringWeights>({
    procurementIntegrity: 25,
    visionAlignment: 25,
    scientificViability: 25,
    impactPotential: 25,
  });
  const [toggles, setToggles] = useState<SystemToggles>({
    requireMfaFundManagers: false,
    autoScoreOnSubmission: true,
    enableSlideSolveChecks: true,
  });
  const [loading, setLoading] = useState(true);
  const [savingWeights, setSavingWeights] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: "", description: "", budgetTotal: "", status: "ACTIVE",
    objective: "", region: "", startDate: "", endDate: "",
  });
  const [budgetDisplay, setBudgetDisplay] = useState("");

  const fetchPrograms = useCallback(async () => {
    const res = await fetch("/api/programs");
    const data = await res.json();
    setPrograms(data.programs || []);
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (data.scoringWeights) setWeights(data.scoringWeights);
    if (data.systemToggles) setToggles(data.systemToggles);
  }, []);

  useEffect(() => {
    Promise.all([fetchPrograms(), fetchSettings()]).finally(() => setLoading(false));
  }, [fetchPrograms, fetchSettings]);

  async function saveWeights() {
    setSavingWeights(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoringWeights: weights, systemToggles: toggles }),
      });
      toast({ type: "success", title: "Scoring weights saved" });
    } catch (err) {
      console.error("Failed to save weights:", err);
      toast({ type: "error", title: "Failed to save weights" });
    } finally {
      setSavingWeights(false);
    }
  }

  async function handleToggleChange(key: keyof SystemToggles, value: boolean) {
    const updated = { ...toggles, [key]: value };
    setToggles(updated);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoringWeights: weights, systemToggles: updated }),
      });
      toast({ type: "success", title: "Setting updated" });
    } catch (err) {
      console.error("Failed to save toggle:", err);
      toast({ type: "error", title: "Failed to save setting" });
    }
  }

  async function createProgram() {
    setSavingProgram(true);
    try {
      const sgiTargets: Record<string, string> = {};
      if (programForm.objective) sgiTargets.objective = programForm.objective;
      if (programForm.region) sgiTargets.region = programForm.region;
      if (programForm.startDate) sgiTargets.startDate = programForm.startDate;
      if (programForm.endDate) sgiTargets.endDate = programForm.endDate;

      await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: programForm.name,
          description: programForm.description || null,
          budgetTotal: parseBudgetInput(programForm.budgetTotal),
          status: programForm.status,
          sgiTargets: Object.keys(sgiTargets).length > 0 ? JSON.stringify(sgiTargets) : null,
        }),
      });
      setProgramDialogOpen(false);
      setProgramForm({ name: "", description: "", budgetTotal: "", status: "ACTIVE", objective: "", region: "", startDate: "", endDate: "" });
      setBudgetDisplay("");
      fetchPrograms();
      toast({ type: "success", title: "Program created" });
    } catch (err) {
      console.error("Failed to create program:", err);
      toast({ type: "error", title: "Failed to create program" });
    } finally {
      setSavingProgram(false);
    }
  }

  function updateWeight(key: keyof ScoringWeights, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">System Configuration</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage programs, scoring, and system settings</p>
      </div>

      {/* Programs Section */}
      <Card className="rounded-md">
        <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-base font-semibold text-slate-900">
            Funding Programs
          </CardTitle>
          <Button size="sm" onClick={() => setProgramDialogOpen(true)} className="gap-1 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add Program
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program Name</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="hidden md:table-cell">Allocated</TableHead>
                <TableHead className="hidden md:table-cell">Disbursed</TableHead>
                <TableHead className="hidden sm:table-cell">RFPs</TableHead>
                <TableHead className="hidden sm:table-cell">Contracts</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatSAR(p.budgetTotal)}
                  </TableCell>
                  <TableCell className="font-mono text-sm hidden md:table-cell">
                    {formatSAR(p.budgetAllocated)}
                  </TableCell>
                  <TableCell className="font-mono text-sm hidden md:table-cell">
                    {formatSAR(p.budgetDisbursed)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{p.rfps.length}</TableCell>
                  <TableCell className="hidden sm:table-cell">{p._count.contracts}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[p.status] || ""}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No programs created yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Weights */}
      <Card className="rounded-md">
        <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Scoring Weights
            </CardTitle>
            <Badge variant="outline" className={totalWeight === 100 ? "bg-leaf-100 text-leaf-800 border-leaf-200" : "bg-red-100 text-red-800 border-red-200"}>
              Total: {totalWeight}%
            </Badge>
          </div>
          <Button size="sm" onClick={saveWeights} disabled={savingWeights || totalWeight !== 100} className="gap-1 w-full sm:w-auto">
            {savingWeights && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Weights
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-6">
          <p className="text-sm text-slate-500">
            Configure the weight distribution for proposal scoring criteria. Weights must total 100%.
          </p>
          <div className="space-y-5">
            {([
              { key: "procurementIntegrity" as const, label: "Procurement Integrity", desc: "Compliance with procurement standards and regulations" },
              { key: "visionAlignment" as const, label: "Vision Alignment", desc: "Alignment with Saudi Green Initiative goals" },
              { key: "scientificViability" as const, label: "Scientific Viability", desc: "Technical and scientific feasibility of the proposal" },
              { key: "impactPotential" as const, label: "Impact Potential", desc: "Expected environmental and socioeconomic impact" },
            ]).map(({ key, label, desc }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={weights[key]}
                      onChange={(e) => updateWeight(key, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-slate-500 w-4">%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-leaf-600 h-2 rounded-full transition-all"
                    style={{ width: `${weights[key]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {totalWeight !== 100 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              Weights must total exactly 100%. Currently at {totalWeight}%.
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Toggles */}
      <Card className="rounded-md">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            System Toggles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-1">
          <div className="flex items-center justify-between py-4">
            <div>
              <Label className="text-sm font-medium">Require MFA for Fund Managers</Label>
              <p className="text-xs text-slate-500 mt-0.5">
                Enforce multi-factor authentication for fund manager accounts
              </p>
            </div>
            <Switch
              checked={toggles.requireMfaFundManagers}
              onCheckedChange={(v) => handleToggleChange("requireMfaFundManagers", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-4">
            <div>
              <Label className="text-sm font-medium">AI Auto-Score on Submission</Label>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically trigger AI scoring when an application is submitted
              </p>
            </div>
            <Switch
              checked={toggles.autoScoreOnSubmission}
              onCheckedChange={(v) => handleToggleChange("autoScoreOnSubmission", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-4">
            <div>
              <Label className="text-sm font-medium">AI Integrity Verification</Label>
              <p className="text-xs text-slate-500 mt-0.5">
                Run automated AI integrity verification on evidence submissions
              </p>
            </div>
            <Switch
              checked={toggles.enableSlideSolveChecks}
              onCheckedChange={(v) => handleToggleChange("enableSlideSolveChecks", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Program Dialog */}
      <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Funding Program</DialogTitle>
            <DialogDescription>Set up a new funding program for the Saudi Environmental Fund.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Program Name</Label>
              <Input
                value={programForm.name}
                onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                placeholder="e.g., Desert Restoration Initiative"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={programForm.description}
                onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                placeholder="Brief description of the program goals"
              />
            </div>
            <div className="space-y-2">
              <Label>Objective</Label>
              <Textarea
                value={programForm.objective}
                onChange={(e) => setProgramForm({ ...programForm, objective: e.target.value })}
                placeholder="Detailed program objective and expected outcomes"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total Budget (SAR)</Label>
                <Input
                  value={budgetDisplay}
                  onChange={(e) => {
                    const raw = parseBudgetInput(e.target.value);
                    setProgramForm({ ...programForm, budgetTotal: raw });
                    setBudgetDisplay(raw ? Number(raw).toLocaleString() : "");
                  }}
                  onBlur={() => {
                    if (programForm.budgetTotal) {
                      setBudgetDisplay(formatBudgetInput(programForm.budgetTotal));
                    }
                  }}
                  placeholder="500,000,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input
                  value={programForm.region}
                  onChange={(e) => setProgramForm({ ...programForm, region: e.target.value })}
                  placeholder="e.g., Tabuk Province"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={programForm.status} onValueChange={(v) => setProgramForm({ ...programForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={programForm.startDate}
                  onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={programForm.endDate}
                  onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramDialogOpen(false)}>Cancel</Button>
            <Button onClick={createProgram} disabled={savingProgram} className="gap-2">
              {savingProgram && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
