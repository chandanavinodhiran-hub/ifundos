"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Upload,
  Save,
  Send,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
interface EvidenceRequirement {
  name: string;
  description?: string;
  required?: boolean;
  formats?: string[];
}

interface RFPData {
  id: string;
  title: string;
  deadline: string | null;
  evidenceRequirements: string | null;
  program: { name: string };
}

interface SpeciesRow {
  speciesName: string;
  quantity: number | "";
  source: string;
  survivalRate: number | "";
}

interface TeamMemberRow {
  name: string;
  role: string;
  yearsExperience: number | "";
  qualifications: string;
}

interface ReferenceRow {
  projectName: string;
  client: string;
  year: number | "";
  scope: string;
  outcome: string;
}

interface BudgetLineItem {
  category: string;
  description: string;
  quantity: number | "";
  unitCost: number | "";
}

interface FileRef {
  requirementName: string;
  fileName: string;
  fileSize: number;
}

// ── Step names ────────────────────────────────────────────────────
const STEP_NAMES = [
  "Project Overview",
  "Technical Proposal",
  "Team & Credentials",
  "Budget Breakdown",
  "Documents & Evidence",
  "Review & Submit",
];

const BUDGET_CATEGORIES = [
  "Seedlings",
  "Irrigation",
  "Labor",
  "Equipment",
  "Transport",
  "Monitoring",
  "Maintenance",
  "Overhead",
  "Other",
];

