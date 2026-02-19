"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FolderKanban, Sliders, ToggleLeft, Plus, Loader2, Save,
} from "lucide-react";

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
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-200",
  DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export default function SystemConfigurationPage() {
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
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: "", description: "", budgetTotal: "", status: "ACTIVE",
  });

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

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoringWeights: weights, systemToggles: toggles }),
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSavingSettings(false);
    }
  }

  async function createProgram() {
    setSavingProgram(true);
    try {
      await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: programForm.name,
          description: programForm.description || null,
          budgetTotal: programForm.budgetTotal,
          status: programForm.status,
        }),
      });
      setProgramDialogOpen(false);
      setProgramForm({ name: "", description: "", budgetTotal: "", status: "ACTIVE" });
      fetchPrograms();
    } catch (err) {
      console.error("Failed to create program:", err);
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
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">System Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage programs, scoring, and system settings</p>
        </div>
        <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
          {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>

      {/* Programs Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-teal" />
            Funding Programs
          </CardTitle>
          <Button size="sm" onClick={() => setProgramDialogOpen(true)} className="gap-1">
            <Plus className="w-4 h-4" /> Add Program
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program Name</TableHead>
                <TableHead>Budget (SAR)</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Disbursed</TableHead>
                <TableHead>RFPs</TableHead>
                <TableHead>Contracts</TableHead>
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
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {(p.budgetTotal / 1_000_000).toFixed(0)}M
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {(p.budgetAllocated / 1_000_000).toFixed(1)}M
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {(p.budgetDisbursed / 1_000_000).toFixed(1)}M
                  </TableCell>
                  <TableCell>{p.rfps.length}</TableCell>
                  <TableCell>{p._count.contracts}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[p.status] || ""}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No programs created yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scoring Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal" />
            Scoring Weights
            <Badge variant="outline" className={totalWeight === 100 ? "bg-green-100 text-green-800 border-green-200 ml-2" : "bg-red-100 text-red-800 border-red-200 ml-2"}>
              Total: {totalWeight}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
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
                    <p className="text-xs text-muted-foreground">{desc}</p>
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
                    <span className="text-sm text-muted-foreground w-4">%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal h-2 rounded-full transition-all"
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-teal" />
            System Toggles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between py-4">
            <div>
              <Label className="text-sm font-medium">Require MFA for Fund Managers</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enforce multi-factor authentication for fund manager accounts
              </p>
            </div>
            <Switch
              checked={toggles.requireMfaFundManagers}
              onCheckedChange={(v) => setToggles({ ...toggles, requireMfaFundManagers: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-4">
            <div>
              <Label className="text-sm font-medium">Auto-Score on Submission</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically trigger AI scoring when an application is submitted
              </p>
            </div>
            <Switch
              checked={toggles.autoScoreOnSubmission}
              onCheckedChange={(v) => setToggles({ ...toggles, autoScoreOnSubmission: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-4">
            <div>
              <Label className="text-sm font-medium">Enable SlideSolve Integrity Checks</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Run automated integrity verification on evidence submissions
              </p>
            </div>
            <Switch
              checked={toggles.enableSlideSolveChecks}
              onCheckedChange={(v) => setToggles({ ...toggles, enableSlideSolveChecks: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Program Dialog */}
      <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
        <DialogContent className="sm:max-w-lg">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Budget (SAR)</Label>
                <Input
                  type="number"
                  value={programForm.budgetTotal}
                  onChange={(e) => setProgramForm({ ...programForm, budgetTotal: e.target.value })}
                  placeholder="500000000"
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
