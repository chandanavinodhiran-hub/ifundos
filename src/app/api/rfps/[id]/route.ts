import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// GET /api/rfps/[id] — Get a single RFP with program, applications, questions
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

  const rfp = await prisma.rFP.findUnique({
    where: { id },
    include: {
      program: true,
      applications: {
        include: {
          organization: {
            select: { id: true, name: true, type: true, trustTier: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      questionnaireQuestions: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!rfp) {
    return NextResponse.json({ error: "RFP not found" }, { status: 404 });
  }

  return NextResponse.json({ rfp });
}

// ---------------------------------------------------------------------------
// PATCH /api/rfps/[id] — Update RFP fields or status (FUND_MANAGER / ADMIN)
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "FUND_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.rFP.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "RFP not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      eligibilityCriteria,
      scoringRubric,
      evidenceRequirements,
      questionnaireConfig,
      deadline,
      status,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined)
      updateData.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) updateData.status = status;

    if (eligibilityCriteria !== undefined) {
      updateData.eligibilityCriteria =
        typeof eligibilityCriteria === "string"
          ? eligibilityCriteria
          : JSON.stringify(eligibilityCriteria);
    }
    if (scoringRubric !== undefined) {
      updateData.scoringRubric =
        typeof scoringRubric === "string"
          ? scoringRubric
          : JSON.stringify(scoringRubric);
    }
    if (evidenceRequirements !== undefined) {
      updateData.evidenceRequirements =
        typeof evidenceRequirements === "string"
          ? evidenceRequirements
          : JSON.stringify(evidenceRequirements);
    }
    if (questionnaireConfig !== undefined) {
      updateData.questionnaireConfig =
        typeof questionnaireConfig === "string"
          ? questionnaireConfig
          : JSON.stringify(questionnaireConfig);
    }

    const rfp = await prisma.rFP.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      actorId: session.user.userId,
      action: "RFP_UPDATED",
      resourceType: "RFP",
      resourceId: id,
      purpose: "RFP updated",
      details: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({ rfp });
  } catch (error) {
    console.error("Error updating RFP:", error);
    return NextResponse.json(
      { error: "Failed to update RFP" },
      { status: 500 }
    );
  }
}
