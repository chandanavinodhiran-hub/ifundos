import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/contracts/[id] — Full contract detail with milestones & evidence
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

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      organization: true,
      application: {
        include: {
          rfp: { select: { id: true, title: true, description: true } },
          decisionPacket: true,
        },
      },
      program: { select: { id: true, name: true } },
      milestones: {
        orderBy: { sequence: "asc" },
        include: {
          evidenceRecords: { orderBy: { submittedAt: "desc" } },
          disbursements: true,
        },
      },
      disbursements: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Contractors can only see their own contracts
  if (
    session.user.role === "CONTRACTOR" &&
    contract.organizationId !== session.user.organizationId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ contract });
}
