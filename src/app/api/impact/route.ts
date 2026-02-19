import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/impact — Portfolio analytics and impact data
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    contracts,
    programs,
    milestones,
    applications,
    evidenceRecords,
  ] = await Promise.all([
    prisma.contract.findMany({
      include: {
        organization: { select: { id: true, name: true, trustTier: true } },
        application: {
          select: {
            compositeScore: true,
            proposalData: true,
            rfp: { select: { title: true } },
          },
        },
        milestones: {
          orderBy: { sequence: "asc" },
          select: { id: true, status: true, title: true, disbursementAmount: true },
        },
      },
    }),
    prisma.program.findMany({
      select: {
        id: true,
        name: true,
        budgetTotal: true,
        budgetAllocated: true,
        budgetDisbursed: true,
      },
    }),
    prisma.milestone.findMany({
      select: { id: true, status: true, disbursementAmount: true },
    }),
    prisma.application.findMany({
      where: { status: { in: ["APPROVED", "SUBMITTED", "SCORING", "IN_REVIEW", "SHORTLISTED"] } },
      select: { id: true, status: true, compositeScore: true },
    }),
    prisma.evidenceRecord.findMany({
      select: { id: true, reviewStatus: true, type: true },
    }),
  ]);

  // Calculate aggregate metrics
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((c) => c.status === "ACTIVE").length;
  const completedContracts = contracts.filter((c) => c.status === "COMPLETED").length;

  const totalAwardAmount = contracts.reduce((sum, c) => sum + c.awardAmount, 0);
  const totalBudget = programs.reduce((sum, p) => sum + p.budgetTotal, 0);
  const totalDisbursed = programs.reduce((sum, p) => sum + p.budgetDisbursed, 0);

  const totalMilestones = milestones.length;
  const verifiedMilestones = milestones.filter((m) => m.status === "VERIFIED").length;
  const pendingMilestones = milestones.filter((m) => m.status === "PENDING").length;
  const evidenceSubmitted = milestones.filter((m) => m.status === "EVIDENCE_SUBMITTED").length;

  // Trees planted estimate from proposal data
  let totalTreesTarget = 0;
  let totalTreesPlanted = 0;
  for (const c of contracts) {
    try {
      if (c.application?.proposalData) {
        const data = JSON.parse(c.application.proposalData);
        const species = data.species || data.technicalProposal?.species || [];
        const qty = Array.isArray(species)
          ? species.reduce((s: number, sp: { quantity?: number }) => s + (sp.quantity || 0), 0)
          : 0;
        totalTreesTarget += qty;

        // Estimate planted based on milestone progress
        const completedMs = c.milestones.filter(
          (m) => m.status === "VERIFIED"
        ).length;
        const progress = c.milestones.length > 0
          ? completedMs / c.milestones.length
          : 0;
        totalTreesPlanted += Math.round(qty * progress * 0.8);
      }
    } catch {
      // ignore parse errors
    }
  }

  // Contractor performance rankings
  const contractorPerformance = contracts
    .filter((c) => c.status === "ACTIVE" || c.status === "COMPLETED")
    .map((c) => {
      const totalMs = c.milestones.length;
      const verifiedMs = c.milestones.filter((m) => m.status === "VERIFIED").length;
      const score = c.application?.compositeScore || 0;
      return {
        contractorName: c.organization.name,
        trustTier: c.organization.trustTier,
        rfpTitle: c.application?.rfp?.title || "Unknown",
        awardAmount: c.awardAmount,
        aiScore: score,
        milestonesTotal: totalMs,
        milestonesCompleted: verifiedMs,
        completionRate: totalMs > 0 ? Math.round((verifiedMs / totalMs) * 100) : 0,
        contractStatus: c.status,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate || b.aiScore - a.aiScore);

  // Evidence stats
  const totalEvidence = evidenceRecords.length;
  const approvedEvidence = evidenceRecords.filter((e) => e.reviewStatus === "APPROVED").length;
  const rejectedEvidence = evidenceRecords.filter((e) => e.reviewStatus === "REJECTED").length;
  const pendingEvidence = evidenceRecords.filter((e) => e.reviewStatus === "PENDING").length;

  // Evidence by type breakdown
  const evidenceByType: Record<string, number> = {};
  for (const e of evidenceRecords) {
    evidenceByType[e.type] = (evidenceByType[e.type] || 0) + 1;
  }

  // Program breakdown
  const programBreakdown = programs.map((p) => ({
    name: p.name,
    budgetTotal: p.budgetTotal,
    budgetAllocated: p.budgetAllocated,
    budgetDisbursed: p.budgetDisbursed,
    allocationPct: p.budgetTotal > 0 ? Math.round((p.budgetAllocated / p.budgetTotal) * 100) : 0,
    disbursedPct: p.budgetTotal > 0 ? Math.round((p.budgetDisbursed / p.budgetTotal) * 100) : 0,
  }));

  return NextResponse.json({
    summary: {
      totalContracts,
      activeContracts,
      completedContracts,
      totalAwardAmount,
      totalBudget,
      totalDisbursed,
      totalTreesTarget,
      totalTreesPlanted,
    },
    milestoneStats: {
      total: totalMilestones,
      verified: verifiedMilestones,
      pending: pendingMilestones,
      evidenceSubmitted,
      completionRate: totalMilestones > 0 ? Math.round((verifiedMilestones / totalMilestones) * 100) : 0,
    },
    evidenceStats: {
      total: totalEvidence,
      approved: approvedEvidence,
      rejected: rejectedEvidence,
      pending: pendingEvidence,
      byType: evidenceByType,
    },
    contractorPerformance,
    programBreakdown,
    applicationStats: {
      total: applications.length,
      approved: applications.filter((a) => a.status === "APPROVED").length,
      avgScore: applications.length > 0
        ? Math.round(
            applications
              .filter((a) => a.compositeScore)
              .reduce((sum, a) => sum + (a.compositeScore || 0), 0) /
              Math.max(1, applications.filter((a) => a.compositeScore).length)
          )
        : 0,
    },
  });
}
