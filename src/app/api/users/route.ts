import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import bcrypt from "bcryptjs";

// GET /api/users — List all users (admin only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (role && role !== "ALL") {
    where.role = role;
  }

  const users = await prisma.user.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: { organization: { select: { id: true, name: true, trustTier: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// POST /api/users — Create a user (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { email, password, name, role, organizationId, clearanceLevel } = body;

  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      organizationId: organizationId || null,
      clearanceLevel: clearanceLevel || 1,
      status: "ACTIVE",
    },
    include: { organization: { select: { id: true, name: true, trustTier: true } } },
  });

  await logAuditEvent({
    actorId: session.user.userId,
    action: "USER_CREATED",
    resourceType: "USER",
    resourceId: user.id,
    purpose: "Admin created new user",
    details: { email, role, organizationId },
  });

  return NextResponse.json({ user }, { status: 201 });
}
