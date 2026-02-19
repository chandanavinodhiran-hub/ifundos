import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/evidence/[id]/review — Approve or reject evidence
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

  const evidence = await prisma.evidenceRecord.findUnique({
    where: { id },
    include: {
      milestone: {
        include: {
          contract: true,
        },
      },
    },
  });

  if (!evidence) {
    return NextResponse.json(
      { error: "Evidence not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { decision, slideSolveCheck } = body as {
      decision: "APPROVED" | "REJECTED";
      slideSolveCheck?: "PASS" | "FAIL";
    };

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "decision must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Update evidence record
    const updated = await prisma.evidenceRecord.update({
      where: { id },
      data: {
        reviewStatus: decision,
        reviewedAt: new Date(),
        slideSolveCheck: slideSolveCheck || evidence.slideSolveCheck,
      },
    });

    // If approved, check if all evidence for this milestone is approved
    if (decision === "APPROVED") {
      const allEvidence = await prisma.evidenceRecord.findMany({
        where: { milestoneId: evidence.milestoneId },
      });

      const allApproved = allEvidence.every(
        (e) => e.id === id ? true : e.reviewStatus === "APPROVED"
      );

      if (allApproved) {
        // Mark milestone as VERIFIED
        await prisma.milestone.update({
          where: { id: evidence.milestoneId },
          data: {
            status: "VERIFIED",
            verifiedAt: new Date(),
          },
        });

        // Create disbursement record
        await prisma.disbursement.create({
          data: {
            contractId: evidence.milestone.contractId,
            milestoneId: evidence.milestoneId,
            amount: evidence.milestone.disbursementAmount,
            status: "APPROVED",
            approvedBy: session.user.userId,
          },
        });

        // Check if all milestones are verified -> complete contract
        const contractMilestones = await prisma.milestone.findMany({
          where: { contractId: evidence.milestone.contractId },
        });

        const allVerified = contractMilestones.every(
          (m) => m.id === evidence.milestoneId ? true : m.status === "VERIFIED"
        );

        if (allVerified) {
          await prisma.contract.update({
            where: { id: evidence.milestone.contractId },
            data: { status: "COMPLETED" },
          });
        }
      }
    } else {
      // If rejected, set milestone status to FAILED
      await prisma.milestone.update({
        where: { id: evidence.milestoneId },
        data: { status: "FAILED" },
      });
    }

    await logAuditEvent({
      actorId: session.user.userId,
      action: decision === "APPROVED" ? "EVIDENCE_APPROVED" : "EVIDENCE_REJECTED",
      resourceType: "EVIDENCE",
      resourceId: id,
      purpose: `Evidence ${decision.toLowerCase()} by fund manager`,
      details: {
        milestoneId: evidence.milestoneId,
        contractId: evidence.milestone.contractId,
        slideSolveCheck: slideSolveCheck || evidence.slideSolveCheck,
      },
    });

    return NextResponse.json({ evidence: updated });
  } catch (error) {
    console.error("Error reviewing evidence:", error);
    return NextResponse.json(
      { error: "Failed to review evidence" },
      { status: 500 }
    );
  }
}
