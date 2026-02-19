import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/contracts — List contracts (grants) with milestone progress
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  // Contractors only see their own contracts
  if (session.user.role === "CONTRACTOR") {
    if (!session.user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }
    where.organizationId = session.user.organizationId;
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      organization: { select: { id: true, name: true, trustTier: true } },
      application: {
        select: {
          id: true,
          compositeScore: true,
          rfp: { select: { id: true, title: true } },
        },
      },
      program: { select: { id: true, name: true } },
      milestones: {
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          sequence: true,
          title: true,
          status: true,
          disbursementAmount: true,
          disbursementPct: true,
          verifiedAt: true,
        },
      },
      disbursements: {
        select: {
          id: true,
          amount: true,
          status: true,
          releasedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contracts });
}
