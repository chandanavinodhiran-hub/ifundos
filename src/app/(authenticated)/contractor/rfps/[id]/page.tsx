"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ArrowLeft,
  ClipboardList,
  Scale,
  ShieldCheck,
} from "lucide-react";

interface RFPDetail {
  id: string;
  title: string;
  description: string | null;
  eligibilityCriteria: string | null;
  scoringRubric: string | null;
  evidenceRequirements: string | null;
  deadline: string | null;
  status: string;
  program: {
    id: string;
    name: string;
  };
  applications: Array<{
    id: string;
    organizationId: string;
    status: string;
  }>;
}

interface SessionData {
  user: {
    userId: string;
    role: string;
    organizationId: string | null;
    organizationName: string | null;
  };
}

interface EligibilityCriteria {
  minimumCapitalization?: number;
  requiredCategories?: string[];
  certifications?: string[];
  minimumTrustTier?: string;
  geographicRestrictions?: string;
}

interface ScoringDimension {
  dimension: string;
  weight: number;
  description?: string;
}

interface EvidenceRequirement {
  name: string;
  description?: string;
  required?: boolean;
  formats?: string[];
}

interface OrgData {
  capitalization: number | null;
  trustTier: string;
  businessCategories: string | null;
  certifications: string | null;
}

function parseSafe<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function getDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function getDaysLeftColor(daysLeft: number): string {
  if (daysLeft < 7) return "#9c4a4a";
  if (daysLeft <= 30) return "rgba(75, 165, 195, 0.8)";
  return "#4a7c59";
}

const TIER_ORDER: Record<string, number> = {
  T0: 0,
  T1: 1,
  T2: 2,
  T3: 3,
  T4: 4,
};

function buildMatchCopy(): string {
  return "Your environmental remediation track record and Bronze T1 status meet all eligibility criteria. The scoring heavily weights scientific methodology at 30% — emphasize your field research data from previous projects. Geographic requirement for Tabuk or Northern Region operational base is satisfied.";
}

function checkEligibility(
  criteria: EligibilityCriteria,
  org: OrgData | null
): { eligible: boolean; issues: string[] } {
  if (!org) return { eligible: false, issues: ["Organization data not available"] };
  const issues: string[] = [];

  if (
    criteria.minimumCapitalization &&
    (org.capitalization === null ||
      org.capitalization < criteria.minimumCapitalization)
  ) {
    issues.push(
      `Minimum capitalization SAR ${criteria.minimumCapitalization.toLocaleString()} required (yours: SAR ${(org.capitalization ?? 0).toLocaleString()})`
    );
  }

  if (criteria.minimumTrustTier) {
    const requiredLevel = TIER_ORDER[criteria.minimumTrustTier] ?? 0;
    const orgLevel = TIER_ORDER[org.trustTier] ?? 0;
    if (orgLevel < requiredLevel) {
      issues.push(
        `Trust tier ${criteria.minimumTrustTier} or higher required (yours: ${org.trustTier})`
      );
    }
  }

  if (criteria.requiredCategories && criteria.requiredCategories.length > 0) {
    const orgCategories = parseSafe<string[]>(org.businessCategories, []);
    const missing = criteria.requiredCategories.filter(
      (c) => !orgCategories.includes(c)
    );
    if (missing.length > 0) {
      issues.push(`Missing required categories: ${missing.join(", ")}`);
    }
  }

  if (criteria.certifications && criteria.certifications.length > 0) {
    const orgCerts = parseSafe<string[]>(org.certifications, []);
    const missing = criteria.certifications.filter(
      (c) => !orgCerts.includes(c)
    );
    if (missing.length > 0) {
      issues.push(`Missing certifications: ${missing.join(", ")}`);
    }
  }

  return { eligible: issues.length === 0, issues };
}

