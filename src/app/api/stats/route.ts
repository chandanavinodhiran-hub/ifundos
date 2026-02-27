import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/stats — Dashboard statistics based on role
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;

  if (role === "ADMIN") {
    const [userCount, orgCount, programCount, auditCount, scoredAppCount, lastScoringEvent, recentActivity] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.program.count({ where: { status: "ACTIVE" } }),
      prisma.auditEvent.count(),
      prisma.application.count({ where: { compositeScore: { not: null } } }),
      prisma.auditEvent.findFirst({
        where: { action: { contains: "SCOR" } },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true, action: true },
      }),
      prisma.auditEvent.findMany({
        take: 5,
        orderBy: { timestamp: "desc" },
        include: { actor: { select: { name: true, email: true, role: true } } },
      }),
    ]);
    return NextResponse.json({
      userCount, orgCount, programCount, auditCount,
      scoredAppCount, lastScoringEvent, recentActivity,
    });
  }

  if (role === "FUND_MANAGER") {
    const [openRfps, applicationsInReview, activeGrants, programs, recentAudit, rfpPipelines] = await Promise.all([
      prisma.rFP.count({ where: { status: "OPEN" } }),
      prisma.application.count({
        where: { status: { in: ["SUBMITTED", "SCORING", "IN_REVIEW", "SHORTLISTED", "QUESTIONNAIRE_PENDING", "QUESTIONNAIRE_SUBMITTED"] } },
      }),
      prisma.contract.count({ where: { status: "ACTIVE" } }),
      prisma.program.findMany({
        select: { id: true, name: true, budgetTotal: true, budgetAllocated: true, budgetDisbursed: true, status: true },
      }),
      prisma.auditEvent.findMany({
        take: 20,
        orderBy: { timestamp: "desc" },
        where: { action: { notIn: ["AUTH_LOGIN", "AUTH_LOGOUT"] } },
        include: { actor: { select: { name: true, role: true } } },
      }),
      prisma.rFP.findMany({
        where: { status: { in: ["OPEN", "CLOSED", "AWARDED"] } },
        select: {
          id: true, title: true, status: true,
          applications: { select: { status: true } },
        },
      }),
    ]);

    const totalDisbursed = programs.reduce((sum: number, p: { budgetDisbursed: number }) => sum + p.budgetDisbursed, 0);

    return NextResponse.json({
      openRfps,
      applicationsInReview,
      activeGrants,
      totalDisbursed,
      atRiskProjects: 0,
      programs,
      recentActivity: recentAudit,
      rfpPipelines,
    });
  }

  if (role === "CONTRACTOR") {
    const orgId = session.user.organizationId;

    const [org, openRfps, applications, contracts, milestones] = await Promise.all([
      orgId ? prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, trustTier: true, preQualificationScore: true, capitalization: true, businessCategories: true, certifications: true },
      }) : null,
      prisma.rFP.count({ where: { status: "OPEN" } }),
      orgId ? prisma.application.findMany({
        where: { organizationId: orgId },
        select: {
          id: true, rfpId: true, status: true, proposedBudget: true,
          compositeScore: true, questionnaireStatus: true,
          createdAt: true, submittedAt: true,
          rfp: { select: { title: true, deadline: true } },
        },
        orderBy: { createdAt: "desc" },
      }) : [],
      orgId ? prisma.contract.count({ where: { organizationId: orgId, status: "ACTIVE" } }) : 0,
      orgId ? prisma.milestone.count({
        where: { contract: { organizationId: orgId }, status: "PENDING" },
      }) : 0,
    ]);

    const statusCounts: Record<string, number> = {
      draft: 0, submitted: 0, scoring: 0, in_review: 0,
      shortlisted: 0, questionnaire_pending: 0, questionnaire_submitted: 0,
      approved: 0, rejected: 0,
    };
    if (Array.isArray(applications)) {
      for (const app of applications) {
        const key = app.status.toLowerCase().replace(/-/g, "_");
        if (key in statusCounts) statusCounts[key]++;
      }
    }

    const upcomingDeadlines = await prisma.rFP.findMany({
      where: { status: "OPEN", deadline: { gte: new Date() } },
      select: { id: true, title: true, deadline: true },
      orderBy: { deadline: "asc" },
      take: 5,
    });

    const appList = Array.isArray(applications) ? applications : [];
    const appliedRfpIds = appList.map((a: { rfpId: string }) => a.rfpId);

    return NextResponse.json({
      organization: org,
      openRfps,
      applications: appList,
      activeContracts: contracts,
      pendingMilestones: milestones,
      totalReceived: 0,
      statusCounts,
      upcomingDeadlines,
      appliedRfpIds,
    });
  }

  if (role === "AUDITOR") {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvents, eventsToday, eventsLast7d, boostCount,
      recentEvents, boostActions, scoringEvents,
      scoredAppCount, scoreAgg, lastScored,
      recommendCount, conditionalCount, notRecommendCount,
    ] = await Promise.all([
      prisma.auditEvent.count(),
      prisma.auditEvent.count({ where: { timestamp: { gte: dayAgo } } }),
      prisma.auditEvent.count({ where: { timestamp: { gte: weekAgo } } }),
      prisma.boostAction.count(),
      prisma.auditEvent.findMany({
        take: 25,
        orderBy: { timestamp: "desc" },
        where: { timestamp: { gte: dayAgo } },
        include: { actor: { select: { name: true, role: true, email: true } } },
      }),
      prisma.boostAction.findMany({
        take: 20,
        orderBy: { timestamp: "desc" },
        include: { actor: { select: { name: true, role: true } } },
      }),
      prisma.auditEvent.count({
        where: { action: { in: ["AI_SCORING_COMPLETED", "APPLICATION_SHORTLISTED", "QUESTIONNAIRE_SENT", "CONTRACT_AWARDED"] } },
      }),
      // AI Scoring summary
      prisma.application.count({ where: { compositeScore: { not: null } } }),
      prisma.application.aggregate({ where: { compositeScore: { not: null } }, _avg: { compositeScore: true } }),
      prisma.application.findFirst({ where: { compositeScore: { not: null } }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      // Score distribution via compositeScore ranges
      prisma.application.count({ where: { compositeScore: { gte: 70 } } }),
      prisma.application.count({ where: { compositeScore: { gte: 50, lt: 70 } } }),
      prisma.application.count({ where: { compositeScore: { not: null, lt: 50 } } }),
    ]);

    const eventsAvg7d = Math.round(eventsLast7d / 7);

    return NextResponse.json({
      totalEvents,
      eventsToday,
      eventsAvg7d,
      boostCount,
      flaggedEvents: scoringEvents,
      recentEvents,
      boostActions,
      scoredAppCount,
      avgCompositeScore: scoreAgg._avg.compositeScore
        ? Math.round(scoreAgg._avg.compositeScore * 10) / 10
        : null,
      lastScoredAt: lastScored?.updatedAt || null,
      scoreDistribution: {
        recommended: recommendCount,
        conditional: conditionalCount,
        notRecommended: notRecommendCount,
      },
    });
  }

  return NextResponse.json({ error: "Unknown role" }, { status: 400 });
}
