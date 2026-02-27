"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  FileText,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface RFP {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  createdAt: string;
  program: { name: string };
  _count: { applications: number };
}

interface Program {
  id: string;
  name: string;
}

interface QuestionItem {
  questionText: string;
  questionType: string;
  isRequired: boolean;
}

interface ScoringDimension {
  name: string;
  weight: number;
  criteria: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const BUSINESS_CATEGORIES = [
  "Environmental",
  "Construction",
  "Agriculture",
  "Water Management",
  "Marine",
  "Renewable Energy",
];

const EVIDENCE_OPTIONS = [
  "Site photos",
  "Drone surveys",
  "Soil analysis reports",
  "Species survival data",
  "Water budget analysis",
  "Environmental impact assessment",
  "Team CVs",
  "Financial statements",
  "Past project references",
];

const DEFAULT_QUESTIONS: QuestionItem[] = [
  {
    questionText:
      "Describe your team's experience with native tree planting in arid environments.",
    questionType: "LONG_ANSWER",
    isRequired: true,
  },
  {
    questionText:
      "What irrigation methodology will you use and why?",
    questionType: "LONG_ANSWER",
    isRequired: true,
  },
  {
    questionText:
      "Provide references from 3 previous environmental projects.",
    questionType: "FILE_UPLOAD",
    isRequired: true,
  },
  {
    questionText:
      "What is your proposed timeline for achieving 80% survival rate at 12 months?",
    questionType: "SHORT_ANSWER",
    isRequired: true,
  },
  {
    questionText:
      "Describe your approach to post-planting maintenance for the first 36 months.",
    questionType: "LONG_ANSWER",
    isRequired: true,
  },
];

const DEFAULT_SCORING: ScoringDimension[] = [
  { name: "Procurement Integrity", weight: 25, criteria: "Compliance with procurement regulations, documentation completeness, and conflict-of-interest checks" },
  { name: "Vision Alignment", weight: 25, criteria: "Alignment with Saudi Green Initiative goals, program objectives, and environmental sustainability targets" },
  { name: "Scientific Viability", weight: 25, criteria: "Technical feasibility, methodology rigor, species selection rationale, and survival rate projections" },
  { name: "Impact Potential", weight: 25, criteria: "Estimated environmental impact, scalability, community benefit, and long-term sustainability plan" },
];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-700",
  CLOSED: "bg-orange-100 text-orange-700",
  AWARDED: "bg-blue-100 text-blue-700",
};

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function RFPManagerPage() {
  const router = useRouter();

  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* --- programs for the dropdown --- */
  const [programs, setPrograms] = useState<Program[]>([]);

  /* --- form state --- */
  const [programId, setProgramId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  /* eligibility */
  const [minCapitalization, setMinCapitalization] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minTrustTier, setMinTrustTier] = useState("T0");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [geoRestrictions, setGeoRestrictions] = useState("");

  /* scoring rubric */
  const [scoring, setScoring] = useState<ScoringDimension[]>(
    DEFAULT_SCORING.map((d) => ({ ...d }))
  );

  /* evidence */
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);

  /* questionnaire */
  const [questions, setQuestions] = useState<QuestionItem[]>(
    DEFAULT_QUESTIONS.map((q) => ({ ...q }))
  );

  /* submission */
  const [saving, setSaving] = useState(false);

  /* ---------------------------------------------------------------- */
  /* Fetch RFPs                                                        */
  /* ---------------------------------------------------------------- */
  const fetchRfps = useCallback(async () => {
    try {
      const res = await fetch("/api/rfps");
      if (res.ok) {
        const data = await res.json();
        setRfps(data.rfps ?? []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRfps();
  }, [fetchRfps]);

  /* fetch programs when dialog opens */
  useEffect(() => {
    if (!dialogOpen) return;
    fetch("/api/programs")
      .then((r) => r.json())
      .then((d) => setPrograms(d.programs ?? []))
      .catch(() => {});
  }, [dialogOpen]);

  /* ---------------------------------------------------------------- */
  /* Reset form                                                        */
  /* ---------------------------------------------------------------- */
  const resetForm = () => {
    setProgramId("");
    setTitle("");
    setDescription("");
    setDeadline("");
    setMinCapitalization("");
    setSelectedCategories([]);
    setMinTrustTier("T0");
    setCertifications([]);
    setCertInput("");
    setGeoRestrictions("");
    setScoring(DEFAULT_SCORING.map((d) => ({ ...d })));
    setSelectedEvidence([]);
    setQuestions(DEFAULT_QUESTIONS.map((q) => ({ ...q })));
  };

  /* ---------------------------------------------------------------- */
  /* Submit RFP                                                        */
  /* ---------------------------------------------------------------- */
  const handleSubmit = async (status: "DRAFT" | "OPEN") => {
    if (!programId || !title) return;
    setSaving(true);
    try {
      const body = {
        programId,
        title,
        description,
        deadline: deadline || null,
        status,
        eligibilityCriteria: JSON.stringify({
          minCapitalization: minCapitalization
            ? parseFloat(minCapitalization)
            : null,
          businessCategories: selectedCategories,
          minTrustTier,
          certifications,
          geoRestrictions: geoRestrictions || null,
        }),
        scoringRubric: JSON.stringify(scoring),
        evidenceRequirements: JSON.stringify(selectedEvidence),
        questionnaireConfig: JSON.stringify(questions),
      };

      const res = await fetch("/api/rfps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        resetForm();
        setDialogOpen(false);
        setLoading(true);
        fetchRfps();
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Question helpers                                                   */
  /* ---------------------------------------------------------------- */
  const updateQuestion = (
    idx: number,
    field: keyof QuestionItem,
    value: string | boolean
  ) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ---------------------------------------------------------------- */
  /* Category / evidence toggle                                        */
  /* ---------------------------------------------------------------- */
  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleEvidence = (ev: string) =>
    setSelectedEvidence((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">RFP Manager</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage Requests for Proposals
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-600 transition-colors w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Create New RFP
            </button>
          </DialogTrigger>

          {/* ===== CREATE DIALOG ===== */}
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900">
                Create New RFP
              </DialogTitle>
              <p className="text-sm text-muted-foreground">6 sections to complete</p>
            </DialogHeader>

            {/* Step Indicator */}
            <div className="flex items-center justify-between px-2 py-3 mb-2">
              {["Basic Info", "Eligibility", "Scoring", "Evidence", "Questionnaire", "Deadline"].map((step, idx) => (
                <div key={step} className="flex items-center">
                  {idx > 0 && <div className="w-4 sm:w-6 h-0.5 bg-gray-200 mx-0.5" />}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-leaf-100 text-leaf-700 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{step}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6 mt-2">
              {/* Program */}
              <div className="space-y-2">
                <Label>Program *</Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="RFP title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="Describe the RFP scope and objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Separator />

              {/* ==================== ELIGIBILITY ==================== */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Eligibility Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Min capitalization */}
                  <div className="space-y-2">
                    <Label>Minimum Capitalization (SAR)</Label>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="e.g. 1000000"
                      value={minCapitalization}
                      onChange={(e) => setMinCapitalization(e.target.value)}
                    />
                  </div>

                  {/* Business categories */}
                  <div className="space-y-2">
                    <Label>Required Business Categories</Label>
                    <div className="flex flex-wrap gap-3">
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <label
                          key={cat}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedCategories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                          />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Min trust tier */}
                  <div className="space-y-2">
                    <Label>Minimum Trust Tier</Label>
                    <Select
                      value={minTrustTier}
                      onValueChange={setMinTrustTier}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["T0", "T1", "T2", "T3", "T4"].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-2">
                    <Label>Required Certifications</Label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        placeholder="Add certification..."
                        value={certInput}
                        onChange={(e) => setCertInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && certInput.trim()) {
                            e.preventDefault();
                            setCertifications((prev) => [
                              ...prev,
                              certInput.trim(),
                            ]);
                            setCertInput("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                        onClick={() => {
                          if (certInput.trim()) {
                            setCertifications((prev) => [
                              ...prev,
                              certInput.trim(),
                            ]);
                            setCertInput("");
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {certifications.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {certifications.map((cert, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-leaf-600/10 text-leaf-700 px-2.5 py-0.5 text-xs font-medium"
                          >
                            {cert}
                            <button
                              type="button"
                              className="hover:text-red-500"
                              onClick={() =>
                                setCertifications((prev) =>
                                  prev.filter((_, j) => j !== i)
                                )
                              }
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Geographic restrictions */}
                  <div className="space-y-2">
                    <Label>Geographic Restrictions</Label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="e.g. Saudi Arabia only"
                      value={geoRestrictions}
                      onChange={(e) => setGeoRestrictions(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ==================== SCORING RUBRIC ==================== */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Scoring Rubric</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scoring.map((dim, i) => (
                    <div key={dim.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{dim.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          Weight: {dim.weight}%
                        </span>
                      </div>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        placeholder="Specific evaluation criteria..."
                        value={dim.criteria}
                        onChange={(e) => {
                          const next = [...scoring];
                          next[i] = { ...next[i], criteria: e.target.value };
                          setScoring(next);
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* ==================== EVIDENCE ==================== */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Evidence Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EVIDENCE_OPTIONS.map((ev) => (
                      <label
                        key={ev}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedEvidence.includes(ev)}
                          onChange={() => toggleEvidence(ev)}
                        />
                        {ev}
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ==================== QUESTIONNAIRE ==================== */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Interview Questionnaire
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground -mt-1 mb-3">These questions will be sent to shortlisted contractors during the interview phase of the pipeline.</p>
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border p-4 space-y-3"
                    >
                      {/* Remove button */}
                      <button
                        type="button"
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        onClick={() => removeQuestion(idx)}
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Question text */}
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={q.questionText}
                        onChange={(e) =>
                          updateQuestion(idx, "questionText", e.target.value)
                        }
                      />

                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Type */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">
                            Type
                          </Label>
                          <Select
                            value={q.questionType}
                            onValueChange={(v) =>
                              updateQuestion(idx, "questionType", v)
                            }
                          >
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SHORT_ANSWER">
                                Short Answer
                              </SelectItem>
                              <SelectItem value="LONG_ANSWER">
                                Long Answer
                              </SelectItem>
                              <SelectItem value="MULTIPLE_CHOICE">
                                Multiple Choice
                              </SelectItem>
                              <SelectItem value="FILE_UPLOAD">
                                File Upload
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Required */}
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={q.isRequired}
                            onChange={(e) =>
                              updateQuestion(
                                idx,
                                "isRequired",
                                e.target.checked
                              )
                            }
                          />
                          Required
                        </label>

                        {/* Reorder */}
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                            disabled={idx === 0}
                            onClick={() => moveQuestion(idx, -1)}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                            disabled={idx === questions.length - 1}
                            onClick={() => moveQuestion(idx, 1)}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-muted-foreground hover:border-leaf-500 hover:text-leaf-600 transition-colors"
                    onClick={() =>
                      setQuestions((prev) => [
                        ...prev,
                        {
                          questionText: "",
                          questionType: "LONG_ANSWER",
                          isRequired: true,
                        },
                      ])
                    }
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </CardContent>
              </Card>

              {/* Deadline */}
              <div className="space-y-2">
                <Label>Deadline</Label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={saving || !programId || !title}
                  className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  onClick={() => handleSubmit("DRAFT")}
                >
                  {saving && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={saving || !programId || !title}
                  className="inline-flex items-center gap-2 rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-600 transition-colors disabled:opacity-50"
                  onClick={() => handleSubmit("OPEN")}
                >
                  {saving && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Publish
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* RFP Table */}
      <Card>
        <CardContent className="p-0">
          {rfps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground">No RFPs created yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click &quot;Create New RFP&quot; to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-4 text-muted-foreground">
                      Title
                    </th>
                    <th className="text-left font-medium p-4 text-muted-foreground hidden md:table-cell">
                      Program
                    </th>
                    <th className="text-left font-medium p-4 text-muted-foreground">
                      Status
                    </th>
                    <th className="text-center font-medium p-4 text-muted-foreground">
                      Apps
                    </th>
                    <th className="text-left font-medium p-4 text-muted-foreground hidden sm:table-cell">
                      Deadline
                    </th>
                    <th className="text-center font-medium p-4 text-muted-foreground hidden sm:table-cell">
                      Days Left
                    </th>
                    <th className="text-left font-medium p-4 text-muted-foreground hidden lg:table-cell">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rfps.map((rfp) => {
                    const daysLeft = rfp.deadline ? Math.ceil((new Date(rfp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                    const daysColor = daysLeft === null ? "text-gray-400" : daysLeft <= 0 ? "text-gray-400" : daysLeft <= 3 ? "text-red-600 font-semibold" : daysLeft <= 7 ? "text-amber-600 font-medium" : "text-green-600";
                    const daysLabel = daysLeft === null ? "—" : daysLeft <= 0 ? "Closed" : `${daysLeft}d left`;
                    return (
                    <tr
                      key={rfp.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(`/dashboard/rfps/${rfp.id}`)
                      }
                    >
                      <td className="p-4 font-medium">{rfp.title}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">
                        {rfp.program?.name ?? "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_BADGE[rfp.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {rfp.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          className="text-ocean-600 hover:underline font-semibold cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/rfps/${rfp.id}?tab=applications`);
                          }}
                        >
                          {rfp._count?.applications ?? 0}
                        </button>
                      </td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">
                        {rfp.deadline
                          ? new Date(rfp.deadline).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className={`p-4 text-center text-xs hidden sm:table-cell ${daysColor}`}>
                        {daysLabel}
                      </td>
                      <td className="p-4 text-muted-foreground hidden lg:table-cell">
                        {new Date(rfp.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
