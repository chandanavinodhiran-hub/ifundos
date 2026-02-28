/**
 * Navigator — Pre-scripted demo responses
 *
 * Organized by role → page context → question patterns.
 * Falls back to generic responses when no match is found.
 */

export interface ScriptedResponse {
  patterns: string[];
  response: string;
}

export interface PageResponses {
  pagePattern: string;
  pageName: string;
  responses: ScriptedResponse[];
}

export interface RoleResponses {
  role: string;
  pages: PageResponses[];
}

// ─── Fund Manager Responses ───────────────────────────────────────────
const fundManagerResponses: PageResponses[] = [
  {
    pagePattern: "/dashboard/applications",
    pageName: "AI Review Pipeline",
    responses: [
      {
        patterns: ["status", "pipeline", "applications", "how many", "overview", "summary"],
        response:
          "You currently have applications in various stages of the AI screening pipeline. Each application goes through a 5-dimension analysis: Document Completeness, Procurement Compliance, Vision Alignment, Financial Viability, and Environmental Impact. Applications scoring above 70 are recommended for shortlisting, 50–69 require conditional review, and below 50 are flagged for rejection. I'd recommend focusing on the shortlisted applications first — they represent your highest-impact opportunities.",
      },
      {
        patterns: ["score", "scoring", "composite", "ai score", "how does scoring work", "criteria"],
        response:
          "The AI Composite Score is a weighted average across five dimensions:\n\n• Document Completeness (15%) — checks for required permits, registrations, financial statements\n• Procurement Compliance (20%) — validates against Saudi procurement regulations and RFP requirements\n• Vision Alignment (25%) — measures alignment with Saudi Green Initiative goals\n• Financial Viability (20%) — analyzes budget reasonableness and financial health\n• Environmental Impact (20%) — evaluates projected environmental outcomes\n\nEach dimension is scored 0–100 by the AI engine, then combined into a single composite score with a recommendation: Recommend, Conditional, or Not Recommended.",
      },
      {
        patterns: ["shortlist", "approve", "next step", "what should i do", "recommend"],
        response:
          "For recommended applications (score ≥70), the next step is to send a due diligence questionnaire. You can do this directly from the application detail view. For conditional applications (50–69), I'd suggest reviewing the individual dimension scores — often a low score in one area (like missing documents) can be resolved quickly. Applications below 50 typically have fundamental issues that make them unsuitable for funding.",
      },
    ],
  },
  {
    pagePattern: "/dashboard/grants",
    pageName: "Active Grants",
    responses: [
      {
        patterns: ["grants", "status", "overview", "active", "progress"],
        response:
          "Your Active Grants page shows all awarded contracts and their milestone progress. Each grant tracks disbursement against verified milestones. The milestone evidence is reviewed by our AI Evidence Review system before payment approval. Green dots indicate completed milestones, amber means evidence is under review, and gray means upcoming milestones.",
      },
      {
        patterns: ["payment", "disbursement", "milestone", "release"],
        response:
          "Payments are released on a milestone-completion basis. When a contractor submits evidence for a milestone, it goes through AI verification first, then requires your approval. Once approved, the disbursement is queued for processing. You can track all payment statuses from the grant detail view.",
      },
    ],
  },
  {
    pagePattern: "/dashboard/evidence",
    pageName: "AI Evidence Review",
    responses: [
      {
        patterns: ["evidence", "review", "verify", "status"],
        response:
          "The AI Evidence Review system analyzes submitted milestone evidence using document verification and image analysis. Each submission receives a confidence score. Evidence with high confidence (≥80%) can be fast-tracked for approval, while lower scores require manual review. The system checks for document authenticity, milestone relevance, and compliance with grant terms.",
      },
    ],
  },
  {
    pagePattern: "/dashboard/impact",
    pageName: "Impact Dashboard",
    responses: [
      {
        patterns: ["impact", "environment", "trees", "carbon", "metrics"],
        response:
          "The Impact Dashboard aggregates environmental outcomes across all your funded projects. Key metrics include trees planted, CO₂ offset, land restored, and water conserved. These numbers are derived from verified milestone evidence — so they represent confirmed, not projected, impact. The completion rate shows overall portfolio progress toward environmental targets.",
      },
    ],
  },
  {
    pagePattern: "/dashboard",
    pageName: "Portfolio Overview",
    responses: [
      {
        patterns: ["overview", "dashboard", "summary", "status", "hello", "hi"],
        response:
          "Welcome to your Portfolio Overview. This is your command center for the Saudi Environmental Fund. From here you can see key metrics: total applications, AI-screened count, active grants, and total disbursements. The AI screening pipeline has processed your applications and flagged the most promising ones for review. Would you like me to explain any specific metric or guide you to a particular section?",
      },
      {
        patterns: ["help", "what can you do", "capabilities", "features"],
        response:
          "I can help you navigate the iFundOS platform and understand its features. Here's what I can assist with:\n\n• Application Pipeline — explain AI scores, scoring criteria, and next steps\n• Grant Management — track milestones, disbursements, and contractor performance\n• Evidence Review — understand AI verification results\n• Impact Metrics — interpret environmental outcome data\n• General Navigation — guide you to any section of the platform\n\nJust ask me anything about the page you're currently viewing.",
      },
    ],
  },
];

