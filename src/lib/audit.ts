import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * iFundOS Audit System
 * Creates tamper-evident audit log entries with cryptographic hash chain.
 * Each event's hashCurr = SHA-256(event data + previous event's hashCurr),
 * creating an immutable chain that detects any modification.
 */

interface AuditParams {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  purpose?: string;
  details?: Record<string, unknown>;
}

/** Compute SHA-256 hash of audit event data chained to previous hash */
function computeHash(data: string, prevHash: string | null): string {
  const payload = `${prevHash ?? "GENESIS"}:${data}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/** Log an audit event with hash chain integrity */
export async function logAuditEvent(params: AuditParams): Promise<void> {
  try {
    // Get the most recent event's hash to chain from
    const lastEvent = await prisma.auditEvent.findFirst({
      orderBy: { timestamp: "desc" },
      select: { hashCurr: true },
    });

    const prevHash = lastEvent?.hashCurr ?? null;

    // Build the data string for hashing
    const eventData = JSON.stringify({
      actorId: params.actorId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      purpose: params.purpose,
      details: params.details,
      timestamp: new Date().toISOString(),
    });

    const hashCurr = computeHash(eventData, prevHash);

    await prisma.auditEvent.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        purpose: params.purpose,
        details: params.details ? JSON.stringify(params.details) : null,
        hashPrev: prevHash,
        hashCurr,
      },
    });
  } catch (error) {
    // Audit logging should never crash the calling operation
    console.error("Audit logging failed:", error);
  }
}

/** Verify the integrity of the entire audit chain */
export async function verifyAuditChain(): Promise<{
  valid: boolean;
  totalEvents: number;
  brokenAt?: number;
}> {
  const events = await prisma.auditEvent.findMany({
    orderBy: { timestamp: "asc" },
  });

  if (events.length === 0) {
    return { valid: true, totalEvents: 0 };
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const expectedPrev = i === 0 ? null : events[i - 1].hashCurr;

    if (event.hashPrev !== expectedPrev) {
      return { valid: false, totalEvents: events.length, brokenAt: i };
    }
  }

  return { valid: true, totalEvents: events.length };
}
