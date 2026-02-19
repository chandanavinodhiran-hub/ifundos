import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyAuditChain } from "@/lib/audit";

/**
 * GET /api/audit — Retrieve audit events
 * Query params: limit, offset, resourceType, action
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "AUDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const resourceType = searchParams.get("resourceType");
  const action = searchParams.get("action");

  const where: Record<string, unknown> = {};
  if (resourceType) where.resourceType = resourceType;
  if (action) where.action = action;

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
      include: { actor: { select: { name: true, email: true, role: true } } },
    }),
    prisma.auditEvent.count({ where }),
  ]);

  return NextResponse.json({ events, total, limit, offset });
}

/**
 * GET /api/audit/verify — Verify audit chain integrity
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "AUDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await verifyAuditChain();
  return NextResponse.json(result);
}