// ─── Contractor Responses ────────────────────────────────────────────
const contractorResponses: PageResponses[] = [
  {
    pagePattern: "/contractor",
    pageName: "Contractor Dashboard",
    responses: [
      {
        patterns: ["status", "application", "overview", "dashboard", "hello", "hi", "summary"],
        response:
          "Welcome to your Contractor Dashboard. Here you can see the status of all your applications, awarded contracts, and pending payments. Your applications go through an AI screening process that evaluates document completeness, procurement compliance, vision alignment, financial viability, and environmental impact. Check the 'My Applications' section for detailed status updates on each submission.",
      },
      {
        patterns: ["improve", "score", "better", "tips", "advice", "how to"],
        response:
          "To improve your application scores, focus on these key areas:\n\n1. Document Completeness — ensure all required permits, registrations, and financial statements are uploaded\n2. Vision Alignment — clearly articulate how your project supports the Saudi Green Initiative goals\n3. Budget Detail — provide detailed, realistic cost breakdowns with market-rate justifications\n4. Environmental Metrics — include specific, measurable environmental impact projections\n5. Track Record — highlight any previous successful environmental projects\n\nApplications with complete documentation typically score 15–20 points higher.",
      },
    ],
  },
  {
    pagePattern: "/contractor/rfps",
    pageName: "Browse RFPs",
    responses: [
      {
        patterns: ["rfp", "opportunity", "browse", "available", "apply"],
        response:
          "The RFP browser shows all active funding opportunities from the Saudi Environmental Fund. Each RFP includes the funding amount, deadline, required qualifications, and environmental focus area. You can filter by category to find opportunities that match your organization's capabilities. Click on any RFP to see the full requirements before submitting an application.",
      },
    ],
  },
  {
    pagePattern: "/contractor/applications",
    pageName: "My Applications",
    responses: [
      {
        patterns: ["application", "status", "track", "where", "progress"],
        response:
          "Your applications page shows the status of every submission. The stages are: Submitted → AI Screening → Under Review → Shortlisted → Questionnaire → Awarded (or Rejected). Each application shows its AI composite score once screening is complete. You can click on any application to see the detailed dimension-by-dimension breakdown.",
      },
    ],
  },
  {
    pagePattern: "/contractor/contracts",
    pageName: "Awarded Contracts",
    responses: [
      {
        patterns: ["contract", "awarded", "milestone", "deliverable"],
        response:
          "Your awarded contracts are listed here with milestone tracking. Each contract has defined deliverables and payment milestones. To receive payments, submit evidence for each completed milestone through the 'Submit Evidence' section. The evidence goes through AI verification before fund manager approval.",
      },
    ],
  },
];

