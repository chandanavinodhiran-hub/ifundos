import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

/**
 * iFundOS Seed Script
 * Populates the database with initial users, organizations, programs, and RFPs
 * for development and demo purposes.
 */
async function main() {
  console.log("Seeding iFundOS database...\n");

  // ── Organizations ──────────────────────────────────────────
  const sefOrg = await prisma.organization.upsert({
    where: { registrationNumber: "SEF-001" },
    update: {},
    create: {
      name: "Saudi Environmental Fund",
      type: "FUND",
      registrationNumber: "SEF-001",
      capitalization: 10_000_000_000, // 10B SAR
      trustTier: "T4",
      status: "ACTIVE",
      preQualificationScore: 100,
    },
  });
  console.log("  Created organization:", sefOrg.name);

  const tabukOrg = await prisma.organization.upsert({
    where: { registrationNumber: "TGS-2024-0471" },
    update: {},
    create: {
      name: "Tabuk Green Solutions",
      type: "CONTRACTOR",
      registrationNumber: "TGS-2024-0471",
      capitalization: 25_000_000, // 25M SAR
      trustTier: "T1",
      status: "ACTIVE",
      preQualificationScore: 72.5,
    },
  });
  console.log("  Created organization:", tabukOrg.name);

  const auditOrg = await prisma.organization.upsert({
    where: { registrationNumber: "AUD-GOV-001" },
    update: {},
    create: {
      name: "National Audit Bureau",
      type: "AUDITOR",
      registrationNumber: "AUD-GOV-001",
      trustTier: "T4",
      status: "ACTIVE",
    },
  });
  console.log("  Created organization:", auditOrg.name);

  // ── Users ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  const managerHash = await bcrypt.hash("manager123", 12);
  const contractorHash = await bcrypt.hash("contractor123", 12);
  const auditorHash = await bcrypt.hash("auditor123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ifundos.sa" },
    update: {},
    create: {
      email: "admin@ifundos.sa",
      name: "System Administrator",
      passwordHash,
      role: "ADMIN",
      organizationId: sefOrg.id,
      clearanceLevel: 5,
      status: "ACTIVE",
    },
  });
  console.log("  Created user:", admin.email, "(ADMIN)");

  const manager = await prisma.user.upsert({
    where: { email: "manager@ifundos.sa" },
    update: {},
    create: {
      email: "manager@ifundos.sa",
      name: "Fatimah Al-Rashidi",
      passwordHash: managerHash,
      role: "FUND_MANAGER",
      organizationId: sefOrg.id,
      clearanceLevel: 4,
      status: "ACTIVE",
    },
  });
  console.log("  Created user:", manager.email, "(FUND_MANAGER)");

  const contractor = await prisma.user.upsert({
    where: { email: "contractor@tabuk-green.sa" },
    update: {},
    create: {
      email: "contractor@tabuk-green.sa",
      name: "Omar Al-Harithi",
      passwordHash: contractorHash,
      role: "CONTRACTOR",
      organizationId: tabukOrg.id,
      clearanceLevel: 1,
      status: "ACTIVE",
    },
  });
  console.log("  Created user:", contractor.email, "(CONTRACTOR)");

  const auditor = await prisma.user.upsert({
    where: { email: "auditor@ifundos.sa" },
    update: {},
    create: {
      email: "auditor@ifundos.sa",
      name: "Ibrahim Al-Dosari",
      passwordHash: auditorHash,
      role: "AUDITOR",
      organizationId: auditOrg.id,
      clearanceLevel: 4,
      status: "ACTIVE",
    },
  });
  console.log("  Created user:", auditor.email, "(AUDITOR)");

  // ── Program ────────────────────────────────────────────────
  const program = await prisma.program.create({
    data: {
      name: "Desert Greening Initiative",
      description:
        "A flagship program under the Saudi Green Initiative to combat desertification through native tree planting, ecosystem restoration, and sustainable land management across key provinces. Target: 10 million trees by 2030.",
      budgetTotal: 500_000_000, // 500M SAR
      budgetAllocated: 0,
      budgetDisbursed: 0,
      sgiTargets: JSON.stringify({
        treePlantingTarget: 10_000_000,
        provinces: ["Tabuk", "Al Jouf", "Hail", "Northern Borders"],
        carbonOffsetGoalTons: 2_500_000,
        biodiversityTargets: [
          "Restore 15% native shrubland",
          "Establish 3 wildlife corridors",
        ],
        alignedVision2030Goals: ["Environmental Sustainability", "Quality of Life"],
      }),
      status: "ACTIVE",
    },
  });
  console.log("\n  Created program:", program.name);

  // ── RFP ────────────────────────────────────────────────────
  const rfp = await prisma.rFP.create({
    data: {
      programId: program.id,
      title: "Native Tree Planting — Tabuk Province",
      description:
        "Request for Proposals for large-scale native tree planting in Tabuk Province. Contractors must demonstrate capability to plant and maintain a minimum of 500,000 native trees (Acacia, Ghaf, Sidr) over a 3-year period with survival rate commitments.",
      eligibilityCriteria: JSON.stringify({
        minimumCapitalization: 10_000_000,
        requiredCertifications: [
          "ISO 14001 Environmental Management",
          "Saudi Contractor Classification (Grade 2+)",
        ],
        minimumExperience: "5 years in reforestation or landscaping",
        geographicPresence: "Must have operational base in Tabuk or Northern Region",
        insuranceRequirement: "Professional liability insurance min 5M SAR",
      }),
      scoringRubric: JSON.stringify({
        dimensions: [
          {
            name: "Technical Capability",
            weight: 0.30,
            criteria: [
              "Proven reforestation track record",
              "Native species expertise",
              "Irrigation technology",
              "Survival rate methodology",
            ],
          },
          {
            name: "Financial Viability",
            weight: 0.20,
            criteria: [
              "Capitalization adequacy",
              "Cash flow projections",
              "Cost breakdown realism",
              "Financial audit history",
            ],
          },
          {
            name: "SGI Alignment",
            weight: 0.25,
            criteria: [
              "Carbon offset methodology",
              "Biodiversity impact plan",
              "Community engagement",
              "Vision 2030 contribution",
            ],
          },
          {
            name: "Risk Profile",
            weight: 0.15,
            criteria: [
              "Project timeline feasibility",
              "Supply chain reliability",
              "Climate adaptation plan",
              "Contingency provisions",
            ],
          },
          {
            name: "Innovation & Sustainability",
            weight: 0.10,
            criteria: [
              "Technology use (drone monitoring, IoT sensors)",
              "Water efficiency measures",
              "Knowledge transfer plan",
              "Long-term maintenance strategy",
            ],
          },
        ],
        passingScore: 65,
        maxScore: 100,
      }),
      evidenceRequirements: JSON.stringify([
        "Quarterly drone survey imagery (minimum 4K resolution)",
        "Monthly ground-level photo documentation per planting zone",
        "IoT soil moisture sensor data (continuous)",
        "Independent arborist survival rate audit (bi-annual)",
        "Financial expenditure reports with receipts",
        "Community engagement activity logs",
      ]),
      deadline: new Date("2026-06-30T23:59:59Z"),
      status: "OPEN",
    },
  });
  console.log("  Created RFP:", rfp.title);

  console.log("\n✓ Seed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Admin:      admin@ifundos.sa / admin123");
  console.log("  Manager:    manager@ifundos.sa / manager123");
  console.log("  Contractor: contractor@tabuk-green.sa / contractor123");
  console.log("  Auditor:    auditor@ifundos.sa / auditor123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
