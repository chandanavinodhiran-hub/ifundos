import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * iFundOS Seed Script
 * Populates the database with initial users, organizations, programs, RFPs,
 * questionnaire questions, and sample data for the full pipeline demo.
 */
async function main() {
  console.log("Seeding iFundOS database...\n");

  // ── Organizations ──────────────────────────────────────────
  const sefOrg = await prisma.organization.upsert({
    where: { registrationNumber: "SEF-001" },
    update: {
      businessCategories: JSON.stringify(["Environmental", "Government"]),
      certifications: JSON.stringify(["ISO 14001", "Saudi Government Entity"]),
    },
    create: {
      name: "Saudi Environmental Fund",
      type: "FUND",
      registrationNumber: "SEF-001",
      capitalization: 10_000_000_000,
      trustTier: "T4",
      status: "ACTIVE",
      preQualificationScore: 100,
      businessCategories: JSON.stringify(["Environmental", "Government"]),
      certifications: JSON.stringify(["ISO 14001", "Saudi Government Entity"]),
    },
  });
  console.log("  Created organization:", sefOrg.name);

  const tabukOrg = await prisma.organization.upsert({
    where: { registrationNumber: "TGS-2024-0471" },
    update: {
      businessCategories: JSON.stringify(["Environmental", "Agriculture", "Construction"]),
      certifications: JSON.stringify(["ISO 14001 Environmental Management", "Saudi Contractor Classification (Grade 2+)", "OSHA Safety Certified"]),
    },
    create: {
      name: "Tabuk Green Solutions",
      type: "CONTRACTOR",
      registrationNumber: "TGS-2024-0471",
      capitalization: 25_000_000,
      trustTier: "T1",
      status: "ACTIVE",
      preQualificationScore: 72.5,
      businessCategories: JSON.stringify(["Environmental", "Agriculture", "Construction"]),
      certifications: JSON.stringify(["ISO 14001 Environmental Management", "Saudi Contractor Classification (Grade 2+)", "OSHA Safety Certified"]),
    },
  });
  console.log("  Created organization:", tabukOrg.name);

  // Second contractor org for demo comparison
  const riyadhOrg = await prisma.organization.upsert({
    where: { registrationNumber: "RGP-2023-1122" },
    update: {
      businessCategories: JSON.stringify(["Environmental", "Water Management", "Renewable Energy"]),
      certifications: JSON.stringify(["ISO 14001 Environmental Management", "Saudi Contractor Classification (Grade 3)", "Water Management Specialist"]),
    },
    create: {
      name: "Riyadh GreenPlanet Co.",
      type: "CONTRACTOR",
      registrationNumber: "RGP-2023-1122",
      capitalization: 45_000_000,
      trustTier: "T2",
      status: "ACTIVE",
      preQualificationScore: 81.3,
      businessCategories: JSON.stringify(["Environmental", "Water Management", "Renewable Energy"]),
      certifications: JSON.stringify(["ISO 14001 Environmental Management", "Saudi Contractor Classification (Grade 3)", "Water Management Specialist"]),
    },
  });
  console.log("  Created organization:", riyadhOrg.name);

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
  const contractor2Hash = await bcrypt.hash("contractor123", 12);
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

  const contractor2 = await prisma.user.upsert({
    where: { email: "contractor2@greenplanet.sa" },
    update: {},
    create: {
      email: "contractor2@greenplanet.sa",
      name: "Layla Al-Mutairi",
      passwordHash: contractor2Hash,
      role: "CONTRACTOR",
      organizationId: riyadhOrg.id,
      clearanceLevel: 1,
      status: "ACTIVE",
    },
  });
  console.log("  Created user:", contractor2.email, "(CONTRACTOR)");

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
  // Check if program already exists
  const existingPrograms = await prisma.program.findMany({ where: { name: "Desert Greening Initiative" } });
  let program;
  if (existingPrograms.length > 0) {
    program = existingPrograms[0];
    console.log("\n  Program already exists:", program.name);
  } else {
    program = await prisma.program.create({
      data: {
        name: "Desert Greening Initiative",
        description:
          "A flagship program under the Saudi Green Initiative to combat desertification through native tree planting, ecosystem restoration, and sustainable land management across key provinces. Target: 10 million trees by 2030.",
        budgetTotal: 500_000_000,
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
  }

  // ── RFP with Questionnaire Questions ───────────────────────
  // Check if RFP already exists
  const existingRfps = await prisma.rFP.findMany({ where: { title: "Native Tree Planting — Tabuk Province" } });
  let rfp;
  if (existingRfps.length > 0) {
    rfp = existingRfps[0];
    // Update it with new fields
    rfp = await prisma.rFP.update({
      where: { id: rfp.id },
      data: {
        eligibilityCriteria: JSON.stringify({
          minimumCapitalization: 10_000_000,
          requiredCategories: ["Environmental"],
          minimumTrustTier: "T1",
          requiredCertifications: [
            "ISO 14001 Environmental Management",
            "Saudi Contractor Classification (Grade 2+)",
          ],
          geographicRestrictions: "Must have operational base in Tabuk or Northern Region",
        }),
        scoringRubric: JSON.stringify({
          dimensions: [
            { name: "Procurement Integrity", weight: 25, criteria: "Financial health, team capacity, fraud indicators" },
            { name: "Vision Alignment", weight: 25, criteria: "SGI goal alignment, sustainability approach" },
            { name: "Scientific Viability", weight: 25, criteria: "Species selection, survival methodology, irrigation plan" },
            { name: "Impact Potential", weight: 25, criteria: "Scale, carbon offset, biodiversity impact" },
          ],
          passingScore: 65,
          maxScore: 100,
        }),
        evidenceRequirements: JSON.stringify([
          "Site photos",
          "Drone surveys",
          "Soil analysis reports",
          "Species survival data",
          "Water budget analysis",
          "Environmental impact assessment",
          "Team CVs",
          "Financial statements",
          "Past project references",
        ]),
        createdById: manager.id,
      },
    });
    console.log("  Updated RFP:", rfp.title);
  } else {
    rfp = await prisma.rFP.create({
      data: {
        programId: program.id,
        title: "Native Tree Planting — Tabuk Province",
        description:
          "Request for Proposals for large-scale native tree planting in Tabuk Province as part of the Desert Greening Initiative. The selected contractor will be responsible for planting 500,000 native trees across designated sites, implementing irrigation systems, and maintaining plantings for 36 months post-planting. The project aims to combat desertification, restore native ecosystems, and contribute to the Saudi Green Initiative's goal of planting 10 billion trees.",
        eligibilityCriteria: JSON.stringify({
          minimumCapitalization: 10_000_000,
          requiredCategories: ["Environmental"],
          minimumTrustTier: "T1",
          requiredCertifications: [
            "ISO 14001 Environmental Management",
            "Saudi Contractor Classification (Grade 2+)",
          ],
          geographicRestrictions: "Must have operational base in Tabuk or Northern Region",
        }),
        scoringRubric: JSON.stringify({
          dimensions: [
            { name: "Procurement Integrity", weight: 25, criteria: "Financial health, team capacity, fraud indicators" },
            { name: "Vision Alignment", weight: 25, criteria: "SGI goal alignment, sustainability approach" },
            { name: "Scientific Viability", weight: 25, criteria: "Species selection, survival methodology, irrigation plan" },
            { name: "Impact Potential", weight: 25, criteria: "Scale, carbon offset, biodiversity impact" },
          ],
          passingScore: 65,
          maxScore: 100,
        }),
        evidenceRequirements: JSON.stringify([
          "Site photos",
          "Drone surveys",
          "Soil analysis reports",
          "Species survival data",
          "Water budget analysis",
          "Environmental impact assessment",
          "Team CVs",
          "Financial statements",
          "Past project references",
        ]),
        deadline: new Date("2026-06-30T23:59:59Z"),
        status: "OPEN",
        createdById: manager.id,
      },
    });
    console.log("  Created RFP:", rfp.title);
  }

  // ── Questionnaire Questions ────────────────────────────────
  const existingQuestions = await prisma.questionnaireQuestion.findMany({ where: { rfpId: rfp.id } });
  if (existingQuestions.length === 0) {
    const questions = [
      {
        rfpId: rfp.id,
        questionText: "Describe your team's experience with native tree planting in arid environments.",
        questionType: "LONG_ANSWER",
        isRequired: true,
        sortOrder: 1,
      },
      {
        rfpId: rfp.id,
        questionText: "What irrigation methodology will you use and why?",
        questionType: "LONG_ANSWER",
        isRequired: true,
        sortOrder: 2,
      },
      {
        rfpId: rfp.id,
        questionText: "Provide references from 3 previous environmental projects.",
        questionType: "FILE_UPLOAD",
        isRequired: true,
        sortOrder: 3,
      },
      {
        rfpId: rfp.id,
        questionText: "What is your proposed timeline for achieving 80% survival rate at 12 months?",
        questionType: "SHORT_ANSWER",
        isRequired: true,
        sortOrder: 4,
      },
      {
        rfpId: rfp.id,
        questionText: "Describe your approach to post-planting maintenance for the first 36 months.",
        questionType: "LONG_ANSWER",
        isRequired: true,
        sortOrder: 5,
      },
    ];

    for (const q of questions) {
      await prisma.questionnaireQuestion.create({ data: q });
    }
    console.log("  Created", questions.length, "questionnaire questions");
  } else {
    console.log("  Questionnaire questions already exist:", existingQuestions.length);
  }

  // ── Audit Genesis Event ────────────────────────────────────
  const auditCount = await prisma.auditEvent.count();
  if (auditCount === 0) {
    await prisma.auditEvent.create({
      data: {
        action: "SYSTEM_INITIALIZED",
        resourceType: "SYSTEM",
        purpose: "iFundOS system initialization and seed data creation",
        details: JSON.stringify({ version: "1.0.0", seedDate: new Date().toISOString() }),
        hashPrev: null,
        hashCurr: "GENESIS_HASH",
      },
    });
    console.log("  Created genesis audit event");
  }

  console.log("\n Seed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Admin:       admin@ifundos.sa / admin123");
  console.log("  Manager:     manager@ifundos.sa / manager123");
  console.log("  Contractor:  contractor@tabuk-green.sa / contractor123");
  console.log("  Contractor2: contractor2@greenplanet.sa / contractor123");
  console.log("  Auditor:     auditor@ifundos.sa / auditor123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
