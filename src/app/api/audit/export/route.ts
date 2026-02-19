import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audit/export — Export audit events as CSV
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "AUDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const events = await prisma.auditEvent.findMany({
    orderBy: { timestamp: "asc" },
    include: { actor: { select: { name: true, email: true, role: true } } },
  });

  const header = "Timestamp,Actor Name,Actor Email,Actor Role,Action,Resource Type,Resource ID,Purpose,Hash";
  const rows = events.map((e) => {
    const actor = e.actor;
    return [
      e.timestamp.toISOString(),
      actor?.name ?? "System",
      actor?.email ?? "",
      actor?.role ?? "",
      e.action,
      e.resourceType,
      e.resourceId ?? "",
      (e.purpose ?? "").replace(/,/g, ";"),
      e.hashCurr ?? "",
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-trail-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
