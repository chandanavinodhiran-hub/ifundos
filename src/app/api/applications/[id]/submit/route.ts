import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/submit — Submit an application
// ---------------------------------------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: { rfp: { select: { status: true } } },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Contractors can only submit their own organization's applications
  if (
    session.user.role === "CONTRACTOR" &&
    application.organizationId !== session.user.organizationId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (application.status !== "DRAFT") {
    return NextResponse.json(
      { error: `Cannot submit application with status ${application.status}. Only DRAFT applications can be submitted.` },
      { status: 400 }
    );
  }

  if (application.rfp.status !== "OPEN") {
    return NextResponse.json(
      { error: "The RFP is no longer open for submissions" },
      { status: 400 }
    );
  }

  const now = new Date();

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      submittedAt: now,
    },
  });

  await logAuditEvent({
    actorId: session.user.userId,
    action: "APPLICATION_SUBMITTED",
    resourceType: "APPLICATION",
    resourceId: id,
    purpose: "Application submitted for review",
    details: {
      rfpId: application.rfpId,
      organizationId: application.organizationId,
      proposedBudget: application.proposedBudget,
    },
  });

  return NextResponse.json({ application: updated });
}
