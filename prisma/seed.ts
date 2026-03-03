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
      name: "Saudi Environment Fund",
      businessCategories: JSON.stringify(["Environmental", "Government"]),
      certifications: JSON.stringify(["ISO 14001", "Saudi Government Entity"]),
    },
    create: {
      name: "Saudi Environment Fund",
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

  const redSeaOrg = await prisma.organization.upsert({
    where: { registrationNumber: "RSE-2024-0892" },
    update: {},
    create: {
      name: "Red Sea Environmental Corp",
      type: "CONTRACTOR",
      registrationNumber: "RSE-2024-0892",
      capitalization: 12_000_000,
      trustTier: "SUSPENDED",
      status: "SUSPENDED",
      preQualificationScore: 41.2,
      businessCategories: JSON.stringify(["Environmental", "Marine Conservation"]),
      certifications: JSON.stringify(["ISO 14001 Environmental Management"]),
    },
  });
  console.log("  Created organization:", redSeaOrg.name);

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

  const suspendedHash = await bcrypt.hash("contractor123", 12);
  const suspendedUser = await prisma.user.upsert({
    where: { email: "khalid@redsea-env.sa" },
    update: {},
    create: {
      email: "khalid@redsea-env.sa",
      name: "Khalid Al-Faris",
      passwordHash: suspendedHash,
      role: "CONTRACTOR",
      organizationId: redSeaOrg.id,
      clearanceLevel: 1,
      status: "SUSPENDED",
    },
  });
  console.log("  Created user:", suspendedUser.email, "(CONTRACTOR - SUSPENDED)");

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

  // ── Pipeline Demo Applications ─────────────────────────────
  // Create contractor organizations for each demo application
  console.log("\n  Seeding pipeline demo organizations & applications...");

  const pipelineOrgs = [
    { name: "Najran Solar Irrigation Program",  reg: "NSIP-2025-0001", cap: 30_000_000, tier: "T2" },
    { name: "Eastern Province Wetland Revival",  reg: "EPWR-2025-0002", cap: 18_000_000, tier: "T1" },
    { name: "Al-Madinah Solar Grid",             reg: "AMSG-2025-0003", cap: 40_000_000, tier: "T2" },
    { name: "Dammam Reforestation Initiative",   reg: "DRI-2025-0004",  cap: 22_000_000, tier: "T1" },
    { name: "Hail Desert Farming Collective",    reg: "HDFC-2025-0005", cap: 15_000_000, tier: "T1" },
    { name: "NEOM Water Recovery Systems",       reg: "NWRS-2025-0006", cap: 60_000_000, tier: "T3" },
    { name: "Yanbu Coral Restoration Fund",      reg: "YCRF-2025-0007", cap: 28_000_000, tier: "T2" },
    { name: "Abha Cloud Seeding Project",        reg: "ACSP-2025-0008", cap: 16_000_000, tier: "T1" },
    { name: "Jeddah Sustainable Works",          reg: "JSW-2025-0009",  cap: 55_000_000, tier: "T3" },
    { name: "Jubail Mangrove Project",           reg: "JMP-2025-0010",  cap: 35_000_000, tier: "T2" },
    { name: "Asir Biodiversity Conservation",    reg: "ABC-2025-0011",  cap: 45_000_000, tier: "T3" },
  ];

  const orgIds: Record<string, string> = {};
  // Reuse existing orgs for Tabuk Green Solutions and Riyadh Environmental Corp
  orgIds["Tabuk Green Solutions"] = tabukOrg.id;
  orgIds["Riyadh Environmental Corp"] = riyadhOrg.id;

  for (const o of pipelineOrgs) {
    const org = await prisma.organization.upsert({
      where: { registrationNumber: o.reg },
      update: {},
      create: {
        name: o.name,
        type: "CONTRACTOR",
        registrationNumber: o.reg,
        capitalization: o.cap,
        trustTier: o.tier,
        status: "ACTIVE",
        preQualificationScore: 50 + Math.random() * 40,
        businessCategories: JSON.stringify(["Environmental", "Sustainability"]),
        certifications: JSON.stringify(["ISO 14001 Environmental Management"]),
      },
    });
    orgIds[o.name] = org.id;
  }
  console.log("  Created/verified", pipelineOrgs.length, "pipeline organizations");

  // Define the 13 demo applications
  const demoApps: {
    orgName: string;
    budget: number;
    status: string;
    score: number | null;
    shortlisted: boolean;
  }[] = [
    // PUBLISHED stage (2) — new RFP just posted, these are placeholder entries
    { orgName: "Najran Solar Irrigation Program",  budget: 12_000_000, status: "PUBLISHED", score: null, shortlisted: false },
    { orgName: "Eastern Province Wetland Revival",  budget: 8_500_000,  status: "PUBLISHED", score: null, shortlisted: false },
    // APPLICATIONS stage (3) — submitted, awaiting AI scoring
    { orgName: "Al-Madinah Solar Grid",             budget: 15_000_000, status: "SUBMITTED", score: null, shortlisted: false },
    { orgName: "Dammam Reforestation Initiative",   budget: 9_200_000,  status: "SUBMITTED", score: null, shortlisted: false },
    { orgName: "Hail Desert Farming Collective",    budget: 6_800_000,  status: "SUBMITTED", score: null, shortlisted: false },
    // AI SCORED stage (3) — scored, awaiting review
    { orgName: "NEOM Water Recovery Systems",       budget: 22_000_000, status: "IN_REVIEW", score: 65,   shortlisted: false },
    { orgName: "Yanbu Coral Restoration Fund",      budget: 11_500_000, status: "IN_REVIEW", score: 79,   shortlisted: false },
    { orgName: "Abha Cloud Seeding Project",        budget: 7_000_000,  status: "REJECTED",  score: 44,   shortlisted: false },
    // SHORTLISTED stage (2) — passed AI scoring, shortlisted for interview
    { orgName: "Tabuk Green Solutions",             budget: 18_000_000, status: "SHORTLISTED", score: 87, shortlisted: true },
    { orgName: "Riyadh Environmental Corp",         budget: 14_000_000, status: "SHORTLISTED", score: 72, shortlisted: true },
    // INTERVIEW stage (2) — in final evaluation
    { orgName: "Jeddah Sustainable Works",          budget: 25_000_000, status: "INTERVIEW",   score: 91, shortlisted: true },
    { orgName: "Jubail Mangrove Project",           budget: 16_500_000, status: "INTERVIEW",   score: 88, shortlisted: true },
    // AWARDED stage (1) — grant awarded
    { orgName: "Asir Biodiversity Conservation",    budget: 20_000_000, status: "APPROVED",    score: 82, shortlisted: true },
  ];

  // Delete any existing demo applications to avoid duplicates on re-seed
  const existingDemoApps = await prisma.application.findMany({
    where: { rfpId: rfp.id },
    select: { id: true },
  });
  if (existingDemoApps.length > 0) {
    // Clean up related records first, then applications
    const appIds = existingDemoApps.map((a) => a.id);
    await prisma.questionnaireResponse.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.questionnaireEvaluation.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.review.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.decisionPacket.deleteMany({ where: { applicationId: { in: appIds } } });
    // Delete disbursements and milestones for contracts tied to these apps
    const contracts = await prisma.contract.findMany({ where: { applicationId: { in: appIds } }, select: { id: true } });
    if (contracts.length > 0) {
      const contractIds = contracts.map((c) => c.id);
      await prisma.disbursement.deleteMany({ where: { contractId: { in: contractIds } } });
      const milestones = await prisma.milestone.findMany({ where: { contractId: { in: contractIds } }, select: { id: true } });
      if (milestones.length > 0) {
        await prisma.evidenceRecord.deleteMany({ where: { milestoneId: { in: milestones.map((m) => m.id) } } });
      }
      await prisma.milestone.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.contract.deleteMany({ where: { id: { in: contractIds } } });
    }
    await prisma.application.deleteMany({ where: { id: { in: appIds } } });
    console.log("  Cleaned up", existingDemoApps.length, "existing applications for re-seed");
  }

  // Create each demo application
  const now = new Date();
  for (let i = 0; i < demoApps.length; i++) {
    const d = demoApps[i];
    const orgId = orgIds[d.orgName];
    if (!orgId) {
      console.error("  ❌ Missing org for:", d.orgName);
      continue;
    }

    // Stagger creation dates so they appear in a natural timeline
    const createdAt = new Date(now.getTime() - (demoApps.length - i) * 3 * 86_400_000);
    const submittedAt = d.status !== "PUBLISHED" ? new Date(createdAt.getTime() + 86_400_000) : null;
    const shortlistedAt = d.shortlisted ? new Date(createdAt.getTime() + 5 * 86_400_000) : null;

    await prisma.application.create({
      data: {
        rfpId: rfp.id,
        organizationId: orgId,
        proposedBudget: d.budget,
        status: d.status,
        compositeScore: d.score,
        dimensionScores: d.score
          ? JSON.stringify({
              procurement: Math.round(d.score * (0.85 + Math.random() * 0.3)),
              vision: Math.round(d.score * (0.85 + Math.random() * 0.3)),
              viability: Math.round(d.score * (0.85 + Math.random() * 0.3)),
              impact: Math.round(d.score * (0.85 + Math.random() * 0.3)),
            })
          : null,
        submittedAt,
        shortlistedAt,
        createdAt,
        updatedAt: now,
      },
    });
  }
  console.log("  Created", demoApps.length, "pipeline demo applications");

  // Create a Contract for the APPROVED application (Asir Biodiversity Conservation)
  const approvedApp = await prisma.application.findFirst({
    where: { rfpId: rfp.id, status: "APPROVED" },
    select: { id: true, organizationId: true, proposedBudget: true },
  });
  if (approvedApp) {
    const existingContract = await prisma.contract.findUnique({ where: { applicationId: approvedApp.id } });
    if (!existingContract) {
      await prisma.contract.create({
        data: {
          applicationId: approvedApp.id,
          programId: program.id,
          organizationId: approvedApp.organizationId,
          awardAmount: approvedApp.proposedBudget,
          justification: "Strong environmental impact proposal with proven track record in biodiversity conservation.",
          status: "ACTIVE",
        },
      });
      console.log("  Created contract for awarded application");
    }
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
  console.log("  Suspended:   khalid@redsea-env.sa / contractor123 (SUSPENDED)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
