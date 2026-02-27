"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ArrowLeft,
  ClipboardList,
  Target,
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

function getDaysLeftBadgeClass(daysLeft: number): string {
  if (daysLeft < 7) return "bg-red-100 text-red-800 border-red-200";
  if (daysLeft <= 14) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-leaf-100 text-leaf-800 border-leaf-200";
}

const TIER_ORDER: Record<string, number> = {
  T0: 0,
  T1: 1,
  T2: 2,
  T3: 3,
  T4: 4,
};

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
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  if (error || !rfp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-muted-foreground">{error || "RFP not found"}</p>
        <Button variant="outline" onClick={() => router.push("/contractor/rfps")}>
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
    <div className="space-y-6 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/contractor/rfps")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to RFPs
      </Button>

      {/* Eligibility Banner */}
      {orgData && Object.keys(eligibilityCriteria).length > 0 && (
        <div
          className={`rounded-lg p-4 flex items-start gap-3 ${
            eligibilityCheck.eligible
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {eligibilityCheck.eligible ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-800">
                  Your organization meets the eligibility criteria
                </p>
                <p className="text-sm text-green-700 mt-0.5">
                  You are eligible to apply for this RFP.
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-800">
                  Your organization does not meet the following criteria:
                </p>
                <ul className="text-sm text-red-700 mt-1 space-y-1">
                  {eligibilityCheck.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl text-slate-900">
                {rfp.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="bg-leaf-50 text-leaf-700 border-leaf-200"
                >
                  {rfp.program.name}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    isOpen
                      ? "bg-leaf-100 text-leaf-800 border-leaf-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }
                >
                  {rfp.status}
                </Badge>
              </div>
            </div>
            {daysLeft !== null && (
              <div className="text-right shrink-0">
                {daysLeft >= 0 ? (
                  <Badge
                    variant="outline"
                    className={getDaysLeftBadgeClass(daysLeft)}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {daysLeft} days left
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-500 border-gray-200"
                  >
                    Deadline passed
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(rfp.deadline!).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Deadline prominently */}
          {rfp.deadline && (
            <div className="flex items-center gap-2 p-3 bg-leaf-50 rounded-lg mb-4">
              <Calendar className="w-5 h-5 text-leaf-700" />
              <div>
                <p className="text-sm font-medium">Submission Deadline</p>
                <p className="text-sm text-muted-foreground">
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
          )}

          {/* Description */}
          {rfp.description && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {rfp.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eligibility Criteria */}
      {Object.keys(eligibilityCriteria).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-leaf-600" /> Eligibility Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {eligibilityCriteria.minimumCapitalization !== undefined && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Minimum Capitalization
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    SAR{" "}
                    {eligibilityCriteria.minimumCapitalization.toLocaleString()}
                  </p>
                </div>
              )}
              {eligibilityCriteria.minimumTrustTier && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Minimum Trust Tier
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {eligibilityCriteria.minimumTrustTier} or above
                  </p>
                </div>
              )}
              {eligibilityCriteria.requiredCategories &&
                eligibilityCriteria.requiredCategories.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Required Categories
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {eligibilityCriteria.requiredCategories.map(
                        (cat, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
              {eligibilityCriteria.certifications &&
                eligibilityCriteria.certifications.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Required Certifications
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {eligibilityCriteria.certifications.map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {eligibilityCriteria.geographicRestrictions && (
                <div className="p-3 bg-muted/50 rounded-lg sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Geographic Restrictions
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {eligibilityCriteria.geographicRestrictions}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Requirements */}
      {evidenceRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-leaf-600" /> Evidence
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evidenceRequirements.map((req, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      req.required !== false
                        ? "bg-leaf-100 text-leaf-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </div>
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
                    {req.formats && req.formats.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Accepted: {req.formats.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scoring Rubric */}
      {scoringRubric.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="w-5 h-5 text-leaf-600" /> Scoring Rubric
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Dimension
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Weight
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scoringRubric.map((dim, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-2 px-3 font-medium">{dim.dimension}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-leaf-600 rounded-full"
                              style={{ width: `${dim.weight}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {dim.weight}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {dim.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Action Section */}
      <div className="flex items-center gap-4 flex-wrap">
        {hasExistingApplication ? (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg flex-1">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-blue-800">
                You have already applied to this RFP
              </p>
              <p className="text-sm text-blue-700 mt-0.5">
                Status:{" "}
                <Badge variant="outline" className="text-xs ml-1">
                  {existingApplication?.status}
                </Badge>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() =>
                router.push(`/contractor/applications`)
              }
            >
              View Application
            </Button>
          </div>
        ) : canApply ? (
          <Button
            size="lg"
            className="bg-leaf-600 hover:bg-leaf-600 text-white"
            onClick={() => router.push(`/contractor/rfps/${id}/apply`)}
          >
            <Target className="w-5 h-5 mr-2" /> Apply to this RFP
          </Button>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-gray-500" />
            <p className="text-sm text-gray-600">
              {!isOpen
                ? "This RFP is no longer accepting applications."
                : "The deadline for this RFP has passed."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
