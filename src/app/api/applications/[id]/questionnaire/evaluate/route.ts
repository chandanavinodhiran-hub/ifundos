import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/questionnaire/evaluate — Evaluate a response
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "FUND_MANAGER") {
    return NextResponse.json({ error: "Unauthorized — FUND_MANAGER only" }, { status: 403 });
  }

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    select: { id: true, rfpId: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { questionId, internalNotes, internalScore } = body as {
      questionId: string;
      internalNotes?: string;
      internalScore?: number;
    };

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    // Validate score range if provided
    if (internalScore !== undefined && (internalScore < 0 || internalScore > 10)) {
      return NextResponse.json(
        { error: "internalScore must be between 0 and 10" },
        { status: 400 }
      );
    }

    // Verify the question belongs to this application's RFP
    const question = await prisma.questionnaireQuestion.findFirst({
      where: { id: questionId, rfpId: application.rfpId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found or does not belong to this RFP" },
        { status: 404 }
      );
    }

    const evaluatorId = session.user.userId;

    // Upsert the evaluation
    const existing = await prisma.questionnaireEvaluation.findFirst({
      where: { applicationId: id, questionId, evaluatorId },
    });

    let evaluation;
    if (existing) {
      evaluation = await prisma.questionnaireEvaluation.update({
        where: { id: existing.id },
        data: {
          internalNotes: internalNotes ?? existing.internalNotes,
          internalScore: internalScore ?? existing.internalScore,
        },
      });
    } else {
      evaluation = await prisma.questionnaireEvaluation.create({
        data: {
          applicationId: id,
          questionId,
          evaluatorId,
          internalNotes: internalNotes || null,
          internalScore: internalScore ?? null,
        },
      });
    }

    await logAuditEvent({
      actorId: evaluatorId,
      action: "QUESTIONNAIRE_EVALUATED",
      resourceType: "APPLICATION",
      resourceId: id,
      purpose: "Fund manager evaluated questionnaire response",
      details: {
        questionId,
        internalScore,
        isUpdate: !!existing,
      },
    });

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error("Error evaluating questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to save evaluation" },
      { status: 500 }
    );
  }
}
