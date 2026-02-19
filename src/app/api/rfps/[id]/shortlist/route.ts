import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/rfps/[id]/shortlist — Shortlist selected applications
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
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

  try {
    const body = await req.json();
    const { applicationIds } = body as { applicationIds: string[] };

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { error: "applicationIds array is required" },
        { status: 400 }
      );
    }

    // Verify all applications belong to this RFP
    const applications = await prisma.application.findMany({
      where: { id: { in: applicationIds }, rfpId: id },
      select: { id: true, status: true },
    });

    if (applications.length !== applicationIds.length) {
      return NextResponse.json(
        { error: "Some application IDs are invalid or do not belong to this RFP" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update all selected applications to SHORTLISTED
    await prisma.application.updateMany({
      where: { id: { in: applicationIds }, rfpId: id },
      data: {
        status: "SHORTLISTED",
        shortlistedAt: now,
      },
    });

    // Log audit event for each shortlisted application
    for (const appId of applicationIds) {
      await logAuditEvent({
        actorId: session.user.userId,
        action: "APPLICATION_SHORTLISTED",
        resourceType: "APPLICATION",
        resourceId: appId,
        purpose: "Application shortlisted for further evaluation",
        details: { rfpId: id },
      });
    }

    return NextResponse.json({
      message: `${applicationIds.length} application(s) shortlisted`,
      shortlistedIds: applicationIds,
    });
  } catch (error) {
    console.error("Error shortlisting applications:", error);
    return NextResponse.json(
      { error: "Failed to shortlist applications" },
      { status: 500 }
    );
  }
}
