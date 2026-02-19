import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/rfps/[id]/award — Award contract to a winning application
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
    include: {
      program: true,
      applications: {
        where: { status: { in: ["SHORTLISTED", "QUESTIONNAIRE_SUBMITTED", "IN_REVIEW"] } },
        select: { id: true, organizationId: true, status: true },
      },
    },
  });

  if (!rfp) {
    return NextResponse.json({ error: "RFP not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { applicationId, awardAmount, justification } = body as {
      applicationId: string;
      awardAmount: number;
      justification?: string;
    };

    if (!applicationId || !awardAmount) {
      return NextResponse.json(
        { error: "applicationId and awardAmount are required" },
        { status: 400 }
      );
    }

    // Verify the winning application belongs to this RFP
    const winningApp = rfp.applications.find((a) => a.id === applicationId);
    if (!winningApp) {
      return NextResponse.json(
        { error: "Application not found or not eligible for award in this RFP" },
        { status: 400 }
      );
    }

    // Define milestones for tree planting contract
    const milestoneDefinitions = [
      { sequence: 1, title: "Site Preparation", pct: 0.10 },
      { sequence: 2, title: "Planting Phase", pct: 0.30 },
      { sequence: 3, title: "6-Month Survival Assessment", pct: 0.20 },
      { sequence: 4, title: "12-Month Verification", pct: 0.25 },
      { sequence: 5, title: "Final Handover", pct: 0.15 },
    ];

    // Execute award in a transaction
    const contract = await prisma.$transaction(async (tx) => {
      // 1. Create the contract
      const newContract = await tx.contract.create({
        data: {
          applicationId,
          programId: rfp.programId,
          organizationId: winningApp.organizationId,
          awardAmount: parseFloat(String(awardAmount)),
          justification: justification || null,
          milestoneSchedule: JSON.stringify(milestoneDefinitions),
          status: "ACTIVE",
        },
      });

      // 2. Create milestones
      for (const m of milestoneDefinitions) {
        await tx.milestone.create({
          data: {
            contractId: newContract.id,
            sequence: m.sequence,
            title: m.title,
            disbursementPct: m.pct,
            disbursementAmount: Math.round(awardAmount * m.pct * 100) / 100,
            triggerDescription: `Complete ${m.title.toLowerCase()} phase and submit evidence`,
            verificationMethod: "AI-assisted evidence review with human verification",
            status: "PENDING",
          },
        });
      }

      // 3. Set winning application to APPROVED
      await tx.application.update({
        where: { id: applicationId },
        data: { status: "APPROVED" },
      });

      // 4. Reject all other shortlisted / eligible applications
      const otherAppIds = rfp.applications
        .filter((a) => a.id !== applicationId)
        .map((a) => a.id);

      if (otherAppIds.length > 0) {
        await tx.application.updateMany({
          where: { id: { in: otherAppIds } },
          data: {
            status: "REJECTED",
            rejectionReason: "Another contractor selected",
          },
        });
      }

      // 5. Set RFP status to AWARDED
      await tx.rFP.update({
        where: { id },
        data: { status: "AWARDED" },
      });

      // 6. Update program budget allocated
      await tx.program.update({
        where: { id: rfp.programId },
        data: {
          budgetAllocated: {
            increment: parseFloat(String(awardAmount)),
          },
        },
      });

      return newContract;
    });

    // Fetch contract with milestones
    const completeContract = await prisma.contract.findUnique({
      where: { id: contract.id },
      include: {
        milestones: { orderBy: { sequence: "asc" } },
        organization: { select: { id: true, name: true } },
      },
    });

    // Log audit events
    await logAuditEvent({
      actorId: session.user.userId,
      action: "CONTRACT_AWARDED",
      resourceType: "CONTRACT",
      resourceId: contract.id,
      purpose: "Contract awarded to selected contractor",
      details: {
        rfpId: id,
        applicationId,
        awardAmount,
        organizationId: winningApp.organizationId,
        justification,
      },
    });

    await logAuditEvent({
      actorId: session.user.userId,
      action: "RFP_AWARDED",
      resourceType: "RFP",
      resourceId: id,
      purpose: "RFP award process completed",
      details: {
        winningApplicationId: applicationId,
        rejectedCount: rfp.applications.filter((a) => a.id !== applicationId).length,
      },
    });

    return NextResponse.json({ contract: completeContract }, { status: 201 });
  } catch (error) {
    console.error("Error awarding contract:", error);
    return NextResponse.json(
      { error: "Failed to award contract" },
      { status: 500 }
    );
  }
}
