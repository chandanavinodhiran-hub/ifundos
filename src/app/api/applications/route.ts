import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// GET /api/applications — List applications with role-based filtering
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rfpId = searchParams.get("rfpId");

  // Build where clause based on role
  const where: Record<string, unknown> = {};

  // Contractors can only see their own organization's applications
  if (session.user.role === "CONTRACTOR") {
    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "No organization associated with your account" },
        { status: 400 }
      );
    }
    where.organizationId = session.user.organizationId;
  }

  // Fund managers can filter by rfpId
  if (rfpId) {
    where.rfpId = rfpId;
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      rfp: {
        select: { id: true, title: true, status: true, deadline: true },
      },
      organization: {
        select: { id: true, name: true, type: true, trustTier: true },
      },
      decisionPacket: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

// ---------------------------------------------------------------------------
// POST /api/applications — Create a new application
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rfpId, proposalData, proposedBudget, status } = body;

    if (!rfpId) {
      return NextResponse.json(
        { error: "rfpId is required" },
        { status: 400 }
      );
    }

    // Get organization from session
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization associated with your account" },
        { status: 400 }
      );
    }

    // Verify RFP exists and is open
    const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }
    if (rfp.status !== "OPEN") {
      return NextResponse.json(
        { error: "RFP is not open for applications" },
        { status: 400 }
      );
    }

    // Check for existing application from this org for this RFP
    const existingApp = await prisma.application.findFirst({
      where: { rfpId, organizationId },
    });
    if (existingApp) {
      return NextResponse.json(
        { error: "Your organization has already applied to this RFP", existingApplicationId: existingApp.id },
        { status: 409 }
      );
    }

    const appStatus = status === "SUBMITTED" ? "SUBMITTED" : "DRAFT";
    const now = new Date();

    const application = await prisma.application.create({
      data: {
        rfpId,
        organizationId,
        proposalData:
          typeof proposalData === "string"
            ? proposalData
            : proposalData
              ? JSON.stringify(proposalData)
              : null,
        proposedBudget: proposedBudget ? parseFloat(String(proposedBudget)) : 0,
        status: appStatus,
        submittedAt: appStatus === "SUBMITTED" ? now : null,
      },
    });

    await logAuditEvent({
      actorId: session.user.userId,
      action: appStatus === "SUBMITTED" ? "APPLICATION_SUBMITTED" : "APPLICATION_CREATED",
      resourceType: "APPLICATION",
      resourceId: application.id,
      purpose:
        appStatus === "SUBMITTED"
          ? "Application created and submitted"
          : "Application draft created",
      details: {
        rfpId,
        organizationId,
        proposedBudget: application.proposedBudget,
        status: appStatus,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
