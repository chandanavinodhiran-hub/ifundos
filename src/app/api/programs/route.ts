import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// GET /api/programs — List all programs with their RFPs
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const programs = await prisma.program.findMany({
    include: {
      rfps: {
        select: { id: true, title: true, status: true, deadline: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { contracts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ programs });
}

// POST /api/programs — Create a program (admin/fund_manager)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "FUND_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, budgetTotal, sgiTargets, status } = body;

  if (!name || !budgetTotal) {
    return NextResponse.json({ error: "Name and budget are required" }, { status: 400 });
  }

  const program = await prisma.program.create({
    data: {
      name,
      description: description || null,
      budgetTotal: parseFloat(budgetTotal),
      sgiTargets: sgiTargets ? JSON.stringify(sgiTargets) : null,
      status: status || "ACTIVE",
    },
  });

  await logAuditEvent({
    actorId: session.user.userId,
    action: "PROGRAM_CREATED",
    resourceType: "PROGRAM",
    resourceId: program.id,
    purpose: "New funding program created",
    details: { name, budgetTotal },
  });

  return NextResponse.json({ program }, { status: 201 });
}
