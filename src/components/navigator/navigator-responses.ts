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
    pagePattern: "/audit",
    pageName: "Auditor Dashboard",
    responses: [
      {
        patterns: ["overview", "dashboard", "status", "hello", "hi", "summary"],
        response:
          "Welcome to the Auditor Dashboard. This is your oversight command center for the iFundOS platform. Key areas to monitor: total audit events, flagged items requiring attention, and the AI scoring overview. The system maintains a tamper-evident hash chain of all platform actions. I recommend starting with any flagged items, then reviewing the AI scoring overview for unusual patterns.",
      },
      {
        patterns: ["flag", "flagged", "concern", "issue", "alert"],
        response:
          "Flagged items represent platform events that triggered automated anomaly detection. These can include: unusual login patterns, bulk score modifications, large disbursements, or permission changes. Each flagged event should be reviewed and either resolved or escalated. The flag count on your dashboard updates in real-time as new events are processed.",
      },
    ],
  },
  {
    pagePattern: "/audit/trail",
    pageName: "Audit Trail",
    responses: [
      {
        patterns: ["trail", "audit", "log", "events", "history", "chain"],
        response:
          "The Audit Trail is a tamper-evident log of every platform action. Each event is hashed and chained to the previous event, creating an immutable record. You can filter by resource type, action category, and date range. The 'Verify Chain' button runs a full integrity check to confirm no events have been modified or deleted. For compliance reporting, use the 'Export CSV' button.",
      },
      {
        patterns: ["verify", "integrity", "tamper", "hash"],
        response:
          "The hash chain verification process checks every event in sequence, confirming that each event's hash correctly chains to the previous one. If any event has been modified, deleted, or inserted out of order, the verification will detect the break and report its location. This provides cryptographic assurance of audit trail integrity — a core requirement for sovereign fund oversight.",
      },
    ],
  },
  {
    pagePattern: "/audit/reports",
    pageName: "Reports",
    responses: [
      {
        patterns: ["report", "export", "compliance", "generate"],
        response:
          "The Reports section lets you generate compliance and oversight reports. Available reports include: Platform Activity Summary (event counts and categories), AI Scoring Audit (scoring patterns and manual overrides), and Financial Oversight (disbursement tracking). Each report can be scoped to a specific date range. For raw data, use the CSV export option from the Audit Trail page.",
      },
    ],
  },
];

// ─── Admin Responses ─────────────────────────────────────────────────
const adminResponses: PageResponses[] = [
  {
    pagePattern: "/admin",
    pageName: "Admin Dashboard",
    responses: [
      {
        patterns: ["overview", "dashboard", "status", "hello", "hi", "summary", "health"],
        response:
          "Welcome to the Admin Dashboard. System status shows all services are operational. Key metrics include total users, recent registrations, and system health indicators. The AI scoring engine status and database connection are monitored in real-time. Check the Audit Trail section for recent platform activity and security events.",
      },
    ],
  },
  {
    pagePattern: "/admin/users",
    pageName: "User Management",
    responses: [
      {
        patterns: ["user", "manage", "role", "permission", "add"],
        response:
          "User Management allows you to view all platform users, their roles, and account status. Roles include Contractor, Fund Manager, Admin, and Auditor — each with different access levels. All role changes and user modifications are logged in the audit trail for compliance tracking.",
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
