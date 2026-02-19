import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { scoreApplication } from "@/lib/scoring";

// ---------------------------------------------------------------------------
// POST /api/rfps/[id]/score-all — Trigger AI scoring for all SUBMITTED apps
// ---------------------------------------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "FUND_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const rfp = await prisma.rFP.findUnique({ where: { id } });
  if (!rfp) {
    return NextResponse.json({ error: "RFP not found" }, { status: 404 });
  }

  // Find all SUBMITTED applications for this RFP
  const applications = await prisma.application.findMany({
    where: { rfpId: id, status: "SUBMITTED" },
    select: { id: true },
  });

  if (applications.length === 0) {
    return NextResponse.json(
      { error: "No submitted applications to score" },
      { status: 400 }
    );
  }

  // Mark all as SCORING first
  await prisma.application.updateMany({
    where: { rfpId: id, status: "SUBMITTED" },
    data: { status: "SCORING" },
  });

  const results: { applicationId: string; success: boolean; error?: string }[] = [];

  // Score each application
  for (const app of applications) {
    try {
      await scoreApplication(app.id, session.user.userId);
      results.push({ applicationId: app.id, success: true });

      await logAuditEvent({
        actorId: session.user.userId,
        action: "APPLICATION_SCORED",
        resourceType: "APPLICATION",
        resourceId: app.id,
        purpose: "AI scoring completed for application",
        details: { rfpId: id },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Scoring failed for application ${app.id}:`, message);
      results.push({ applicationId: app.id, success: false, error: message });

      // Revert status if scoring failed
      await prisma.application.update({
        where: { id: app.id },
        data: { status: "SUBMITTED" },
      });
    }
  }

  await logAuditEvent({
    actorId: session.user.userId,
    action: "RFP_BATCH_SCORING",
    resourceType: "RFP",
    resourceId: id,
    purpose: "Batch AI scoring triggered for RFP applications",
    details: {
      totalApplications: applications.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    },
  });

  return NextResponse.json({
    message: "Scoring complete",
    results,
    summary: {
      total: applications.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    },
  });
}
