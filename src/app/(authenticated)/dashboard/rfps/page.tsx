"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Calendar,
  Users,
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

const STATUS_ORDER: Record<string, number> = {
  OPEN: 0,
  DRAFT: 1,
  CLOSED: 2,
  AWARDED: 3,
};

const STATUS_VARIANT: Record<string, "neu-gold" | "neu-amber" | "neu"> = {
  OPEN: "neu-gold",
  DRAFT: "neu-amber",
  CLOSED: "neu",
  AWARDED: "neu",
};

function accentLeftForStatus(status: string): string {
  if (status === "OPEN") return "accent-left-green";
  if (status === "DRAFT") return "accent-left-amber";
  return "";
}

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
  /* Sort RFPs: OPEN first, DRAFT second, CLOSED/AWARDED last          */
  /* ---------------------------------------------------------------- */
  const sortedRfps = [...rfps].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-[180px]">
      {/* Header */}
      <div>
        <p className="text-eyebrow">RFP MANAGER</p>
        <h1 className="text-xl font-bold text-sovereign-charcoal font-display">Your RFPs</h1>
      </div>

      {/* RFP Card Grid */}
      {sortedRfps.length === 0 ? (
        <Card variant="neu-inset">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center pt-6">
            <div className="empty-icon-well w-14 h-14 rounded-2xl flex items-center justify-center mb-3">
              <FileText className="w-7 h-7 text-sovereign-stone" />
            </div>
            <p className="text-sovereign-stone font-medium">No RFPs created yet</p>
            <p className="text-sm text-sovereign-stone/70 mt-1">
              Tap the + button to create your first RFP
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedRfps.map((rfp) => {
            const daysLeft = rfp.deadline
              ? Math.ceil(
                  (new Date(rfp.deadline).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;
            const daysLabel =
              daysLeft === null
                ? "No deadline"
                : daysLeft <= 0
                ? "Closed"
                : `${daysLeft}d left`;
            const daysColor =
              daysLeft !== null && daysLeft > 0 && daysLeft <= 3
                ? "#9c4a4a"
                : daysLeft !== null && daysLeft > 3 && daysLeft <= 7
                ? "#b87a3f"
                : undefined;

            return (
              <Card
                key={rfp.id}
                variant="neu-raised"
                className={`relative cursor-pointer transition-transform active:scale-[0.98] ${accentLeftForStatus(rfp.status)}`}
                onClick={() => router.push(`/dashboard/rfps/${rfp.id}`)}
              >
                <CardContent className="p-5 pt-5 space-y-3">
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-bold text-sovereign-charcoal leading-snug line-clamp-2">
                      {rfp.title}
                    </h3>
                    {rfp.status === "OPEN" ? (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
                        style={{
                          color: "#4a7c59",
                          background: "var(--neu-dark)",
                          boxShadow: "inset 2px 2px 4px rgba(156,148,130,0.35), inset -2px -2px 4px rgba(255,250,240,0.6)",
                        }}
                      >
                        {rfp.status}
                      </span>
                    ) : (
                      <Badge
                        variant={STATUS_VARIANT[rfp.status] ?? "neu"}
                        className="shadow-neu-inset shrink-0"
                      >
                        {rfp.status}
                      </Badge>
                    )}
                  </div>

                  {/* Program name */}
                  <p className="text-xs text-sovereign-stone">
                    {rfp.program?.name ?? "No program"}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Applications count */}
                    <div className="flex items-center gap-1.5 text-xs text-sovereign-stone">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-semibold text-sovereign-charcoal">
                        {rfp._count?.applications ?? 0}
                      </span>
                      <span>applications</span>
                    </div>

                    {/* Deadline */}
                    <div
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: daysColor || "#9a9488", fontWeight: daysColor ? 600 : 400 }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{daysLabel}</span>
                    </div>
                  </div>

                  {/* Deadline date */}
                  {rfp.deadline && (
                    <p className="text-[11px] font-mono text-sovereign-stone/70">
                      Due: {new Date(rfp.deadline).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Action Button — gold gradient */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="fixed right-6 bottom-[100px] md:bottom-8 z-50 w-14 h-14 rounded-full text-sovereign-charcoal flex items-center justify-center cursor-pointer transition-all"
            style={{
              background: "linear-gradient(135deg, #b8943f, #d4b665)",
              boxShadow: "4px 4px 12px rgba(156,148,130,0.5), -4px -4px 12px rgba(255,250,240,0.6), 0 0 16px rgba(184,148,63,0.2)",
            }}
            aria-label="Create RFP"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </DialogTrigger>

        {/* ===== CREATE DIALOG ===== */}
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-neu-base">
          <DialogHeader>
            <DialogTitle className="text-xl text-sovereign-charcoal font-display">
              Create New RFP
            </DialogTitle>
            <p className="text-sm text-sovereign-stone">6 sections to complete</p>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-between px-2 py-3 mb-2">
            {["Basic Info", "Eligibility", "Scoring", "Evidence", "Questionnaire", "Deadline"].map((step, idx) => (
              <div key={step} className="flex items-center">
                {idx > 0 && <div className="w-4 sm:w-6 h-0.5 bg-sovereign-stone/20 mx-0.5" />}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-neu-dark shadow-neu-inset text-sovereign-charcoal flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-[10px] text-sovereign-stone hidden sm:block">{step}</span>
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
                className="flex h-10 w-full rounded-xl border-0 bg-neu-dark shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/60 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                placeholder="RFP title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-xl border-0 bg-neu-dark shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/60 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                placeholder="Describe the RFP scope and objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Separator className="bg-sovereign-stone/15" />

            {/* ==================== ELIGIBILITY ==================== */}
            <Card variant="neu-inset">
              <CardContent className="space-y-4 p-5 pt-5">
                <h3 className="text-sm font-bold text-sovereign-charcoal">Eligibility Criteria</h3>

                {/* Min capitalization */}
                <div className="space-y-2">
                  <Label>Minimum Capitalization (SAR)</Label>
                  <input
                    type="number"
                    className="flex h-10 w-full rounded-xl border-0 bg-neu-base shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/60 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
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
                          className="rounded border-sovereign-stone/30"
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
                      className="flex h-10 flex-1 rounded-xl border-0 bg-neu-base shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/60 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
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
                    <Button
                      variant="neu-secondary"
                      size="sm"
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
                    </Button>
                  </div>
                  {certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {certifications.map((cert, i) => (
                        <Badge key={i} variant="neu-gold" className="gap-1">
                          {cert}
                          <button
                            type="button"
                            className="hover:text-critical"
                            onClick={() =>
                              setCertifications((prev) =>
                                prev.filter((_, j) => j !== i)
                              )
                            }
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Geographic restrictions */}
                <div className="space-y-2">
                  <Label>Geographic Restrictions</Label>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-xl border-0 bg-neu-base shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/60 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                    placeholder="e.g. Saudi Arabia only"
                    value={geoRestrictions}
                    onChange={(e) => setGeoRestrictions(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ==================== SCORING RUBRIC ==================== */}
            <Card variant="neu-inset">
              <CardContent className="space-y-4 p-5 pt-5">
                <h3 className="text-sm font-bold text-sovereign-charcoal">Scoring Rubric</h3>
                {scoring.map((dim, i) => (
                  <div key={dim.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dim.name}</span>
                      <span className="text-xs text-sovereign-stone font-mono">
                        Weight: {dim.weight}%
                      </span>
                    </div>
                    <textarea
                      className="flex min-h-[60px] w-full rounded-xl border-0 bg-neu-base shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/60 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
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
            <Card variant="neu-inset">
              <CardContent className="p-5 pt-5">
                <h3 className="text-sm font-bold text-sovereign-charcoal mb-3">Evidence Requirements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EVIDENCE_OPTIONS.map((ev) => (
                    <label
                      key={ev}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-sovereign-stone/30"
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
            <Card variant="neu-inset">
              <CardContent className="space-y-4 p-5 pt-5">
                <h3 className="text-sm font-bold text-sovereign-charcoal">Interview Questionnaire</h3>
                <p className="text-sm text-sovereign-stone -mt-1 mb-3">These questions will be sent to shortlisted contractors during the interview phase of the pipeline.</p>
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-[14px] bg-neu-base shadow-neu-raised-sm p-4 space-y-3"
                  >
                    {/* Remove button */}
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-sovereign-stone hover:text-critical"
                      onClick={() => removeQuestion(idx)}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Question text */}
                    <textarea
                      className="flex min-h-[60px] w-full rounded-xl border-0 bg-neu-dark shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/60 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                      value={q.questionText}
                      onChange={(e) =>
                        updateQuestion(idx, "questionText", e.target.value)
                      }
                    />

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Type */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-sovereign-stone">
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
                          className="rounded border-sovereign-stone/30"
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
                          className="p-1 rounded-lg hover:bg-neu-dark disabled:opacity-30"
                          disabled={idx === 0}
                          onClick={() => moveQuestion(idx, -1)}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded-lg hover:bg-neu-dark disabled:opacity-30"
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
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-sovereign-stone/25 px-4 py-2 text-sm text-sovereign-stone hover:border-sovereign-gold hover:text-sovereign-gold transition-colors"
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
                className="flex h-10 w-full rounded-xl border-0 bg-neu-dark shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal focus:outline-none focus:ring-2 focus:ring-sovereign-gold/40"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <Separator className="bg-sovereign-stone/15" />

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="neu-secondary"
                disabled={saving || !programId || !title}
                onClick={() => handleSubmit("DRAFT")}
              >
                {saving && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Save as Draft
              </Button>
              <Button
                variant="neu-gold"
                disabled={saving || !programId || !title}
                onClick={() => handleSubmit("OPEN")}
              >
                {saving && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
