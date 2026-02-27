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
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {};
  if (resourceType) where.resourceType = resourceType;
  if (action) where.action = action;
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    where.timestamp = dateFilter;
  }

  const [events, total, allEvents] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
      include: { actor: { select: { name: true, email: true, role: true } } },
    }),
    prisma.auditEvent.count({ where }),
    prisma.auditEvent.findMany({
      where,
      select: { action: true },
    }),
  ]);

  // Compute category counts from filtered events
  const categoryCounts: Record<string, number> = {
    CREATE: 0, UPDATE: 0, DELETE: 0, LOGIN: 0, VERIFY: 0, OTHER: 0,
  };
  for (const e of allEvents) {
    const a = e.action;
    if (a.startsWith("CREATE") || a.includes("CREATED")) categoryCounts.CREATE++;
    else if (a.startsWith("UPDATE") || a.includes("UPDATED")) categoryCounts.UPDATE++;
    else if (a.startsWith("DELETE") || a.includes("DELETED")) categoryCounts.DELETE++;
    else if (a.startsWith("LOGIN") || a.includes("LOGIN")) categoryCounts.LOGIN++;
    else if (a.startsWith("VERIFY") || a.includes("VERIFY")) categoryCounts.VERIFY++;
    else categoryCounts.OTHER++;
  }

  return NextResponse.json({ events, total, limit, offset, categoryCounts });
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