export default function ContractorRFPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [rfp, setRfp] = useState<RFPDetail | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [sessionOrgId, setSessionOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [rfpRes, sessionRes] = await Promise.all([
          fetch(`/api/rfps/${id}`),
          fetch("/api/auth/session"),
        ]);

        if (!rfpRes.ok) throw new Error("Failed to fetch RFP details");

        const rfpData = await rfpRes.json();
        setRfp(rfpData.rfp || rfpData);

        if (sessionRes.ok) {
          const sessionData: SessionData = await sessionRes.json();
          setSessionOrgId(sessionData.user?.organizationId || null);

          // Fetch org data for eligibility check
          if (sessionData.user?.organizationId) {
            try {
              const orgRes = await fetch(
                `/api/organizations/${sessionData.user.organizationId}`
              );
              if (orgRes.ok) {
                const od = await orgRes.json();
                const org = od.organization || od;
                setOrgData({
                  capitalization: org.capitalization,
                  trustTier: org.trustTier,
                  businessCategories: org.businessCategories,
                  certifications: org.certifications,
                });
              }
            } catch {
              // Org data fetch failed — continue without eligibility check
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load RFP");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  if (error || !rfp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-8 h-8 text-critical" />
        <p className="text-sovereign-stone">{error || "RFP not found"}</p>
        <Button variant="neu-outline" onClick={() => router.push("/contractor/rfps")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to RFPs
        </Button>
      </div>
    );
  }

  const daysLeft = getDaysLeft(rfp.deadline);
  const isOpen = rfp.status === "OPEN";
  const deadlinePassed = daysLeft !== null && daysLeft < 0;
  const canApply = isOpen && !deadlinePassed;

  const eligibilityCriteria = parseSafe<EligibilityCriteria>(
    rfp.eligibilityCriteria,
    {}
  );
  const scoringRubric = parseSafe<ScoringDimension[]>(rfp.scoringRubric, []);
  const evidenceRequirements = parseSafe<EvidenceRequirement[]>(
    rfp.evidenceRequirements,
    []
  );

  const eligibilityCheck = checkEligibility(eligibilityCriteria, orgData);
  const hasExistingApplication = rfp.applications?.some(
    (app) => app.organizationId === sessionOrgId
  );
  const existingApplication = rfp.applications?.find(
    (app) => app.organizationId === sessionOrgId
  );

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-[100px] md:pb-0">
      {/* Back Button */}
      <button
        onClick={() => router.push("/contractor/rfps")}
        className="group inline-flex items-center gap-1 cursor-pointer"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(30, 34, 53, 0.5)",
          background: "none",
          border: "none",
          padding: 0,
          transition: "color 0.2s ease-out",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#5C6FB5"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(30, 34, 53, 0.5)"; }}
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
        Back to Opportunities
      </button>

      {/* Header Card */}
      <Card variant="neu-raised" className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-bold text-sovereign-charcoal leading-tight">
              {rfp.title}
            </h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="neu">
                {rfp.program.name}
              </Badge>
              <span
                className="inline-block"
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: rfp.status === "OPEN" ? "rgba(74, 140, 106, 0.08)" : "rgba(122, 114, 101, 0.08)",
                  border: rfp.status === "OPEN" ? "1px solid rgba(74, 140, 106, 0.15)" : "1px solid rgba(122, 114, 101, 0.15)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase" as const,
                  color: rfp.status === "OPEN" ? "rgba(74, 140, 106, 0.8)" : "#7a7265",
                }}
              >
                {rfp.status}
              </span>
            </div>
          </div>
          {daysLeft !== null && (
            <div className="text-right shrink-0">
              {daysLeft >= 0 ? (
                <span
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                  style={{ color: getDaysLeftColor(daysLeft) }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-mono">{daysLeft}</span> days left
                </span>
              ) : (
                <span className="text-[13px] font-semibold text-sovereign-stone">
                  Deadline passed
                </span>
              )}
              <p className="text-[11px] text-sovereign-stone mt-1 font-mono">
                {new Date(rfp.deadline!).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Deadline prominently */}
        {rfp.deadline && (
          <Card variant="neu-inset" className="p-3 mt-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-sovereign-stone" />
              <div>
                <p className="text-[12px] font-semibold text-sovereign-charcoal">Submission Deadline</p>
                <p className="text-[12px] text-sovereign-stone font-mono">
                  {new Date(rfp.deadline).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Eligibility Banner */}
      {orgData && Object.keys(eligibilityCriteria).length > 0 && (
        <>
          {eligibilityCheck.eligible ? (
            <Card variant="neu-inset" className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#4a7c59" }} />
                <div>
                  <p className="text-[14px] font-semibold text-sovereign-charcoal">
                    Your organization meets the eligibility criteria
                  </p>
                  <p className="text-[12px] text-sovereign-stone mt-0.5">
                    You are eligible to apply for this RFP.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card
              variant="neu-inset"
              className="p-4"
              style={{ borderLeft: "3px solid #9c4a4a" }}
            >
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#9c4a4a" }} />
                <div>
                  <p className="text-[14px] font-semibold text-sovereign-charcoal">
                    Your organization does not meet the following criteria:
                  </p>
                  <ul className="text-[12px] text-sovereign-stone mt-1.5 space-y-1">
                    {eligibilityCheck.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "#9c4a4a" }} />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* AI Match Assessment */}
      <Card variant="neu-ai" className="p-5" style={{ borderLeft: "3px solid rgba(74, 140, 106, 0.4)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: "rgba(74, 140, 106, 0.7)" }} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(74, 140, 106, 0.7)" }}>AI MATCH ASSESSMENT</span>
        </div>
        <p className="text-[16px] font-medium mb-2" style={{ color: "rgba(30, 34, 53, 0.8)" }}>Navigator sees a strong match</p>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(30, 34, 53, 0.55)" }}>
          {buildMatchCopy()}
        </p>
      </Card>

      {/* Description */}
      {rfp.description && (
        <Card variant="neu-raised" className="p-5">
          <h3 className="text-[14px] font-bold text-sovereign-charcoal mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sovereign-stone" /> Description
          </h3>
          <p className="text-[13px] text-sovereign-stone leading-relaxed whitespace-pre-wrap">
            {rfp.description}
          </p>
        </Card>
      )}

      {/* Eligibility Criteria */}
      {Object.keys(eligibilityCriteria).length > 0 && (
        <Card variant="neu-raised" className="p-5">
          <h3 className="text-[14px] font-bold text-sovereign-charcoal mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5" style={{ color: "#4a7c59" }} /> Eligibility Criteria
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eligibilityCriteria.minimumCapitalization !== undefined && (
              <Card variant="neu-inset" className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sovereign-stone">
                  Minimum Capitalization
                </p>
                <p className="text-[14px] font-bold text-sovereign-charcoal mt-1">
                  SAR{" "}
                  {eligibilityCriteria.minimumCapitalization.toLocaleString()}
                </p>
              </Card>
            )}
            {eligibilityCriteria.minimumTrustTier && (
              <Card variant="neu-inset" className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sovereign-stone">
                  Minimum Trust Tier
                </p>
                <p className="text-[14px] font-bold text-sovereign-charcoal mt-1">
                  {eligibilityCriteria.minimumTrustTier} or above
                </p>
              </Card>
            )}
            {eligibilityCriteria.requiredCategories &&
              eligibilityCriteria.requiredCategories.length > 0 && (
                <Card variant="neu-inset" className="p-3 sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sovereign-stone">
                    Required Categories
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {eligibilityCriteria.requiredCategories.map(
                      (cat, i) => (
                        <Badge key={i} variant="neu" className="text-[11px]">
                          {cat}
                        </Badge>
                      )
                    )}
                  </div>
                </Card>
              )}
            {eligibilityCriteria.certifications &&
              eligibilityCriteria.certifications.length > 0 && (
                <Card variant="neu-inset" className="p-3 sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sovereign-stone">
                    Required Certifications
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {eligibilityCriteria.certifications.map((cert, i) => (
                      <Badge key={i} variant="neu" className="text-[11px]">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            {eligibilityCriteria.geographicRestrictions && (
              <Card variant="neu-inset" className="p-3 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sovereign-stone">
                  Geographic Restrictions
                </p>
                <p className="text-[14px] font-bold text-sovereign-charcoal mt-1">
                  {eligibilityCriteria.geographicRestrictions}
                </p>
              </Card>
            )}
          </div>
        </Card>
      )}

      {/* Evidence Requirements */}
      {evidenceRequirements.length > 0 && (
        <Card variant="neu-raised" className="p-5">
          <h3 className="text-[14px] font-bold text-sovereign-charcoal mb-4 flex items-center gap-2">
            <ClipboardList className="w-4.5 h-4.5" style={{ color: "#4a7c59" }} /> Evidence Requirements
          </h3>
          <div className="space-y-3">
            {evidenceRequirements.map((req, i) => (
              <Card variant="neu-inset" className="p-3" key={i}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-neu-inset bg-neu-dark/30 text-sovereign-charcoal">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-sovereign-charcoal">
                      {req.name}
                      {req.required !== false && (
                        <span className="ml-1" style={{ color: "#9c4a4a" }}>*</span>
                      )}
                    </p>
                    {req.description && (
                      <p className="text-[12px] text-sovereign-stone mt-0.5">
                        {req.description}
                      </p>
                    )}
                    {req.formats && req.formats.length > 0 && (
                      <p className="text-[11px] text-sovereign-stone mt-0.5 font-mono">
                        Accepted: {req.formats.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Scoring Rubric */}
      {scoringRubric.length > 0 && (
        <Card variant="neu-raised" className="p-5">
          <h3 className="text-[14px] font-bold text-sovereign-charcoal mb-4 flex items-center gap-2">
            <Scale className="w-4.5 h-4.5" style={{ color: "#4a7c59" }} /> Scoring Rubric
          </h3>
          <div className="space-y-3">
            {scoringRubric.map((dim, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-sovereign-charcoal min-w-[120px]">{dim.dimension}</span>
                <div className="flex-1 h-2 bg-neu-dark/20 rounded-full overflow-hidden shadow-neu-inset">
                  <div className="h-full rounded-full" style={{ width: `${dim.weight}%`, background: "linear-gradient(90deg, rgba(75, 165, 195, 0.7), rgba(75, 165, 195, 0.9))" }} />
                </div>
                <span className="text-[12px] font-mono text-sovereign-stone w-10 text-right">{dim.weight}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Section — Sticky bottom bar */}
      <div className="fixed bottom-[80px] md:bottom-0 left-0 right-0 z-30 p-4 bg-neu-base/95 backdrop-blur-sm border-t border-neu-dark/30 md:static md:bg-transparent md:border-0 md:p-0 md:backdrop-blur-none">
        {hasExistingApplication ? (
          <Card variant="neu-inset" className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#4a7c59" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-sovereign-charcoal">Applied</p>
              <p className="text-[12px] text-sovereign-stone">Status: {existingApplication?.status?.replace(/_/g, " ")}</p>
            </div>
            <Button variant="neu-outline" size="sm" onClick={() => router.push(`/contractor/applications`)}>View</Button>
          </Card>
        ) : canApply ? (
          <Button variant="neu-gold" className="w-full md:w-auto" size="lg" onClick={() => router.push(`/contractor/rfps/${id}/apply`)}>
            Apply to this RFP
          </Button>
        ) : (
          <Card variant="neu-inset" className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-sovereign-stone" />
            <p className="text-[13px] text-sovereign-stone">
              {!isOpen ? "This RFP is no longer accepting applications." : "The deadline for this RFP has passed."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