// ─── Auditor Responses ────────────────────────────────────────────────
const auditorResponses: PageResponses[] = [
  {
    pagePattern: "/audit/decisions",
    pageName: "Decision Review",
    responses: [
      {
        patterns: ["decision", "concordance", "divergent", "aligned", "review"],
        response:
          "The Decision Review screen shows every fund manager decision alongside the AI recommendation. I track concordance — whether the human decision aligns with or diverges from the AI's analysis. Divergent decisions aren't necessarily wrong; they're where the fund manager exercised judgment that differed from the AI. Your role is to assess whether that judgment was reasonable given the available information.",
      },
      {
        patterns: ["flag", "flagged", "concern", "issue"],
        response:
          "You can flag any decision for further review. Flagging doesn't reverse a decision — it creates a record that you've identified something worth investigating. Common flag reasons include: decision divergence (FM disagreed with AI), timing concerns (unusually fast decisions), and pattern detection (multiple similar divergences). Each flag includes a reason and optional notes.",
      },
      {
        patterns: ["score", "scoring", "ai", "recommend"],
        response:
          "The AI scores each application across four dimensions and produces a composite score with a recommendation: Recommend (≥70), Conditional (50–69), or Not Recommended (<50). When expanding a decision card, you'll see the full AI Decision Brief — the same information the fund manager had when making their decision. This helps you assess whether the divergence was informed or overlooked.",
      },
    ],
  },
  {
    pagePattern: "/audit/programs",
    pageName: "Programs",
    responses: [
      {
        patterns: ["program", "budget", "overview", "health"],
        response:
          "The Programs page shows each funding program's budget allocation, disbursement progress, and health status. Health is determined by decision concordance — programs where all decisions align with AI are 'On track', while those with divergent decisions show 'Review recommended'. Tap a program to see per-RFP breakdowns and concordance rates.",
      },
    ],
  },
  {
    pagePattern: "/audit/disbursements",
    pageName: "Disbursements",
    responses: [
      {
        patterns: ["disbursement", "payment", "budget", "money", "milestone"],
        response:
          "The Disbursements page tracks how funds flow from allocation to actual payments. Each payment is linked to a verified milestone — the contractor submits evidence, the AI verifies it, and the fund manager approves the release. I can help you identify anomalies: unusually fast processing, evidence approved without AI verification, or amounts that don't match contracted milestone values.",
      },
    ],
  },
  {
    pagePattern: "/audit",
    pageName: "Home",
    responses: [
      {
        patterns: ["overview", "dashboard", "status", "hello", "hi", "summary"],
        response:
          "I can help you investigate patterns across decisions, disbursements, and program activity. Your home screen shows the anomaly status — if all fund manager decisions align with AI recommendations, you'll see a green 'all clear'. If any divergent decisions exist, they'll be highlighted for your attention. The activity stream below shows every platform action in real time.",
      },
      {
        patterns: ["anomaly", "divergent", "investigate", "pattern"],
        response:
          "I've analyzed the decision patterns. When a fund manager rejects an AI-recommended applicant or advances one the AI flagged as risky, that's a divergence worth investigating. Check the Decisions tab for the full concordance breakdown — each card shows the AI score, recommendation, and the fund manager's actual decision side by side.",
      },
      {
        patterns: ["concordance", "time", "average", "month"],
        response:
          "Decision concordance tracks how often the fund manager follows AI recommendations. A high concordance rate (90%+) suggests the AI is well-calibrated to the fund manager's judgment. Lower rates may indicate either the AI needs tuning or the fund manager has additional context the AI doesn't capture. Both are worth understanding.",
      },
      {
        patterns: ["contractor", "multiple", "award"],
        response:
          "I can check for contractors receiving multiple awards across different RFPs. This isn't inherently concerning — strong contractors may legitimately win multiple bids — but concentration of funding in a few organizations is worth monitoring from an oversight perspective.",
      },
    ],
  },
];

// ─── Admin Responses ─────────────────────────────────────────────────
const adminResponses: PageResponses[] = [
  {
    pagePattern: "/admin/users",
    pageName: "Users",
    responses: [
      {
        patterns: ["user", "manage", "role", "permission", "invite", "add", "suspend"],
        response:
          "The Users page lets you manage all platform accounts. Users are organized by role: Admin, Fund Manager, Contractor, and Auditor. You can invite new users with the + button, edit existing users by tapping their card, and suspend or remove accounts from the expanded detail view. All changes are logged in the audit trail.",
      },
      {
        patterns: ["filter", "search", "find"],
        response:
          "Use the search bar to find users by name or email. The role pills filter by role type, and the status pills filter by Active, Pending, or Suspended status. You can combine filters to narrow down the list.",
      },
    ],
  },
  {
    pagePattern: "/admin/programs",
    pageName: "Programs",
    responses: [
      {
        patterns: ["program", "budget", "create", "fund", "allocation"],
        response:
          "The Programs page shows all funding programs under the Saudi Green Initiative. Each card displays the budget allocation, number of RFPs, and active contracts. Tap a card to see the per-RFP breakdown. Use the + button to create a new program.",
      },
    ],
  },
  {
    pagePattern: "/admin/system",
    pageName: "System",
    responses: [
      {
        patterns: ["system", "health", "status", "ai", "engine", "service", "config"],
        response:
          "The System page monitors platform health. The AI Scoring Engine status shows whether scoring is operational, along with total applications scored and last scoring time. Below that, platform metrics show total users, active programs, audit events, and service health indicators.",
      },
    ],
  },
  {
    pagePattern: "/admin",
    pageName: "Home",
    responses: [
      {
        patterns: ["overview", "dashboard", "status", "hello", "hi", "summary", "health"],
        response:
          "Welcome to the Admin Home. You can see platform activity at a glance: pending user invitations, users active today, and any system issues. The AI Engine status card shows the scoring system's health, and the activity stream below tracks all user logins, account changes, and system events in real time.",
      },
      {
        patterns: ["help", "what can you do", "capabilities"],
        response:
          "I can help you manage users, check system status, and navigate platform settings. Ask me about user roles and access levels, program creation and budget allocation, system health and AI scoring status, or audit trail events.",
      },
    ],
  },
];

