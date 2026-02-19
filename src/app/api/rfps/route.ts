import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// GET /api/rfps — List all RFPs with program info and application counts
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const openOnly = searchParams.get("open") === "true";

  // Contractors should only see OPEN RFPs when ?open=true
  const statusFilter =
    session.user.role === "CONTRACTOR" && openOnly
      ? { status: "OPEN" }
      : {};

  const rfps = await prisma.rFP.findMany({
    where: statusFilter,
    include: {
      program: {
        select: { id: true, name: true, budgetTotal: true, budgetAllocated: true },
      },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rfps });
}

// ---------------------------------------------------------------------------
// POST /api/rfps — Create a new RFP (FUND_MANAGER / ADMIN only)
// ---------------------------------------------------------------------------

interface QuestionnaireConfigItem {
  questionText: string;
  questionType: string;
  isRequired?: boolean;
  sortOrder?: number;
  options?: string[];
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "FUND_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      programId,
      title,
      description,
      eligibilityCriteria,
      scoringRubric,
      evidenceRequirements,
      questionnaireConfig,
      deadline,
      status,
    } = body;

    if (!programId || !title) {
      return NextResponse.json(
        { error: "programId and title are required" },
        { status: 400 }
      );
    }

    // Verify program exists
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Parse questionnaire config for creating questions
    let parsedQuestionnaireConfig: QuestionnaireConfigItem[] = [];
    if (questionnaireConfig) {
      try {
        parsedQuestionnaireConfig =
          typeof questionnaireConfig === "string"
            ? JSON.parse(questionnaireConfig)
            : questionnaireConfig;
      } catch {
        return NextResponse.json(
          { error: "Invalid questionnaireConfig JSON" },
          { status: 400 }
        );
      }
    }

    // Create RFP with questionnaire questions in a transaction
    const rfp = await prisma.$transaction(async (tx) => {
      const newRfp = await tx.rFP.create({
        data: {
          programId,
          title,
          description: description || null,
          eligibilityCriteria:
            typeof eligibilityCriteria === "string"
              ? eligibilityCriteria
              : eligibilityCriteria
                ? JSON.stringify(eligibilityCriteria)
                : null,
          scoringRubric:
            typeof scoringRubric === "string"
              ? scoringRubric
              : scoringRubric
                ? JSON.stringify(scoringRubric)
                : null,
          evidenceRequirements:
            typeof evidenceRequirements === "string"
              ? evidenceRequirements
              : evidenceRequirements
                ? JSON.stringify(evidenceRequirements)
                : null,
          questionnaireConfig:
            typeof questionnaireConfig === "string"
              ? questionnaireConfig
              : questionnaireConfig
                ? JSON.stringify(questionnaireConfig)
                : null,
          deadline: deadline ? new Date(deadline) : null,
          status: status || "DRAFT",
          createdById: session.user.userId,
        },
      });

      // Create QuestionnaireQuestion records from the config
      if (parsedQuestionnaireConfig.length > 0) {
        await tx.questionnaireQuestion.createMany({
          data: parsedQuestionnaireConfig.map(
            (q: QuestionnaireConfigItem, index: number) => ({
              rfpId: newRfp.id,
              questionText: q.questionText,
              questionType: q.questionType || "SHORT_ANSWER",
              isRequired: q.isRequired !== false,
              sortOrder: q.sortOrder ?? index,
              options: q.options ? JSON.stringify(q.options) : null,
            })
          ),
        });
      }

      return newRfp;
    });

    // Fetch complete RFP with questions
    const completeRfp = await prisma.rFP.findUnique({
      where: { id: rfp.id },
      include: { questionnaireQuestions: { orderBy: { sortOrder: "asc" } } },
    });

    await logAuditEvent({
      actorId: session.user.userId,
      action: "RFP_CREATED",
      resourceType: "RFP",
      resourceId: rfp.id,
      purpose: "New RFP created",
      details: {
        title,
        programId,
        questionCount: parsedQuestionnaireConfig.length,
      },
    });

    return NextResponse.json({ rfp: completeRfp }, { status: 201 });
  } catch (error) {
    console.error("Error creating RFP:", error);
    return NextResponse.json(
      { error: "Failed to create RFP" },
      { status: 500 }
    );
  }
}
