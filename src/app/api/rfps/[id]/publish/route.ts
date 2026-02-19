import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------------------------------------------------------
// POST /api/rfps/[id]/publish — Publish an RFP (set status to OPEN)
// ---------------------------------------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "FUND_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const rfp = await prisma.rFP.findUnique({ where: { id } });
  if (!rfp) {
    return NextResponse.json({ error: "RFP not found" }, { status: 404 });
  }

  if (rfp.status !== "DRAFT") {
    return NextResponse.json(
      { error: `Cannot publish RFP with status ${rfp.status}. Only DRAFT RFPs can be published.` },
      { status: 400 }
    );
  }

  const updatedRfp = await prisma.rFP.update({
    where: { id },
    data: { status: "OPEN" },
  });

  await logAuditEvent({
    actorId: session.user.userId,
    action: "RFP_PUBLISHED",
    resourceType: "RFP",
    resourceId: id,
    purpose: "RFP published and opened for applications",
    details: { title: rfp.title, previousStatus: rfp.status },
  });

  return NextResponse.json({ rfp: updatedRfp });
}
