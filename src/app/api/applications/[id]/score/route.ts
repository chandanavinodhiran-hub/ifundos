import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { scoreApplication } from "@/lib/scoring";

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/score — Trigger AI scoring for a single app
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

  const application = await prisma.application.findUnique({
    where: { id },
    select: { id: true, status: true, rfpId: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "SUBMITTED") {
    return NextResponse.json(
      { error: `Cannot score application with status ${application.status}. Only SUBMITTED applications can be scored.` },
      { status: 400 }
    );
  }

  try {
    // Mark as SCORING
    await prisma.application.update({
      where: { id },
      data: { status: "SCORING" },
    });

    // Run the scoring engine
    await scoreApplication(id, session.user.userId);

    // Fetch the updated application with scores
    const scored = await prisma.application.findUnique({
      where: { id },
      include: { decisionPacket: true },
    });

    await logAuditEvent({
      actorId: session.user.userId,
      action: "APPLICATION_SCORED",
      resourceType: "APPLICATION",
      resourceId: id,
      purpose: "AI scoring completed for application",
      details: {
        rfpId: application.rfpId,
        compositeScore: scored?.compositeScore,
      },
    });

    return NextResponse.json({ application: scored });
  } catch (error) {
    // Revert status on failure
    await prisma.application.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });

    console.error("Error scoring application:", error);
    return NextResponse.json(
      { error: "Scoring failed. Application status has been reverted." },
      { status: 500 }
    );
  }
}
