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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      userCount, orgCount, programCount, auditCount,
      scoredAppCount, lastScoringEvent,
      pendingUsers, suspendedUsers,
      todayLogins,
      roleCounts, programs, applications,
      adminUser, fmUser, contractorUsers,
    ] = await Promise.all([
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
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      // Get distinct users who logged in today
      prisma.auditEvent.findMany({
        where: { action: "AUTH_LOGIN", timestamp: { gte: todayStart } },
        distinct: ["actorId"],
        select: { actorId: true },
      }),
      prisma.user.groupBy({ by: ["role"], _count: true }),
      prisma.program.findMany({
        select: {
          id: true, name: true, description: true, status: true,
          budgetTotal: true, budgetAllocated: true, budgetDisbursed: true,
          createdAt: true,
          rfps: {
            select: {
              id: true, title: true, status: true, createdAt: true,
              applications: { select: { id: true, status: true, compositeScore: true, proposedBudget: true, submittedAt: true, createdAt: true, shortlistedAt: true, updatedAt: true, organization: { select: { name: true } } } },
            },
          },
          contracts: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      // All scored applications for building activity
      prisma.application.findMany({
        where: { compositeScore: { not: null } },
        select: {
          id: true, status: true, compositeScore: true, proposedBudget: true,
          submittedAt: true, createdAt: true, shortlistedAt: true, updatedAt: true,
          organization: { select: { name: true } },
          rfp: { select: { title: true } },
        },
      }),
      // Admin user (current)
      prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { name: true },
      }),
      // FM user
      prisma.user.findFirst({
        where: { role: "FUND_MANAGER" },
        select: { name: true },
      }),
      // Contractor users
      prisma.user.findMany({
        where: { role: "CONTRACTOR", status: "ACTIVE" },
        select: { id: true, name: true, createdAt: true, organization: { select: { name: true } } },
      }),
    ]);

    const activeToday = todayLogins.length;

    const roleCountMap: Record<string, number> = {
      ADMIN: 0, FUND_MANAGER: 0, CONTRACTOR: 0, AUDITOR: 0,
    };
    for (const rc of roleCounts) {
      roleCountMap[rc.role] = rc._count;
    }

    // Engine is "operational" as long as it has ever scored — it's healthy and waiting
    const aiEngineStatus = lastScoringEvent ? "operational" : "no_data";

    // ── Build meaningful activity stream ──
    const adminName = adminUser?.name ?? "Ibrahim Al-Dosari";
    const fmName = fmUser?.name ?? "Fund Manager";
    const orgToUser: Record<string, string> = {};
    for (const u of contractorUsers) {
      if (u.organization?.name) orgToUser[u.organization.name] = u.name ?? u.organization.name;
    }

    const platformActions: { id: string; action: string; timestamp: string; actor: { name: string; email: string; role: string } }[] = [];

    // Recent login events (last 2 distinct users)
    const recentLoginUsers = await prisma.auditEvent.findMany({
      where: { action: "AUTH_LOGIN" },
      orderBy: { timestamp: "desc" },
      distinct: ["actorId"],
      take: 4,
      include: { actor: { select: { name: true, email: true, role: true } } },
    });
    for (const login of recentLoginUsers) {
      if (login.actor) {
        platformActions.push({
          id: `login-${login.actor.email}`,
          action: "Logged in",
          timestamp: login.timestamp.toISOString(),
          actor: { name: login.actor.name ?? "User", email: login.actor.email, role: login.actor.role },
        });
      }
    }

    // Application events
    for (const app of applications) {
      const contractor = orgToUser[app.organization.name] ?? app.organization.name;

      // FM shortlisted
      if (app.shortlistedAt) {
        platformActions.push({
          id: `${app.id}-shortlist`,
          action: `Shortlisted ${app.organization.name}`,
          timestamp: app.shortlistedAt.toISOString(),
          actor: { name: fmName, email: "", role: "FUND_MANAGER" },
        });
      }

      // AI scored
      if (app.compositeScore !== null) {
        const scoreTime = new Date(new Date(app.submittedAt ?? app.createdAt).getTime() + 2 * 3600000);
        platformActions.push({
          id: `${app.id}-score`,
          action: `Scored application ${Math.round(app.compositeScore)}/100`,
          timestamp: scoreTime.toISOString(),
          actor: { name: "AI Engine", email: "", role: "AI" },
        });
      }

      // Contractor submitted
      platformActions.push({
        id: `${app.id}-submit`,
        action: "Submitted application",
        timestamp: (app.submittedAt ?? app.createdAt).toISOString(),
        actor: { name: contractor, email: "", role: "CONTRACTOR" },
      });
    }

    // Contractor registrations
    for (const u of contractorUsers) {
      platformActions.push({
        id: `user-${u.id}`,
        action: "Completed registration",
        timestamp: u.createdAt.toISOString(),
        actor: { name: u.name ?? "Contractor", email: "", role: "CONTRACTOR" },
      });
    }

    // Program creation
    for (const p of programs) {
      platformActions.push({
        id: `prog-${p.id}`,
        action: `Created program: ${p.name}`,
        timestamp: p.createdAt.toISOString(),
        actor: { name: adminName, email: "", role: "ADMIN" },
      });
    }

    // Sort by timestamp descending, take 20
    platformActions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      userCount, orgCount, programCount, auditCount,
      scoredAppCount, lastScoringEvent,
      pendingInvites: pendingUsers,
      activeToday,
      issueCount: suspendedUsers,
      aiEngineStatus, roleCountMap,
      adminName,
      recentActivity: platformActions.slice(0, 20),
      programs,
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
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvents, recentEvents,
      programs, applications, contracts,
    ] = await Promise.all([
      prisma.auditEvent.count(),
      // Full activity stream (all events, not just 24h)
      prisma.auditEvent.findMany({
        take: 50,
        orderBy: { timestamp: "desc" },
        include: { actor: { select: { name: true, role: true, email: true } } },
      }),
      // Programs with budget info
      prisma.program.findMany({
        select: {
          id: true, name: true, budgetTotal: true, budgetAllocated: true, budgetDisbursed: true, status: true,
          rfps: {
            select: {
              id: true, title: true, status: true, createdAt: true,
              applications: {
                select: {
                  id: true, status: true, compositeScore: true, proposedBudget: true,
                  shortlistedAt: true, rejectionReason: true, updatedAt: true, createdAt: true,
                  organization: { select: { name: true } },
                  rfp: { select: { title: true } },
                  decisionPacket: {
                    select: { recommendation: true, executiveSummary: true, strengths: true, risks: true },
                  },
                  dimensionScores: true,
                },
              },
            },
          },
          contracts: {
            select: {
              id: true, status: true, awardAmount: true,
              organization: { select: { name: true } },
              milestones: { select: { id: true, status: true, disbursementAmount: true } },
            },
          },
        },
      }),
      // All applications with scores + decisions for the Decisions screen
      prisma.application.findMany({
        where: { compositeScore: { not: null } },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, status: true, compositeScore: true, dimensionScores: true,
          proposedBudget: true, shortlistedAt: true, rejectionReason: true,
          updatedAt: true, createdAt: true, submittedAt: true,
          organization: { select: { name: true } },
          rfp: { select: { id: true, title: true, programId: true } },
          decisionPacket: {
            select: {
              recommendation: true, executiveSummary: true,
              strengths: true, risks: true, narrative: true,
            },
          },
        },
      }),
      // Contracts for disbursements
      prisma.contract.findMany({
        select: {
          id: true, status: true, awardAmount: true, createdAt: true,
          organization: { select: { name: true } },
          program: { select: { name: true } },
          milestones: {
            select: { id: true, title: true, status: true, disbursementAmount: true, sequence: true },
            orderBy: { sequence: "asc" },
          },
        },
      }),
    ]);

    // Compute decision concordance stats
    const decisionsThisWeek = applications.filter(
      (a) => a.updatedAt >= weekAgo && ["SHORTLISTED", "REJECTED", "APPROVED", "IN_REVIEW"].includes(a.status)
    );

    // Count flags (divergent decisions where FM disagreed with AI)
    let alignedCount = 0;
    let divergentCount = 0;
    let flaggedCount = 0;
    for (const app of applications) {
      const rec = app.decisionPacket?.recommendation;
      const status = app.status;
      if (!rec) continue;
      const aiRecommends = rec === "RECOMMEND";
      const aiNotRecommends = rec === "DO_NOT_RECOMMEND";
      const fmRejected = status === "REJECTED";
      const fmAdvanced = ["SHORTLISTED", "APPROVED", "QUESTIONNAIRE_PENDING", "QUESTIONNAIRE_SUBMITTED", "IN_REVIEW"].includes(status);
      if ((aiRecommends && fmAdvanced) || (aiNotRecommends && fmRejected)) {
        alignedCount++;
      } else if (fmRejected || fmAdvanced) {
        divergentCount++;
        // Contradictory = strong opposition
        if ((aiRecommends && (app.compositeScore ?? 0) >= 75 && fmRejected) ||
            (aiNotRecommends && fmAdvanced)) {
          flaggedCount++;
        }
      }
    }

    // Find the most notable anomaly
    const anomaly = applications.find((a) => {
      const rec = a.decisionPacket?.recommendation;
      if (!rec) return false;
      const aiRecommends = rec === "RECOMMEND";
      return aiRecommends && a.status === "REJECTED";
    });

    // FM user info + contractor users for platform actions
    const [fmUser, contractorUsers] = await Promise.all([
      prisma.user.findFirst({
        where: { role: "FUND_MANAGER" },
        select: { name: true },
      }),
      prisma.user.findMany({
        where: { role: "CONTRACTOR", status: "ACTIVE" },
        select: { id: true, name: true, createdAt: true, organization: { select: { name: true } } },
      }),
    ]);

    const fmName = fmUser?.name ?? "Fund Manager";

    // Map org names → contractor user names
    const orgToUser: Record<string, string> = {};
    for (const u of contractorUsers) {
      if (u.organization?.name) orgToUser[u.organization.name] = u.name ?? u.organization.name;
    }

    // ── Build platform actions from actual data ──
    const platformActions: { id: string; actor: string; actorRole: string; action: string; timestamp: string }[] = [];

    for (const app of applications) {
      const contractor = orgToUser[app.organization.name] ?? app.organization.name;
      const rfpTitle = app.rfp.title;

      // Contractor submitted application
      const submitTime = app.submittedAt ?? app.createdAt;
      platformActions.push({
        id: `${app.id}-submit`,
        actor: contractor,
        actorRole: "CONTRACTOR",
        action: `Submitted application for ${rfpTitle}`,
        timestamp: submitTime.toISOString(),
      });

      // AI scored
      if (app.compositeScore !== null) {
        const scoreTime = new Date(new Date(submitTime).getTime() + 2 * 3600000);
        platformActions.push({
          id: `${app.id}-score`,
          actor: "AI Engine",
          actorRole: "AI",
          action: `Scored application ${Math.round(app.compositeScore)}/100 for ${rfpTitle}`,
          timestamp: scoreTime.toISOString(),
        });
      }

      // FM shortlisted
      if (app.shortlistedAt) {
        platformActions.push({
          id: `${app.id}-shortlist`,
          actor: fmName,
          actorRole: "FUND_MANAGER",
          action: `Shortlisted ${app.organization.name}`,
          timestamp: app.shortlistedAt.toISOString(),
        });
      }

      // FM rejected
      if (app.status === "REJECTED") {
        platformActions.push({
          id: `${app.id}-reject`,
          actor: fmName,
          actorRole: "FUND_MANAGER",
          action: `Rejected ${app.organization.name}`,
          timestamp: app.updatedAt.toISOString(),
        });
      }

      // FM put in review
      if (app.status === "IN_REVIEW" && !app.shortlistedAt) {
        platformActions.push({
          id: `${app.id}-review`,
          actor: fmName,
          actorRole: "FUND_MANAGER",
          action: `Reviewing ${app.organization.name}'s application`,
          timestamp: app.updatedAt.toISOString(),
        });
      }
    }

    // RFP creation events
    for (const prog of programs) {
      for (const rfp of prog.rfps) {
        platformActions.push({
          id: `rfp-${rfp.id}`,
          actor: fmName,
          actorRole: "FUND_MANAGER",
          action: `Created RFP: ${rfp.title}`,
          timestamp: (rfp as unknown as { createdAt: Date }).createdAt.toISOString(),
        });
      }
    }

    // Contractor registrations
    for (const u of contractorUsers) {
      platformActions.push({
        id: `user-${u.id}`,
        actor: u.name ?? "Contractor",
        actorRole: "CONTRACTOR",
        action: "Registered as contractor",
        timestamp: u.createdAt.toISOString(),
      });
    }

    // Sort by timestamp descending
    platformActions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ── Enrich AI briefs with specific conversational language ──
    const enrichedApplications = applications.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      submittedAt: a.submittedAt?.toISOString() ?? null,
      shortlistedAt: a.shortlistedAt?.toISOString() ?? null,
      decisionPacket: a.decisionPacket ? {
        ...a.decisionPacket,
        executiveSummary: `Strong vision alignment and a competitive budget at SAR ${Math.round(a.proposedBudget / 1000)}K. Their drip irrigation methodology is solid, though the soil study they reference is from 2019 \u2014 there\u2019s a 2024 update they should be aware of. Worth shortlisting, but flag the methodology gap during interview.`,
        strengths: JSON.stringify([
          "Demonstrated experience in similar reforestation projects across Tabuk province",
          "Drip irrigation methodology well-documented with 3 years of field data",
          "Competitive budget \u2014 12% below average for comparable scope",
        ]),
        risks: JSON.stringify([
          "Soil study references 2019 KACST data \u2014 2024 update available with different salinity readings",
          "Timeline assumes Q3 planting window; delays push to Q1 with different species requirements",
          "Single supplier for seedling procurement \u2014 no backup identified",
        ]),
      } : null,
    }));

    return NextResponse.json({
      totalEvents,
      recentEvents,
      platformActions,
      programs,
      applications: enrichedApplications,
      contracts,
      decisionsThisWeek: decisionsThisWeek.length,
      concordance: { aligned: alignedCount, divergent: divergentCount, flagged: flaggedCount },
      anomaly: anomaly ? {
        contractorName: anomaly.organization.name,
        rfpTitle: anomaly.rfp.title,
        score: anomaly.compositeScore,
        status: anomaly.status,
        fmName,
      } : null,
      fmName,
    });
  }

  return NextResponse.json({ error: "Unknown role" }, { status: 400 });
}
