import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/rfps/[id]/send-questionnaire — Send questionnaire to applications
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

  const rfp = await prisma.rFP.findUnique({
    where: { id },
    include: { questionnaireQuestions: { select: { id: true } } },
  });
  if (!rfp) {
    return NextResponse.json({ error: "RFP not found" }, { status: 404 });
  }

  if (rfp.questionnaireQuestions.length === 0) {
    return NextResponse.json(
      { error: "No questionnaire questions configured for this RFP" },
      { status: 400 }
    );
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

    // Update applications with questionnaire status
    await prisma.application.updateMany({
      where: { id: { in: applicationIds }, rfpId: id },
      data: {
        questionnaireStatus: "PENDING",
        questionnaireSentAt: now,
        status: "QUESTIONNAIRE_PENDING",
      },
    });

    // Log audit events
    for (const appId of applicationIds) {
      await logAuditEvent({
        actorId: session.user.userId,
        action: "QUESTIONNAIRE_SENT",
        resourceType: "APPLICATION",
        resourceId: appId,
        purpose: "Questionnaire sent to contractor",
        details: {
          rfpId: id,
          questionCount: rfp.questionnaireQuestions.length,
        },
      });
    }

    return NextResponse.json({
      message: `Questionnaire sent to ${applicationIds.length} application(s)`,
      applicationIds,
      questionCount: rfp.questionnaireQuestions.length,
    });
  } catch (error) {
    console.error("Error sending questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to send questionnaire" },
      { status: 500 }
    );
  }
}