// ─── Generic Fallback Responses ───────────────────────────────────────
const genericResponses: ScriptedResponse[] = [
  {
    patterns: ["hello", "hi", "hey", "good morning", "good afternoon"],
    response:
      "Hello! I'm Navigator, the iFundOS AI advisor. I can help you understand the platform, explain features on the page you're viewing, and answer questions about the Saudi Environmental Fund operations. What would you like to know?",
  },
  {
    patterns: ["help", "what can you do", "capabilities", "how do you work"],
    response:
      "I'm Navigator — your AI advisor for the iFundOS platform. I can:\n\n• Explain what you're seeing on the current page\n• Describe how AI scoring and screening works\n• Guide you through platform features and workflows\n• Answer questions about the Saudi Environmental Fund\n\nI'm context-aware, so my answers adapt to the page you're currently viewing. Just ask!",
  },
  {
    patterns: ["ai", "artificial intelligence", "machine learning", "how does ai work"],
    response:
      "iFundOS uses AI across several key areas:\n\n1. Application Screening — evaluates proposals across 5 dimensions using natural language analysis\n2. Evidence Verification — validates milestone completion documentation\n3. Impact Analysis — tracks and projects environmental outcomes\n4. Anomaly Detection — flags unusual platform activity for auditor review\n\nAll AI decisions are logged in the tamper-evident audit trail for transparency and accountability.",
  },
  {
    patterns: ["saudi green initiative", "sgi", "environmental", "green"],
    response:
      "The Saudi Green Initiative is Saudi Arabia's ambitious national environmental program. iFundOS supports this initiative by managing the full lifecycle of environmental funding — from contractor applications through AI screening, grant management, milestone tracking, and impact measurement. Every project funded through this platform contributes to Saudi Arabia's environmental transformation goals.",
  },
  {
    patterns: ["thank", "thanks", "great", "awesome", "perfect"],
    response:
      "You're welcome! I'm here whenever you need guidance navigating the platform. Just click the Navigator button to reach me anytime.",
  },
];

// ─── All Role Data ────────────────────────────────────────────────────
const allRoleResponses: RoleResponses[] = [
  { role: "FUND_MANAGER", pages: fundManagerResponses },
  { role: "CONTRACTOR", pages: contractorResponses },
  { role: "AUDITOR", pages: auditorResponses },
  { role: "ADMIN", pages: adminResponses },
];

/**
 * Find a matching pre-scripted response for the given role, page, and message.
 */
export function findScriptedResponse(
  role: string,
  pathname: string,
  message: string
): string | null {
  const normalizedMessage = message.toLowerCase().trim();

  // 1. Try role-specific, page-specific responses first
  const roleData = allRoleResponses.find((r) => r.role === role);
  if (roleData) {
    // Sort by pagePattern length (longest first) for most specific match
    const sortedPages = [...roleData.pages].sort(
      (a, b) => b.pagePattern.length - a.pagePattern.length
    );
    for (const page of sortedPages) {
      if (pathname.startsWith(page.pagePattern)) {
        for (const resp of page.responses) {
          if (resp.patterns.some((p) => normalizedMessage.includes(p))) {
            return resp.response;
          }
        }
      }
    }
  }

  // 2. Try generic responses
  for (const resp of genericResponses) {
    if (resp.patterns.some((p) => normalizedMessage.includes(p))) {
      return resp.response;
    }
  }

  // 3. Default fallback
  return "I'm not sure I understand that question. Try asking about the current page, AI scoring, application status, or platform features. I'm here to help you navigate iFundOS.";
}

/**
 * Get the human-readable page name for the current pathname.
 */
export function getPageName(role: string, pathname: string): string {
  const roleData = allRoleResponses.find((r) => r.role === role);
  if (roleData) {
    const sortedPages = [...roleData.pages].sort(
      (a, b) => b.pagePattern.length - a.pagePattern.length
    );
    for (const page of sortedPages) {
      if (pathname.startsWith(page.pagePattern)) {
        return page.pageName;
      }
    }
  }
  return "iFundOS";
}