const IRRIGATION_METHODS = [
  "Drip irrigation",
  "Sprinkler",
  "Flood",
  "Manual",
  "None",
];
const WATER_SOURCES = ["Well", "Desalination", "Recycled", "Municipal"];

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function parseSafe<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export default function ApplicationBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rfpId } = use(params);
  const router = useRouter();

  // Loading / RFP data
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rfp, setRfp] = useState<RFPData | null>(null);
  const [evidenceReqs, setEvidenceReqs] = useState<EvidenceRequirement[]>([]);

  // Navigation
  const [currentStep, setCurrentStep] = useState(1);

  // ── Step 1: Project Overview ───────────────────────────────────
  const [projectTitle, setProjectTitle] = useState("");
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | "">("");
  const [totalBudgetRequested, setTotalBudgetRequested] = useState<number | "">("");

  // ── Step 2: Technical Proposal ─────────────────────────────────
  const [species, setSpecies] = useState<SpeciesRow[]>([
    { speciesName: "", quantity: "", source: "Nursery", survivalRate: "" },
  ]);
  const [plantingMethodology, setPlantingMethodology] = useState("");
  const [irrigationMethod, setIrrigationMethod] = useState("Drip irrigation");
  const [waterSource, setWaterSource] = useState("Well");
  const [waterConsumption, setWaterConsumption] = useState<number | "">("");
  const [soilPreparation, setSoilPreparation] = useState("");
  const [maintenancePlan, setMaintenancePlan] = useState("");

  // ── Step 3: Team & Credentials ─────────────────────────────────
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([
    { name: "", role: "", yearsExperience: "", qualifications: "" },
  ]);
  const [similarProjects, setSimilarProjects] = useState<number | "">("");
  const [totalTreesPlanted, setTotalTreesPlanted] = useState<number | "">("");
  const [largestProject, setLargestProject] = useState<number | "">("");
  const [references, setReferences] = useState<ReferenceRow[]>([]);

  // ── Step 4: Budget Breakdown ───────────────────────────────────
  const [budgetItems, setBudgetItems] = useState<BudgetLineItem[]>([
    { category: "Seedlings", description: "", quantity: "", unitCost: "" },
  ]);

  // ── Step 5: Documents ──────────────────────────────────────────
  const [fileRefs, setFileRefs] = useState<FileRef[]>([]);

  // ── Fetch RFP ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchRFP() {
      try {
        const res = await fetch(`/api/rfps/${rfpId}`);
        if (!res.ok) throw new Error("Failed to fetch RFP");
        const data = await res.json();
        const rfpData = data.rfp || data;
        setRfp(rfpData);
        setEvidenceReqs(
          parseSafe<EvidenceRequirement[]>(rfpData.evidenceRequirements, [])
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load RFP");
      } finally {
        setLoading(false);
      }
    }
    fetchRFP();
  }, [rfpId]);

  // ── Species CRUD ───────────────────────────────────────────────
  const addSpecies = () =>
    setSpecies([
      ...species,
      { speciesName: "", quantity: "", source: "Nursery", survivalRate: "" },
    ]);
  const removeSpecies = (idx: number) =>
    setSpecies(species.filter((_, i) => i !== idx));
  const updateSpecies = (idx: number, field: keyof SpeciesRow, value: string | number) =>
    setSpecies(species.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  // ── Team CRUD ──────────────────────────────────────────────────
  const addTeamMember = () =>
    setTeamMembers([
      ...teamMembers,
      { name: "", role: "", yearsExperience: "", qualifications: "" },
    ]);
  const removeTeamMember = (idx: number) =>
    setTeamMembers(teamMembers.filter((_, i) => i !== idx));
  const updateTeamMember = (idx: number, field: keyof TeamMemberRow, value: string | number) =>
    setTeamMembers(
      teamMembers.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );

  // ── Reference CRUD ─────────────────────────────────────────────
  const addReference = () => {
    if (references.length < 5) {
      setReferences([
        ...references,
        { projectName: "", client: "", year: "", scope: "", outcome: "" },
      ]);
    }
  };
  const removeReference = (idx: number) =>
    setReferences(references.filter((_, i) => i !== idx));
  const updateReference = (idx: number, field: keyof ReferenceRow, value: string | number) =>
    setReferences(
      references.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );

  // ── Budget CRUD ────────────────────────────────────────────────
  const addBudgetItem = () =>
    setBudgetItems([
      ...budgetItems,
      { category: "Seedlings", description: "", quantity: "", unitCost: "" },
    ]);
  const removeBudgetItem = (idx: number) =>
    setBudgetItems(budgetItems.filter((_, i) => i !== idx));
  const updateBudgetItem = (idx: number, field: keyof BudgetLineItem, value: string | number) =>
    setBudgetItems(
      budgetItems.map((b, i) => (i === idx ? { ...b, [field]: value } : b))
    );

  const lineItemTotal = (item: BudgetLineItem) => {
    const q = typeof item.quantity === "number" ? item.quantity : 0;
    const u = typeof item.unitCost === "number" ? item.unitCost : 0;
    return q * u;
  };

  const grandTotal = budgetItems.reduce((sum, item) => sum + lineItemTotal(item), 0);
  const budgetMismatch =
    typeof totalBudgetRequested === "number" &&
    totalBudgetRequested > 0 &&
    grandTotal > 0 &&
    Math.abs(grandTotal - totalBudgetRequested) > 1;

  // ── File handling ──────────────────────────────────────────────
  const handleFileSelect = (requirementName: string, file: File | null) => {
    if (!file) return;
    setFileRefs((prev) => {
      const filtered = prev.filter((f) => f.requirementName !== requirementName);
      return [
        ...filtered,
        { requirementName, fileName: file.name, fileSize: file.size },
      ];
    });
  };

  // ── Completeness check ─────────────────────────────────────────
  const completenessChecks = useCallback(() => {
    return {
      projectTitle: projectTitle.trim().length > 0,
      executiveSummary: executiveSummary.trim().length > 0,
      atLeastOneSpecies: species.some((s) => s.speciesName.trim().length > 0),
      atLeastOneTeamMember: teamMembers.some((m) => m.name.trim().length > 0),
      atLeastOneBudgetItem: budgetItems.some(
        (b) =>
          b.description.trim().length > 0 &&
          typeof b.quantity === "number" &&
          b.quantity > 0
      ),
    };
  }, [projectTitle, executiveSummary, species, teamMembers, budgetItems]);

  const checks = completenessChecks();
  const allRequiredComplete = Object.values(checks).every(Boolean);

  // ── Build proposal data ────────────────────────────────────────
  const buildProposalData = () => ({
    projectOverview: {
      projectTitle,
      executiveSummary,
      projectLocation,
      estimatedDuration: typeof estimatedDuration === "number" ? estimatedDuration : 0,
      totalBudgetRequested: typeof totalBudgetRequested === "number" ? totalBudgetRequested : 0,
    },
    technicalProposal: {
      species: species.filter((s) => s.speciesName.trim()),
      plantingMethodology,
      irrigation: {
        method: irrigationMethod,
        waterSource,
        waterConsumptionPerTreePerYear: typeof waterConsumption === "number" ? waterConsumption : 0,
      },
      soilPreparation,
      maintenancePlan,
    },
    teamCredentials: {
      teamMembers: teamMembers.filter((m) => m.name.trim()),
      organizationalExperience: {
        similarProjectsCompleted: typeof similarProjects === "number" ? similarProjects : 0,
        totalTreesPlanted: typeof totalTreesPlanted === "number" ? totalTreesPlanted : 0,
        largestSingleProject: typeof largestProject === "number" ? largestProject : 0,
      },
      references: references.filter((r) => r.projectName.trim()),
    },
    budgetBreakdown: {
      lineItems: budgetItems
        .filter((b) => b.description.trim())
        .map((b) => ({
          ...b,
          total: lineItemTotal(b),
        })),
      grandTotal,
    },
    documents: fileRefs,
  });

  // ── Submit / Save ──────────────────────────────────────────────
  const handleSubmit = async (status: "DRAFT" | "SUBMITTED") => {
    setSubmitting(true);
    try {
      const proposalData = buildProposalData();
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfpId,
          proposalData,
          proposedBudget: typeof totalBudgetRequested === "number" ? totalBudgetRequested : grandTotal,
          status,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit application");
      }
      router.push("/contractor/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  };

  // ── Loading / Error states ─────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  if (error && !rfp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.push(`/contractor/rfps/${rfpId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to RFP
        </Button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/contractor/rfps/${rfpId}`)}
          className="text-muted-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to RFP
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Apply to RFP</h1>
        {rfp && (
          <p className="text-muted-foreground mt-1">
            {rfp.title} &mdash; {rfp.program.name}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              Step {currentStep}/6: {STEP_NAMES[currentStep - 1]}
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round(((currentStep - 1) / 5) * 100)}% complete
            </p>
          </div>
          <div className="flex gap-1">
            {STEP_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i + 1)}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i + 1 <= currentStep ? "bg-leaf-600" : "bg-gray-200"
                }`}
                title={name}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEP_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i + 1)}
                className={`text-[10px] hidden sm:block ${
                  i + 1 === currentStep
                    ? "text-leaf-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ============ STEP 1: Project Overview ============ */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectTitle">
                Project Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectTitle"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter your project title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="executiveSummary">
                Executive Summary <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="executiveSummary"
                value={executiveSummary}
                onChange={(e) => {
                  if (e.target.value.length <= 2500) {
                    setExecutiveSummary(e.target.value);
                  }
                }}
                placeholder="Provide a comprehensive overview of your proposed project..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground text-right">
                {executiveSummary.length}/2500
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectLocation">Project Location</Label>
                <Input
                  id="projectLocation"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                  placeholder="e.g., Riyadh Province"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Estimated Duration (months)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={estimatedDuration}
                  onChange={(e) =>
                    setEstimatedDuration(
                      e.target.value ? parseInt(e.target.value) : ""
                    )
                  }
                  placeholder="e.g., 24"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget Requested (SAR)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                value={totalBudgetRequested}
                onChange={(e) =>
                  setTotalBudgetRequested(
                    e.target.value ? parseFloat(e.target.value) : ""
                  )
                }
                placeholder="e.g., 5000000"
              />
              {typeof totalBudgetRequested === "number" &&
                totalBudgetRequested > 0 && (
                  <p className="text-xs text-muted-foreground">
                    SAR {formatNumber(totalBudgetRequested)}
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 2: Technical Proposal ============ */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Proposal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Species Table */}
            <div>
              <Label className="mb-2 block">
                Species Selection <span className="text-red-500">*</span>
              </Label>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Species Name</th>
                      <th className="text-left p-2 font-medium">Quantity</th>
                      <th className="text-left p-2 font-medium">Source</th>
                      <th className="text-left p-2 font-medium">Survival %</th>
                      <th className="p-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {species.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          <Input
                            value={s.speciesName}
                            onChange={(e) =>
                              updateSpecies(i, "speciesName", e.target.value)
                            }
                            placeholder="e.g., Acacia tortilis"
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            value={s.quantity}
                            onChange={(e) =>
                              updateSpecies(
                                i,
                                "quantity",
                                e.target.value ? parseInt(e.target.value) : ""
                              )
                            }
                            placeholder="0"
                            className="h-8 text-sm w-24"
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={s.source}
                            onValueChange={(v) => updateSpecies(i, "source", v)}
                          >
                            <SelectTrigger className="h-8 text-sm w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nursery">Nursery</SelectItem>
                              <SelectItem value="Wild Collection">
                                Wild Collection
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={s.survivalRate}
                            onChange={(e) =>
                              updateSpecies(
                                i,
                                "survivalRate",
                                e.target.value ? parseInt(e.target.value) : ""
                              )
                            }
                            placeholder="%"
                            className="h-8 text-sm w-20"
                          />
                        </td>
                        <td className="p-2">
                          {species.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => removeSpecies(i)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addSpecies}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Species
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Planting Methodology</Label>
              <Textarea
                value={plantingMethodology}
                onChange={(e) => setPlantingMethodology(e.target.value)}
                placeholder="Describe your planting approach, techniques, and timeline..."
                rows={4}
              />
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block font-semibold">Irrigation Plan</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={irrigationMethod}
                    onValueChange={setIrrigationMethod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IRRIGATION_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Water Source</Label>
                  <Select value={waterSource} onValueChange={setWaterSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WATER_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Water per tree/year (L)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={waterConsumption}
                    onChange={(e) =>
                      setWaterConsumption(
                        e.target.value ? parseInt(e.target.value) : ""
                      )
                    }
                    placeholder="Liters"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Soil Preparation Approach</Label>
              <Textarea
                value={soilPreparation}
                onChange={(e) => setSoilPreparation(e.target.value)}
                placeholder="Describe soil testing, amendment, and preparation plans..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Maintenance Plan (36 months)</Label>
              <Textarea
                value={maintenancePlan}
                onChange={(e) => setMaintenancePlan(e.target.value)}
                placeholder="Describe ongoing maintenance schedule, monitoring, and replanting strategy..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 3: Team & Credentials ============ */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team & Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Members */}
            <div>
              <Label className="mb-2 block">
                Key Team Members <span className="text-red-500">*</span>
              </Label>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">Role</th>
                      <th className="text-left p-2 font-medium">Yrs Exp</th>
                      <th className="text-left p-2 font-medium">Qualifications</th>
                      <th className="p-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          <Input
                            value={m.name}
                            onChange={(e) =>
                              updateTeamMember(i, "name", e.target.value)
                            }
                            placeholder="Full name"
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={m.role}
                            onChange={(e) =>
                              updateTeamMember(i, "role", e.target.value)
                            }
                            placeholder="e.g., Project Manager"
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            value={m.yearsExperience}
                            onChange={(e) =>
                              updateTeamMember(
                                i,
                                "yearsExperience",
                                e.target.value ? parseInt(e.target.value) : ""
                              )
                            }
                            placeholder="0"
                            className="h-8 text-sm w-20"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={m.qualifications}
                            onChange={(e) =>
                              updateTeamMember(
                                i,
                                "qualifications",
                                e.target.value
                              )
                            }
                            placeholder="Degrees, certifications..."
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          {teamMembers.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => removeTeamMember(i)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addTeamMember}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Team Member
              </Button>
            </div>

            <Separator />

            {/* Organizational Experience */}
            <div>
              <Label className="mb-3 block font-semibold">
                Organizational Experience
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Similar Projects Completed</Label>
                  <Input
                    type="number"
                    min={0}
                    value={similarProjects}
                    onChange={(e) =>
                      setSimilarProjects(
                        e.target.value ? parseInt(e.target.value) : ""
                      )
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Trees Planted to Date</Label>
                  <Input
                    type="number"
                    min={0}
                    value={totalTreesPlanted}
                    onChange={(e) =>
                      setTotalTreesPlanted(
                        e.target.value ? parseInt(e.target.value) : ""
                      )
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Largest Single Project (trees)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={largestProject}
                    onChange={(e) =>
                      setLargestProject(
                        e.target.value ? parseInt(e.target.value) : ""
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Past Project References */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">
                  Past Project References (up to 5)
                </Label>
                {references.length < 5 && (
                  <Button variant="outline" size="sm" onClick={addReference}>
                    <Plus className="w-4 h-4 mr-1" /> Add Reference
                  </Button>
                )}
              </div>
              {references.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No references added yet. Click &quot;Add Reference&quot; to
                  include past project details.
                </p>
              ) : (
                <div className="space-y-3">
                  {references.map((ref, i) => (
                    <div
                      key={i}
                      className="border rounded-lg p-3 space-y-3 relative"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={() => removeReference(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <p className="text-xs font-medium text-muted-foreground">
                        Reference #{i + 1}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          value={ref.projectName}
                          onChange={(e) =>
                            updateReference(i, "projectName", e.target.value)
                          }
                          placeholder="Project name"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={ref.client}
                          onChange={(e) =>
                            updateReference(i, "client", e.target.value)
                          }
                          placeholder="Client"
                          className="h-8 text-sm"
                        />
                        <Input
                          type="number"
                          value={ref.year}
                          onChange={(e) =>
                            updateReference(
                              i,
                              "year",
                              e.target.value ? parseInt(e.target.value) : ""
                            )
                          }
                          placeholder="Year"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          value={ref.scope}
                          onChange={(e) =>
                            updateReference(i, "scope", e.target.value)
                          }
                          placeholder="Scope (e.g., 50,000 trees, 200 hectares)"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={ref.outcome}
                          onChange={(e) =>
                            updateReference(i, "outcome", e.target.value)
                          }
                          placeholder="Outcome"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 4: Budget Breakdown ============ */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetMismatch && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700">
                  Budget mismatch: Total line items SAR{" "}
                  {formatNumber(grandTotal)} vs requested budget SAR{" "}
                  {formatNumber(
                    typeof totalBudgetRequested === "number"
                      ? totalBudgetRequested
                      : 0
                  )}
                </p>
              </div>
            )}

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Category</th>
                    <th className="text-left p-2 font-medium">Description</th>
                    <th className="text-left p-2 font-medium">Qty</th>
                    <th className="text-left p-2 font-medium">Unit Cost (SAR)</th>
                    <th className="text-left p-2 font-medium">Total (SAR)</th>
                    <th className="p-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {budgetItems.map((item, i) => {
                    const total = lineItemTotal(item);
                    return (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          <Select
                            value={item.category}
                            onValueChange={(v) =>
                              updateBudgetItem(i, "category", v)
                            }
                          >
                            <SelectTrigger className="h-8 text-sm w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BUDGET_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateBudgetItem(i, "description", e.target.value)
                            }
                            placeholder="Item description"
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) =>
                              updateBudgetItem(
                                i,
                                "quantity",
                                e.target.value ? parseInt(e.target.value) : ""
                              )
                            }
                            placeholder="0"
                            className="h-8 text-sm w-20"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.unitCost}
                            onChange={(e) =>
                              updateBudgetItem(
                                i,
                                "unitCost",
                                e.target.value ? parseFloat(e.target.value) : ""
                              )
                            }
                            placeholder="0"
                            className="h-8 text-sm w-28"
                          />
                        </td>
                        <td className="p-2 font-mono text-sm">
                          {total > 0 ? formatNumber(total) : "—"}
                        </td>
                        <td className="p-2">
                          {budgetItems.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => removeBudgetItem(i)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td colSpan={4} className="p-2 text-right font-semibold">
                      Grand Total:
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-900">
                      SAR {formatNumber(grandTotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <Button variant="outline" size="sm" onClick={addBudgetItem}>
              <Plus className="w-4 h-4 mr-1" /> Add Line Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 5: Documents & Evidence ============ */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-leaf-600" /> Documents & Evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evidenceReqs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No specific evidence requirements for this RFP.
              </p>
            ) : (
              <div className="space-y-4">
                {evidenceReqs.map((req, i) => {
                  const existingFile = fileRefs.find(
                    (f) => f.requirementName === req.name
                  );
                  return (
                    <div
                      key={i}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {req.name}
                            {req.required !== false && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </p>
                          {req.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {req.description}
                            </p>
                          )}
                        </div>
                        {existingFile && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                        onChange={(e) =>
                          handleFileSelect(
                            req.name,
                            e.target.files?.[0] || null
                          )
                        }
                        className="text-sm"
                      />
                      {existingFile && (
                        <p className="text-xs text-muted-foreground">
                          {existingFile.fileName} (
                          {(existingFile.fileSize / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Accepted formats: PDF, JPG, PNG, DOCX
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> For MVP, files are tracked by reference.
                Full upload coming in next phase.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 6: Review & Submit ============ */}
      {currentStep === 6 && (
        <div className="space-y-4">
          {/* Completeness Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completeness Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: "Project title", ok: checks.projectTitle },
                  { label: "Executive summary", ok: checks.executiveSummary },
                  {
                    label: "At least 1 species selected",
                    ok: checks.atLeastOneSpecies,
                  },
                  {
                    label: "At least 1 team member",
                    ok: checks.atLeastOneTeamMember,
                  },
                  {
                    label: "At least 1 budget line item",
                    ok: checks.atLeastOneBudgetItem,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {item.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ${
                        item.ok ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Review Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-leaf-600" /> Application Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1 summary */}
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-1">
                  Project Overview
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Title:</span>{" "}
                    {projectTitle || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    {projectLocation || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Duration:</span>{" "}
                    {typeof estimatedDuration === "number"
                      ? `${estimatedDuration} months`
                      : "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Budget:</span>{" "}
                    {typeof totalBudgetRequested === "number"
                      ? `SAR ${formatNumber(totalBudgetRequested)}`
                      : "—"}
                  </p>
                  {executiveSummary && (
                    <p className="mt-2">
                      <span className="text-muted-foreground">Summary:</span>{" "}
                      {executiveSummary.length > 200
                        ? executiveSummary.slice(0, 200) + "..."
                        : executiveSummary}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Step 2 summary */}
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-1">
                  Technical Proposal
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Species:</span>{" "}
                    {species.filter((s) => s.speciesName.trim()).length} selected
                  </p>
                  <p>
                    <span className="text-muted-foreground">Irrigation:</span>{" "}
                    {irrigationMethod} / {waterSource}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Step 3 summary */}
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-1">
                  Team & Credentials
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Team members:</span>{" "}
                    {teamMembers.filter((m) => m.name.trim()).length}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Similar projects:
                    </span>{" "}
                    {typeof similarProjects === "number" ? similarProjects : 0}
                  </p>
                  <p>
                    <span className="text-muted-foreground">References:</span>{" "}
                    {references.filter((r) => r.projectName.trim()).length}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Step 4 summary */}
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-1">
                  Budget Breakdown
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Line items:</span>{" "}
                    {budgetItems.filter((b) => b.description.trim()).length}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Grand total:</span>{" "}
                    SAR {formatNumber(grandTotal)}
                  </p>
                  {budgetMismatch && (
                    <p className="text-amber-600 text-xs mt-1">
                      Warning: Budget mismatch with requested amount
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Step 5 summary */}
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-1">
                  Documents
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Files selected:</span>{" "}
                    {fileRefs.length} of {evidenceReqs.length} requirements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => handleSubmit("DRAFT")}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit("SUBMITTED")}
              disabled={submitting || !allRequiredComplete}
              className="bg-leaf-600 hover:bg-leaf-600 text-white gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Application
            </Button>
            {!allRequiredComplete && (
              <p className="text-xs text-red-500">
                Complete all required fields to submit
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============ Navigation Buttons ============ */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        {currentStep < 6 && (
          <Button
            onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
            className="bg-leaf-600 hover:bg-leaf-600 text-white"
          >
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
