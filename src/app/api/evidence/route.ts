import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// GET /api/evidence — List evidence records for review queue
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reviewStatus = searchParams.get("reviewStatus");

  const where: Record<string, unknown> = {};

  if (reviewStatus && reviewStatus !== "ALL") {
    where.reviewStatus = reviewStatus;
  }

  // Contractors only see evidence from their own contracts
  if (session.user.role === "CONTRACTOR") {
    if (!session.user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }
    where.milestone = {
      contract: { organizationId: session.user.organizationId },
    };
  }

  const evidenceRecords = await prisma.evidenceRecord.findMany({
    where,
    include: {
      milestone: {
        include: {
          contract: {
            include: {
              organization: { select: { id: true, name: true } },
              application: {
                select: {
                  rfp: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ evidenceRecords });
}

// ---------------------------------------------------------------------------
// POST /api/evidence — Submit new evidence for a milestone
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { milestoneId, type, filePath, metadata } = body;

    if (!milestoneId || !type) {
      return NextResponse.json(
        { error: "milestoneId and type are required" },
        { status: 400 }
      );
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    const evidence = await prisma.evidenceRecord.create({
      data: {
        milestoneId,
        type,
        filePath: filePath || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        reviewStatus: "PENDING",
        slideSolveCheck: "PENDING",
      },
    });

    // Update milestone status to EVIDENCE_SUBMITTED
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: "EVIDENCE_SUBMITTED" },
    });

    await logAuditEvent({
      actorId: session.user.userId,
      action: "EVIDENCE_SUBMITTED",
      resourceType: "EVIDENCE",
      resourceId: evidence.id,
      purpose: "Evidence submitted for milestone verification",
      details: {
        milestoneId,
        type,
        contractId: milestone.contractId,
      },
    });

    return NextResponse.json({ evidence }, { status: 201 });
  } catch (error) {
    console.error("Error submitting evidence:", error);
    return NextResponse.json(
      { error: "Failed to submit evidence" },
      { status: 500 }
    );
  }
}
