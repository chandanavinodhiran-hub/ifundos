import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// GET /api/applications/[id] — Get a single application with full details
// ---------------------------------------------------------------------------
export async function GET(
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
    include: {
      rfp: {
        include: {
          program: { select: { id: true, name: true } },
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          trustTier: true,
          registrationNumber: true,
          businessCategories: true,
          certifications: true,
        },
      },
      decisionPacket: true,
      questionnaireResponses: {
        include: {
          question: true,
        },
        orderBy: { question: { sortOrder: "asc" } },
      },
      reviews: {
        include: {
          reviewer: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Contractors can only view their own organization's applications
  if (
    session.user.role === "CONTRACTOR" &&
    application.organizationId !== session.user.organizationId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ application });
}

// ---------------------------------------------------------------------------
// PATCH /api/applications/[id] — Update application fields
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Contractors can only update their own organization's applications
  if (
    session.user.role === "CONTRACTOR" &&
    existing.organizationId !== session.user.organizationId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { proposalData, proposedBudget, status } = body;

    const updateData: Record<string, unknown> = {};

    if (proposalData !== undefined) {
      updateData.proposalData =
        typeof proposalData === "string"
          ? proposalData
          : JSON.stringify(proposalData);
    }

    if (proposedBudget !== undefined) {
      updateData.proposedBudget = parseFloat(String(proposedBudget));
    }

    if (status !== undefined) {
      updateData.status = status;
      // If transitioning to SUBMITTED, set submittedAt
      if (status === "SUBMITTED" && existing.status !== "SUBMITTED") {
        updateData.submittedAt = new Date();
      }
    }

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      actorId: session.user.userId,
      action: "APPLICATION_UPDATED",
      resourceType: "APPLICATION",
      resourceId: id,
      purpose: "Application updated",
      details: {
        updatedFields: Object.keys(updateData),
        previousStatus: existing.status,
        newStatus: status || existing.status,
      },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
