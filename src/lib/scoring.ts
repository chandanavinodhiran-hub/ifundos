import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

/**
 * iFundOS AI Scoring Engine
 *
 * Evaluates contractor applications across four dimensions:
 *   1. Procurement Compliance (25%)
 *   2. Vision & Approach (25%)
 *   3. Viability & Capacity (25%)
 *   4. Environmental Impact (25%)
 *
 * Supports both real (Claude API) and mock modes for development.
 */

export const isMockMode =
  !process.env.ANTHROPIC_API_KEY ||
  process.env.ANTHROPIC_API_KEY === "placeholder";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DimensionScore {
  score: number;
  confidence: number;
}

interface Finding {
  dimension: string;
  type: "POSITIVE" | "RED_FLAG" | "CONCERN" | "NEUTRAL";
  text: string;
}

interface ScoringResult {
  procurement: DimensionScore;
  vision: DimensionScore;
  viability: DimensionScore;
  impact: DimensionScore;
  findings: Finding[];
  compositeScore: number;
}

interface DecisionPacketData {
  recommendation: "RECOMMEND" | "RECOMMEND_WITH_CONDITIONS" | "DO_NOT_RECOMMEND";
  executiveSummary: string;
  strengths: string[];
  risks: string[];
  questionsForContractor: string[];
  impactAssessment: string;
  narrative: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function computeComposite(scores: {
  procurement: DimensionScore;
  vision: DimensionScore;
  viability: DimensionScore;
  impact: DimensionScore;
}): number {
  const w = 0.25;
  return Math.round(
    (scores.procurement.score * w +
      scores.vision.score * w +
      scores.viability.score * w +
      scores.impact.score * w) *
      100
  ) / 100;
}

// ---------------------------------------------------------------------------
// Mock scoring
// ---------------------------------------------------------------------------

function generateMockScoring(): ScoringResult {
  const procurement: DimensionScore = {
    score: randomInt(55, 92),
    confidence: randomInt(70, 95) / 100,
  };
  const vision: DimensionScore = {
    score: randomInt(60, 95),
    confidence: randomInt(72, 96) / 100,
  };
  const viability: DimensionScore = {
    score: randomInt(50, 88),
    confidence: randomInt(65, 93) / 100,
  };
  const impact: DimensionScore = {
    score: randomInt(58, 90),
    confidence: randomInt(68, 94) / 100,
  };

  const positiveFindings: Finding[] = [
    { dimension: "procurement", type: "POSITIVE", text: "Complete documentation package submitted with all required certifications" },
    { dimension: "vision", type: "POSITIVE", text: "Innovative approach to native species selection aligned with SGI targets" },
    { dimension: "viability", type: "POSITIVE", text: "Strong track record with 3+ completed reforestation projects" },
    { dimension: "impact", type: "POSITIVE", text: "Projected carbon sequestration exceeds minimum targets by 40%" },
    { dimension: "procurement", type: "POSITIVE", text: "Competitive pricing within 5% of benchmark estimates" },
    { dimension: "viability", type: "POSITIVE", text: "Experienced project management team with relevant certifications" },
    { dimension: "impact", type: "POSITIVE", text: "Community engagement plan includes local employment targets" },
  ];

  const negativeFindings: Finding[] = [
    { dimension: "procurement", type: "RED_FLAG", text: "Missing environmental impact assessment for proposed site" },
    { dimension: "vision", type: "CONCERN", text: "Timeline appears optimistic for the proposed planting density" },
    { dimension: "viability", type: "RED_FLAG", text: "Financial statements show declining revenue over past 2 years" },
    { dimension: "impact", type: "CONCERN", text: "No mention of drought mitigation strategy for arid regions" },
    { dimension: "procurement", type: "CONCERN", text: "Subcontractor qualifications not fully documented" },
    { dimension: "viability", type: "CONCERN", text: "Limited equipment inventory for the proposed scale of operations" },
  ];

  const findingCount = randomInt(2, 4);
  const findings: Finding[] = [];
  for (let i = 0; i < findingCount; i++) {
    findings.push(pickRandom(positiveFindings));
  }
  for (let i = 0; i < randomInt(1, 3); i++) {
    findings.push(pickRandom(negativeFindings));
  }

  const compositeScore = computeComposite({ procurement, vision, viability, impact });

  return { procurement, vision, viability, impact, findings, compositeScore };
}

function generateMockDecisionPacket(
  orgName: string,
  compositeScore: number
): DecisionPacketData {
  const rec: DecisionPacketData["recommendation"] =
    compositeScore >= 75
      ? "RECOMMEND"
      : compositeScore >= 55
        ? "RECOMMEND_WITH_CONDITIONS"
        : "DO_NOT_RECOMMEND";

  return {
    recommendation: rec,
    executiveSummary: `${orgName} submitted a proposal scoring ${compositeScore}/100 overall. The application demonstrates ${compositeScore >= 70 ? "strong" : "moderate"} alignment with program objectives and ${compositeScore >= 65 ? "adequate" : "limited"} organizational capacity for delivery.`,
    strengths: [
      "Demonstrated experience in similar reforestation projects",
      "Clear understanding of Saudi Green Initiative alignment requirements",
      "Competitive budget proposal with detailed cost breakdowns",
    ],
    risks: [
      "Timeline may be aggressive for the proposed scale of operations",
      "Limited contingency planning for weather-related delays",
      compositeScore < 70
        ? "Below-average viability score suggests capacity concerns"
        : "Dependency on international supply chain for seedling procurement",
    ],
    questionsForContractor: [
      "Can you provide additional references from projects of similar scale?",
      "What is your contingency plan if seedling survival rates fall below 70%?",
      "Please clarify the subcontracting arrangement for site preparation works.",
    ],
    impactAssessment: `Projected environmental impact includes planting of native species across the designated area with an estimated ${randomInt(60, 95)}% survival rate at 12 months. Carbon sequestration projections align with SGI Phase ${randomInt(1, 3)} targets.`,
    narrative: `AI analysis of ${orgName}'s proposal across procurement compliance, strategic vision, organizational viability, and environmental impact dimensions. Overall assessment: ${rec.replace(/_/g, " ").toLowerCase()}.`,
  };
}

// ---------------------------------------------------------------------------
// Real scoring (Claude API)
// ---------------------------------------------------------------------------

async function scoreWithClaude(
  proposalData: Record<string, unknown>,
  rfpTitle: string,
  orgName: string,
  eligibilityCriteria: string | null,
  scoringRubric: string | null
): Promise<{ scoring: ScoringResult; decisionPacket: DecisionPacketData }> {
  const client = new Anthropic();
  const model = "claude-sonnet-4-20250514";

  const contextBlock = `
RFP Title: ${rfpTitle}
Organization: ${orgName}
Eligibility Criteria: ${eligibilityCriteria || "Not specified"}
Scoring Rubric: ${scoringRubric || "Standard 4-dimension rubric"}
Proposal Data: ${JSON.stringify(proposalData, null, 2)}
  `.trim();

  // Call 1: Procurement compliance scoring
  const procurementResponse = await client.messages.create({
    model,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are an expert procurement evaluator for the Saudi Green Initiative fund.

Evaluate this contractor proposal for PROCUREMENT COMPLIANCE. Score 0-100.

${contextBlock}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "procurement": { "score": <number 0-100>, "confidence": <number 0.0-1.0> },
  "findings": [
    { "dimension": "procurement", "type": "<POSITIVE|RED_FLAG|CONCERN>", "text": "<finding>" }
  ]
}`,
      },
    ],
  });

  // Call 2: Vision, viability, and impact scoring
  const dimensionsResponse = await client.messages.create({
    model,
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are an expert evaluator for the Saudi Green Initiative fund.

Evaluate this contractor proposal across THREE dimensions. Score each 0-100.
1. VISION & APPROACH — strategic alignment, innovation, methodology
2. VIABILITY & CAPACITY — financial health, team experience, equipment
3. ENVIRONMENTAL IMPACT — carbon sequestration, biodiversity, sustainability

${contextBlock}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "vision": { "score": <number 0-100>, "confidence": <number 0.0-1.0> },
  "viability": { "score": <number 0-100>, "confidence": <number 0.0-1.0> },
  "impact": { "score": <number 0-100>, "confidence": <number 0.0-1.0> },
  "findings": [
    { "dimension": "<vision|viability|impact>", "type": "<POSITIVE|RED_FLAG|CONCERN>", "text": "<finding>" }
  ]
}`,
      },
    ],
  });

  // Call 3: Decision packet generation
  const decisionResponse = await client.messages.create({
    model,
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are a senior fund analyst preparing a decision packet for the Saudi Green Initiative committee.

Based on this proposal, generate a comprehensive decision packet.

${contextBlock}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "recommendation": "<RECOMMEND|RECOMMEND_WITH_CONDITIONS|DO_NOT_RECOMMEND>",
  "executiveSummary": "<2-3 sentence summary>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "risks": ["<risk1>", "<risk2>", "<risk3>"],
  "questionsForContractor": ["<question1>", "<question2>"],
  "impactAssessment": "<paragraph about environmental impact>",
  "narrative": "<overall assessment narrative>"
}`,
      },
    ],
  });

  // Parse responses
  const procText =
    procurementResponse.content[0].type === "text"
      ? procurementResponse.content[0].text
      : "";
  const dimText =
    dimensionsResponse.content[0].type === "text"
      ? dimensionsResponse.content[0].text
      : "";
  const decText =
    decisionResponse.content[0].type === "text"
      ? decisionResponse.content[0].text
      : "";

  const procData = JSON.parse(procText);
  const dimData = JSON.parse(dimText);
  const decData = JSON.parse(decText);

  const procurement: DimensionScore = procData.procurement;
  const vision: DimensionScore = dimData.vision;
  const viability: DimensionScore = dimData.viability;
  const impact: DimensionScore = dimData.impact;

  const findings: Finding[] = [
    ...(procData.findings || []),
    ...(dimData.findings || []),
  ];

  const compositeScore = computeComposite({ procurement, vision, viability, impact });

  return {
    scoring: { procurement, vision, viability, impact, findings, compositeScore },
    decisionPacket: decData as DecisionPacketData,
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function scoreApplication(
  applicationId: string,
  actorId: string
): Promise<void> {
  // 1. Fetch application with related data
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      rfp: true,
      organization: true,
      decisionPacket: true,
    },
  });

  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
  }

  // 2. Parse proposal data
  let proposalData: Record<string, unknown> = {};
  if (application.proposalData) {
    try {
      proposalData = JSON.parse(application.proposalData);
    } catch {
      proposalData = { raw: application.proposalData };
    }
  }

  let scoring: ScoringResult;
  let decisionPacketData: DecisionPacketData;

  if (isMockMode) {
    // 3. Mock mode
    scoring = generateMockScoring();
    decisionPacketData = generateMockDecisionPacket(
      application.organization.name,
      scoring.compositeScore
    );
  } else {
    // 4. Real mode — Claude API calls
    const result = await scoreWithClaude(
      proposalData,
      application.rfp.title,
      application.organization.name,
      application.rfp.eligibilityCriteria,
      application.rfp.scoringRubric
    );
    scoring = result.scoring;
    decisionPacketData = result.decisionPacket;
  }

  // 5. Save scores to application
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      compositeScore: scoring.compositeScore,
      dimensionScores: JSON.stringify({
        procurement: scoring.procurement.score,
        vision: scoring.vision.score,
        viability: scoring.viability.score,
        impact: scoring.impact.score,
      }),
      confidenceLevels: JSON.stringify({
        procurement: scoring.procurement.confidence,
        vision: scoring.vision.confidence,
        viability: scoring.viability.confidence,
        impact: scoring.impact.confidence,
      }),
      aiFindings: JSON.stringify(scoring.findings),
      status: "IN_REVIEW",
    },
  });

  // 6. Create or update DecisionPacket
  if (application.decisionPacket) {
    await prisma.decisionPacket.update({
      where: { id: application.decisionPacket.id },
      data: {
        recommendation: decisionPacketData.recommendation,
        executiveSummary: decisionPacketData.executiveSummary,
        strengths: JSON.stringify(decisionPacketData.strengths),
        risks: JSON.stringify(decisionPacketData.risks),
        questionsForContractor: JSON.stringify(decisionPacketData.questionsForContractor),
        impactAssessment: decisionPacketData.impactAssessment,
        narrative: decisionPacketData.narrative,
        scoringEvidence: JSON.stringify(scoring),
        createdByModel: isMockMode ? "mock" : "claude-sonnet-4-20250514",
      },
    });
  } else {
    await prisma.decisionPacket.create({
      data: {
        applicationId,
        recommendation: decisionPacketData.recommendation,
        executiveSummary: decisionPacketData.executiveSummary,
        strengths: JSON.stringify(decisionPacketData.strengths),
        risks: JSON.stringify(decisionPacketData.risks),
        questionsForContractor: JSON.stringify(decisionPacketData.questionsForContractor),
        impactAssessment: decisionPacketData.impactAssessment,
        narrative: decisionPacketData.narrative,
        scoringEvidence: JSON.stringify(scoring),
        createdByModel: isMockMode ? "mock" : "claude-sonnet-4-20250514",
      },
    });
  }

  // 7. Audit event
  await logAuditEvent({
    actorId,
    action: "AI_SCORING_COMPLETED",
    resourceType: "APPLICATION",
    resourceId: applicationId,
    purpose: "AI scoring completed for application",
    details: {
      compositeScore: scoring.compositeScore,
      recommendation: decisionPacketData.recommendation,
      mode: isMockMode ? "mock" : "live",
    },
  });
}
