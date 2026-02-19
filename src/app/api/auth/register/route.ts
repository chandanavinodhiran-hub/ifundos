import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/auth/register
 * Creates a new user account (contractors self-register)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, organizationName } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // If organization name provided, create it; otherwise register without one
    let organizationId: string | null = null;
    if (organizationName) {
      const org = await prisma.organization.create({
        data: {
          name: organizationName,
          type: "CONTRACTOR",
          status: "ACTIVE",
        },
      });
      organizationId = org.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "CONTRACTOR", // Self-registration defaults to contractor
        organizationId,
        status: "ACTIVE",
      },
    });

    // Log the registration to the audit trail
    await logAuditEvent({
      actorId: user.id,
      action: "USER_REGISTERED",
      resourceType: "USER",
      resourceId: user.id,
      purpose: "New contractor registration",
      details: { email, organizationName: organizationName ?? null },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
