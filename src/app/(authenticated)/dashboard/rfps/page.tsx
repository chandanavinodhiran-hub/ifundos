"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ArrowRight,
  ClipboardList,
  Shield,
  BarChart3,
  FileCheck,
  Building2,
} from "lucide-react";
import DynamicShadowCard from "@/components/DynamicShadowCard";

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

interface RFPDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  eligibilityCriteria: string | null;
  scoringRubric: string | null;
  evidenceRequirements: string | null;
  createdAt: string;
  program: { id: string; name: string };
  applications: {
    id: string;
    status: string;
    createdAt: string;
    organization: { id: string; name: string; type: string; trustTier: string | null };
    decisionPacket: { compositeScore: number } | null;
  }[];
  questionnaireQuestions: {
    id: string;
    questionText: string;
    questionType: string;
    isRequired: boolean;
    sortOrder: number;
  }[];
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
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* --- inline detail expansion --- */
  const [expandedRfpId, setExpandedRfpId] = useState<string | null>(null);
  const [rfpDetail, setRfpDetail] = useState<RFPDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  /* ---------------------------------------------------------------- */
  /* Toggle RFP detail expansion                                       */
  /* ---------------------------------------------------------------- */
  const toggleExpand = useCallback(
    async (rfpId: string) => {
      if (expandedRfpId === rfpId) {
        setExpandedRfpId(null);
        setRfpDetail(null);
        return;
      }
      setExpandedRfpId(rfpId);
      setRfpDetail(null);
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/rfps/${rfpId}`);
        if (res.ok) {
          const data = await res.json();
          setRfpDetail(data.rfp ?? null);
        }
      } catch {
        /* silent */
      } finally {
        setDetailLoading(false);
      }
    },
    [expandedRfpId]
  );

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
      <div className="space-y-6 pb-[180px] page-enter">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton-bar h-2 w-20 mb-2" style={{ opacity: 0.4 }} />
            <div className="skeleton-bar h-6 w-32" style={{ opacity: 0.5 }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card p-4" style={{ height: 80 }}>
              <div className="flex flex-col items-center gap-2">
                <div className="skeleton-bar h-7 w-10" style={{ opacity: 0.5 }} />
                <div className="skeleton-bar h-2 w-14" style={{ opacity: 0.3 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1,2].map(i => (
            <div key={i} className="skeleton-card p-5" style={{ height: 140 }}>
              <div className="skeleton-bar h-4 w-48 mb-3" style={{ opacity: 0.5 }} />
              <div className="skeleton-bar h-3 w-32 mb-4" style={{ opacity: 0.3 }} />
              <div className="flex items-center justify-between">
                <div className="skeleton-bar h-3 w-24" style={{ opacity: 0.3 }} />
                <div className="skeleton-bar h-3 w-16" style={{ opacity: 0.3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-[180px]">
      {/* Header */}
      <div className="flex items-center justify-between stagger-1 animate-in-1">
        <div>
          <p className="text-eyebrow">RFP MANAGER</p>
          <h1 className="text-xl font-bold text-sovereign-charcoal font-display">Your RFPs</h1>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="hidden desktop:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer neu-btn-press"
          style={{
            background: "linear-gradient(135deg, #5C6FB5, #7B8DC8)",
            color: "white",
            boxShadow: "5px 5px 15px rgba(92,111,181,0.35), -3px -3px 10px rgba(255,255,255,0.5)",
            border: "none",
          }}
        >
          <Plus className="w-4 h-4" />
          Create RFP
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 stagger-2 animate-in-2">
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-4 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 300, color: "var(--accent)" }}>
            <AnimatedCounter end={sortedRfps.length} duration={1000} />
          </span>
          <span className="label-style mt-1">Total RFPs</span>
        </DynamicShadowCard>
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-4 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 300, color: "#5CA03E" }}>
            <AnimatedCounter end={sortedRfps.filter(r => r.status === "OPEN").length} duration={1000} delay={100} />
          </span>
          <span className="label-style mt-1">Open</span>
        </DynamicShadowCard>
        <DynamicShadowCard inset intensity={2} className="neu-stat-inset p-4 flex flex-col items-center justify-center">
          <span className="stat-number" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 300, color: "var(--text-primary)" }}>
            <AnimatedCounter end={sortedRfps.reduce((s, r) => s + (r._count?.applications ?? 0), 0)} duration={1000} delay={200} />
          </span>
          <span className="label-style mt-1">Applications</span>
        </DynamicShadowCard>
      </div>

      {/* RFP Card Grid */}
      {sortedRfps.length === 0 ? (
        <div className="neu-empty-inset p-8">
          <div className="smart-empty">
            <div className="smart-empty-icon">
              <FileText className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
            </div>
            <h3>No RFPs created yet</h3>
            <p>
              RFPs are how contractors discover and apply for your funding programs.
              Creating your first RFP is the first step toward finding the right environmental partners.
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="smart-empty-action"
            >
              Create your first RFP <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-in-3">
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

            const isExpanded = expandedRfpId === rfp.id;

            return (
              <DynamicShadowCard key={rfp.id} intensity={2}>
              <Card
                variant="neu-raised"
                className={`relative cursor-pointer transition-transform active:scale-[0.98] overflow-hidden ${accentLeftForStatus(rfp.status)}`}
                onClick={() => toggleExpand(rfp.id)}
              >
                <CardContent className="p-5 pt-5 space-y-3">
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-bold text-sovereign-charcoal leading-snug line-clamp-2">
                      {rfp.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {rfp.status === "OPEN" ? (
                        <span
                          className="inline-flex items-center"
                          style={{
                            background: "rgba(74, 140, 106, 0.08)",
                            color: "rgba(74, 140, 106, 0.75)",
                            border: "1px solid rgba(74, 140, 106, 0.15)",
                            borderRadius: 20,
                            padding: "3px 10px",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "1.5px",
                          }}
                        >
                          {rfp.status}
                        </span>
                      ) : (
                        <Badge
                          variant={STATUS_VARIANT[rfp.status] ?? "neu"}
                          className="shadow-neu-inset"
                        >
                          {rfp.status}
                        </Badge>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-sovereign-stone transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Program name */}
                  <p className="text-xs text-sovereign-stone" style={{ opacity: 0.7, fontStyle: "italic" }}>
                    {rfp.program?.name ?? "No program"}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Applications count */}
                    <div className="flex items-center gap-1.5 text-xs text-sovereign-stone">
                      <Users className="w-3.5 h-3.5" />
                      <span className="mono-data font-semibold" style={{ color: "#2C3044" }}>
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
                      <span className="mono-data">{daysLabel}</span>
                    </div>
                  </div>

                  {/* Deadline date */}
                  {rfp.deadline && (
                    <p className="text-[11px] text-sovereign-stone/70">
                      Due: <span className="mono-data">{new Date(rfp.deadline).toLocaleDateString()}</span>
                    </p>
                  )}

                  {/* ===== Expanded Detail Panel ===== */}
                  {isExpanded && (
                    <div
                      className="mt-4 pt-4 space-y-4"
                      style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {detailLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-sovereign-stone" />
                          <span className="ml-2 text-sm text-sovereign-stone">Loading details...</span>
                        </div>
                      ) : rfpDetail ? (
                        <>
                          {/* Description */}
                          {rfpDetail.description && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-sovereign-charcoal uppercase tracking-wider">
                                <FileText className="w-3.5 h-3.5" />
                                Description
                              </div>
                              <p className="text-sm text-sovereign-stone leading-relaxed">
                                {rfpDetail.description}
                              </p>
                            </div>
                          )}

                          {/* Eligibility */}
                          {rfpDetail.eligibilityCriteria && (() => {
                            try {
                              const elig = JSON.parse(rfpDetail.eligibilityCriteria);
                              const hasContent =
                                elig.minCapitalization ||
                                (elig.businessCategories && elig.businessCategories.length > 0) ||
                                elig.minTrustTier !== "T0" ||
                                (elig.certifications && elig.certifications.length > 0) ||
                                elig.geoRestrictions;
                              if (!hasContent) return null;
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sovereign-charcoal uppercase tracking-wider">
                                    <Shield className="w-3.5 h-3.5" />
                                    Eligibility
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    {elig.minCapitalization && (
                                      <div className="neu-inset rounded-xl p-3">
                                        <span className="text-[11px] text-sovereign-stone block">Min Capitalization</span>
                                        <span className="font-semibold text-sovereign-charcoal mono-data">
                                          SAR {Number(elig.minCapitalization).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    {elig.minTrustTier && elig.minTrustTier !== "T0" && (
                                      <div className="neu-inset rounded-xl p-3">
                                        <span className="text-[11px] text-sovereign-stone block">Min Trust Tier</span>
                                        <span className="font-semibold text-sovereign-charcoal">{elig.minTrustTier}</span>
                                      </div>
                                    )}
                                    {elig.geoRestrictions && (
                                      <div className="neu-inset rounded-xl p-3">
                                        <span className="text-[11px] text-sovereign-stone block">Geographic</span>
                                        <span className="font-semibold text-sovereign-charcoal">{elig.geoRestrictions}</span>
                                      </div>
                                    )}
                                  </div>
                                  {elig.businessCategories && elig.businessCategories.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {elig.businessCategories.map((cat: string) => (
                                        <Badge key={cat} variant="neu" className="text-[11px]">{cat}</Badge>
                                      ))}
                                    </div>
                                  )}
                                  {elig.certifications && elig.certifications.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {elig.certifications.map((cert: string) => (
                                        <Badge key={cert} variant="neu-gold" className="text-[11px]">{cert}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            } catch {
                              return null;
                            }
                          })()}

                          {/* Scoring Rubric */}
                          {rfpDetail.scoringRubric && (() => {
                            try {
                              const dims: ScoringDimension[] = JSON.parse(rfpDetail.scoringRubric);
                              if (!dims.length) return null;
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sovereign-charcoal uppercase tracking-wider">
                                    <BarChart3 className="w-3.5 h-3.5" />
                                    Scoring Rubric
                                  </div>
                                  <div className="space-y-2">
                                    {dims.map((dim) => (
                                      <div key={dim.name} className="neu-inset rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium text-sovereign-charcoal">{dim.name}</span>
                                          <span className="text-xs mono-data text-sovereign-stone">{dim.weight}%</span>
                                        </div>
                                        <p className="text-xs text-sovereign-stone leading-relaxed">{dim.criteria}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            } catch {
                              return null;
                            }
                          })()}

                          {/* Evidence Requirements */}
                          {rfpDetail.evidenceRequirements && (() => {
                            try {
                              const evList: string[] = JSON.parse(rfpDetail.evidenceRequirements);
                              if (!evList.length) return null;
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sovereign-charcoal uppercase tracking-wider">
                                    <FileCheck className="w-3.5 h-3.5" />
                                    Evidence Requirements
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {evList.map((ev) => (
                                      <Badge key={ev} variant="neu" className="text-[11px]">{ev}</Badge>
                                    ))}
                                  </div>
                                </div>
                              );
                            } catch {
                              return null;
                            }
                          })()}

                          {/* Questionnaire Questions */}
                          {rfpDetail.questionnaireQuestions && rfpDetail.questionnaireQuestions.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-sovereign-charcoal uppercase tracking-wider">
                                <ClipboardList className="w-3.5 h-3.5" />
                                Questionnaire ({rfpDetail.questionnaireQuestions.length} questions)
                              </div>
                              <div className="space-y-2">
                                {rfpDetail.questionnaireQuestions.map((q, qi) => (
                                  <div key={q.id} className="neu-inset rounded-xl p-3">
                                    <div className="flex items-start gap-2">
                                      <span className="text-[11px] mono-data text-sovereign-stone shrink-0 mt-0.5">
                                        Q{qi + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-sovereign-charcoal leading-snug">{q.questionText}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <span className="text-[10px] text-sovereign-stone uppercase tracking-wider">
                                            {q.questionType.replace(/_/g, " ")}
                                          </span>
                                          {q.isRequired && (
                                            <span className="text-[10px] font-semibold" style={{ color: "#9c4a4a" }}>
                                              Required
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Applications */}
                          {rfpDetail.applications && rfpDetail.applications.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-sovereign-charcoal uppercase tracking-wider">
                                <Building2 className="w-3.5 h-3.5" />
                                Applications ({rfpDetail.applications.length})
                              </div>
                              <div className="space-y-2">
                                {rfpDetail.applications.map((app) => (
                                  <div key={app.id} className="neu-inset rounded-xl p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-sovereign-charcoal truncate">
                                        {app.organization?.name ?? "Unknown"}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[11px] text-sovereign-stone">
                                          {app.organization?.type ?? ""}
                                        </span>
                                        {app.organization?.trustTier && (
                                          <span className="text-[10px] mono-data text-sovereign-stone">
                                            {app.organization.trustTier}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {app.decisionPacket?.compositeScore != null && (
                                        <span
                                          className="text-sm font-bold mono-data"
                                          style={{
                                            color:
                                              app.decisionPacket.compositeScore >= 75
                                                ? "#5CA03E"
                                                : app.decisionPacket.compositeScore >= 50
                                                ? "#b87a3f"
                                                : "#9c4a4a",
                                          }}
                                        >
                                          {Math.round(app.decisionPacket.compositeScore)}
                                        </span>
                                      )}
                                      <Badge
                                        variant={
                                          app.status === "SUBMITTED"
                                            ? "neu-gold"
                                            : app.status === "SHORTLISTED"
                                            ? "neu-gold"
                                            : "neu"
                                        }
                                        className="text-[10px]"
                                      >
                                        {app.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-sovereign-stone text-center py-4">
                          Could not load details.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              </DynamicShadowCard>
            );
          })}
        </div>
      )}

      {/* Create RFP Dialog — controlled by dialogOpen state, triggered from header button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
