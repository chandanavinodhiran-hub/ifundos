import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import bcrypt from "bcryptjs";

// GET /api/users/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

// PATCH /api/users/:id — Update user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, role, organizationId, clearanceLevel, status, password } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (organizationId !== undefined) updateData.organizationId = organizationId || null;
  if (clearanceLevel !== undefined) updateData.clearanceLevel = clearanceLevel;
  if (status !== undefined) updateData.status = status;
  if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { organization: { select: { id: true, name: true, trustTier: true } } },
  });

  await logAuditEvent({
    actorId: session.user.userId,
    action: "USER_UPDATED",
    resourceType: "USER",
    resourceId: user.id,
    purpose: `Admin updated user: ${Object.keys(updateData).join(", ")}`,
    details: { changes: Object.keys(updateData) },
  });

  return NextResponse.json({ user });
}

// DELETE /api/users/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  // Don't allow deleting yourself
  if (id === session.user.userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.delete({ where: { id } });

  await logAuditEvent({
    actorId: session.user.userId,
    action: "USER_DELETED",
    resourceType: "USER",
    resourceId: id,
    purpose: "Admin deleted user",
    details: { email: user.email, role: user.role },
  });

  return NextResponse.json({ success: true });
}
