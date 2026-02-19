import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// GET /api/applications/[id]/questionnaire — Get questionnaire with responses
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
    select: { id: true, rfpId: true, organizationId: true, questionnaireStatus: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Contractors can only view their own organization's questionnaire
  if (
    session.user.role === "CONTRACTOR" &&
    application.organizationId !== session.user.organizationId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get questionnaire questions for the RFP
  const questions = await prisma.questionnaireQuestion.findMany({
    where: { rfpId: application.rfpId },
    orderBy: { sortOrder: "asc" },
  });

  // Get any existing responses for this application
  const responses = await prisma.questionnaireResponse.findMany({
    where: { applicationId: id },
    include: { question: true },
  });

  // Build a map of questionId -> response for easy lookup
  const responseMap: Record<string, {
    id: string;
    responseText: string | null;
    filePath: string | null;
    submittedAt: Date | null;
  }> = {};
  for (const r of responses) {
    responseMap[r.questionId] = {
      id: r.id,
      responseText: r.responseText,
      filePath: r.filePath,
      submittedAt: r.submittedAt,
    };
  }

  // Combine questions with their responses
  const questionnaire = questions.map((q) => ({
    question: q,
    response: responseMap[q.id] || null,
  }));

  return NextResponse.json({
    applicationId: id,
    questionnaireStatus: application.questionnaireStatus,
    questionnaire,
  });
}

// ---------------------------------------------------------------------------
// POST /api/applications/[id]/questionnaire — Save questionnaire responses
// ---------------------------------------------------------------------------

interface ResponseInput {
  questionId: string;
  responseText?: string;
  filePath?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    select: { id: true, rfpId: true, organizationId: true, questionnaireStatus: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Only the contractor's own organization can save responses
  if (
    session.user.role === "CONTRACTOR" &&
    application.organizationId !== session.user.organizationId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (application.questionnaireStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Questionnaire is not in PENDING status" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const responses = body as ResponseInput[];

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: "Request body must be an array of responses" },
        { status: 400 }
      );
    }

    // Upsert each response
    const upserted = [];
    for (const r of responses) {
      if (!r.questionId) continue;

      // Check if a response already exists
      const existing = await prisma.questionnaireResponse.findFirst({
        where: { applicationId: id, questionId: r.questionId },
      });

      if (existing) {
        const updated = await prisma.questionnaireResponse.update({
          where: { id: existing.id },
          data: {
            responseText: r.responseText ?? existing.responseText,
            filePath: r.filePath ?? existing.filePath,
          },
        });
        upserted.push(updated);
      } else {
        const created = await prisma.questionnaireResponse.create({
          data: {
            applicationId: id,
            questionId: r.questionId,
            responseText: r.responseText || null,
            filePath: r.filePath || null,
          },
        });
        upserted.push(created);
      }
    }

    return NextResponse.json({
      message: `${upserted.length} response(s) saved`,
      responses: upserted,
    });
  } catch (error) {
    console.error("Error saving questionnaire responses:", error);
    return NextResponse.json(
      { error: "Failed to save questionnaire responses" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/applications/[id]/questionnaire — Submit (finalize) questionnaire
// ---------------------------------------------------------------------------
export async function PUT(
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
    select: {
      id: true,
      rfpId: true,
      organizationId: true,
      questionnaireStatus: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Only the contractor's own organization can submit
  if (
    session.user.role === "CONTRACTOR" &&
    application.organizationId !== session.user.organizationId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (application.questionnaireStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Questionnaire is not in PENDING status" },
      { status: 400 }
    );
  }

  // Verify required questions have responses
  const requiredQuestions = await prisma.questionnaireQuestion.findMany({
    where: { rfpId: application.rfpId, isRequired: true },
    select: { id: true, questionText: true },
  });

  const existingResponses = await prisma.questionnaireResponse.findMany({
    where: { applicationId: id },
    select: { questionId: true, responseText: true, filePath: true },
  });

  const answeredQuestionIds = new Set(
    existingResponses
      .filter((r) => r.responseText || r.filePath)
      .map((r) => r.questionId)
  );

  const missingRequired = requiredQuestions.filter(
    (q) => !answeredQuestionIds.has(q.id)
  );

  if (missingRequired.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required questionnaire responses",
        missingQuestions: missingRequired.map((q) => ({
          id: q.id,
          questionText: q.questionText,
        })),
      },
      { status: 400 }
    );
  }

  const now = new Date();

  // Mark all responses as submitted and update application
  await prisma.$transaction(async (tx) => {
    // Set submittedAt on all responses
    await tx.questionnaireResponse.updateMany({
      where: { applicationId: id },
      data: { submittedAt: now },
    });

    // Update application questionnaire status
    await tx.application.update({
      where: { id },
      data: {
        questionnaireStatus: "SUBMITTED",
        questionnaireSubmittedAt: now,
        status: "QUESTIONNAIRE_SUBMITTED",
      },
    });
  });

  await logAuditEvent({
    actorId: session.user.userId,
    action: "QUESTIONNAIRE_SUBMITTED",
    resourceType: "APPLICATION",
    resourceId: id,
    purpose: "Contractor submitted questionnaire responses",
    details: {
      rfpId: application.rfpId,
      responseCount: existingResponses.length,
    },
  });

  return NextResponse.json({
    message: "Questionnaire submitted successfully",
    applicationId: id,
    questionnaireStatus: "SUBMITTED",
    questionnaireSubmittedAt: now,
  });
}
