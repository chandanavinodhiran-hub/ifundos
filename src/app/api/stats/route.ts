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
    const [userCount, orgCount, programCount, auditCount] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.program.count({ where: { status: "ACTIVE" } }),
      prisma.auditEvent.count(),
    ]);
    return NextResponse.json({ userCount, orgCount, programCount, auditCount });
  }

  if (role === "FUND_MANAGER") {
    const [openRfps, applicationsInReview, activeGrants, programs, recentAudit] = await Promise.all([
      prisma.rFP.count({ where: { status: "OPEN" } }),
      prisma.application.count({ where: { status: { in: ["SUBMITTED", "SCORING", "IN_REVIEW"] } } }),
      prisma.contract.count({ where: { status: "ACTIVE" } }),
      prisma.program.findMany({
        select: { id: true, name: true, budgetTotal: true, budgetAllocated: true, budgetDisbursed: true, status: true },
      }),
      prisma.auditEvent.findMany({
        take: 20,
        orderBy: { timestamp: "desc" },
        include: { actor: { select: { name: true, role: true } } },
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
    });
  }

  if (role === "CONTRACTOR") {
    const orgId = session.user.organizationId;

    const [org, openRfps, applications, contracts, milestones] = await Promise.all([
      orgId ? prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, trustTier: true, preQualificationScore: true } }) : null,
      prisma.rFP.count({ where: { status: "OPEN" } }),
      orgId ? prisma.application.findMany({
        where: { organizationId: orgId },
        include: { rfp: { select: { title: true, deadline: true } } },
        orderBy: { createdAt: "desc" },
      }) : [],
      orgId ? prisma.contract.count({ where: { organizationId: orgId, status: "ACTIVE" } }) : 0,
      orgId ? prisma.milestone.count({
        where: { contract: { organizationId: orgId }, status: "PENDING" },
      }) : 0,
    ]);

    const statusCounts: Record<string, number> = { draft: 0, submitted: 0, scoring: 0, in_review: 0, approved: 0, rejected: 0 };
    if (Array.isArray(applications)) {
      for (const app of applications) {
        const key = app.status.toLowerCase().replace("-", "_");
        if (key in statusCounts) statusCounts[key]++;
      }
    }

    // Get upcoming RFP deadlines
    const upcomingDeadlines = await prisma.rFP.findMany({
      where: { status: "OPEN", deadline: { gte: new Date() } },
      select: { id: true, title: true, deadline: true },
      orderBy: { deadline: "asc" },
      take: 5,
    });

    return NextResponse.json({
      organization: org,
      openRfps,
      applications: Array.isArray(applications) ? applications : [],
      activeContracts: contracts,
      pendingMilestones: milestones,
      totalReceived: 0,
      statusCounts,
      upcomingDeadlines,
    });
  }

  if (role === "AUDITOR") {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalEvents, eventsToday, boostCount, recentEvents, boostActions] = await Promise.all([
      prisma.auditEvent.count(),
      prisma.auditEvent.count({ where: { timestamp: { gte: dayAgo } } }),
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
    ]);

    return NextResponse.json({
      totalEvents,
      eventsToday,
      boostCount,
      flaggedEvents: 0,
      recentEvents,
      boostActions,
    });
  }

  return NextResponse.json({ error: "Unknown role" }, { status: 400 });
}
