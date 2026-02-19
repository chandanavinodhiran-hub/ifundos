import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyAuditChain } from "@/lib/audit";

// POST /api/audit/verify — Verify the audit hash chain integrity
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "AUDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await verifyAuditChain();
  return NextResponse.json(result);
}
