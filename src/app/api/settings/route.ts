import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

function getDefaultSettings() {
  return {
    scoringWeights: {
      procurementIntegrity: 25,
      visionAlignment: 25,
      scientificViability: 25,
      impactPotential: 25,
    },
    systemToggles: {
      requireMfaFundManagers: false,
      autoScoreOnSubmission: true,
      enableSlideSolveChecks: true,
    },
  };
}

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
    }
  } catch {
    // Fall through to default
  }
  return getDefaultSettings();
}

function saveSettings(settings: Record<string, unknown>) {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

// GET /api/settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return NextResponse.json(loadSettings());
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const current = loadSettings();
  const updated = { ...current, ...body };
  saveSettings(updated);

  await logAuditEvent({
    actorId: session.user.userId,
    action: "SETTINGS_UPDATED",
    resourceType: "SETTINGS",
    resourceId: "system",
    purpose: "System settings updated",
    details: { changes: Object.keys(body) },
  });

  return NextResponse.json(updated);
}
