import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { findScriptedResponse } from "@/components/navigator/navigator-responses";

/**
 * Navigator API route — Claude-powered AI advisor for iFundOS.
 *
 * Accepts conversation history for multi-turn context.
 * Falls back to pre-scripted responses when API key is not set.
 */

const isMockMode =
  !process.env.ANTHROPIC_API_KEY ||
  process.env.ANTHROPIC_API_KEY === "placeholder";

// ─── System Prompt ─────────────────────────────────────────────────────────
function buildSystemPrompt(role: string, pathname: string): string {
  return `You are **Navigator**, the built-in AI advisor for iFundOS — the Saudi Environmental Fund's intelligent grant management platform built for the Saudi Green Initiative.

═══════════════════════════════════════════
  CURRENT SESSION CONTEXT
═══════════════════════════════════════════
• User role: ${role}
• Current page: ${pathname}

═══════════════════════════════════════════
  PLATFORM OVERVIEW
═══════════════════════════════════════════
iFundOS manages the full lifecycle of environmental grants under the Saudi Green Initiative:
  1. **RFP Publishing** — Fund managers publish Requests for Proposals
  2. **Contractor Applications** — Contractors submit proposals with budgets and work plans
  3. **AI-Powered Screening** — Claude evaluates applications across 4 dimensions (25% each):
     - Procurement Compliance (documentation, regulatory alignment)
     - Vision & Approach (methodology, innovation, alignment with Saudi Green Initiative)
     - Viability & Capacity (team experience, timeline, budget realism)
     - Environmental Impact (measurable outcomes, CO₂ reduction, biodiversity)
  4. **Fund Manager Review** — Human-in-the-loop decisions: Shortlist, Approve, Reject
  5. **Grant Disbursement** — Milestone-based payments with evidence verification
  6. **Audit Trail** — Complete transparency for compliance and oversight
  7. **Impact Tracking** — Real-time environmental KPIs (trees planted, CO₂ offset, etc.)

═══════════════════════════════════════════
  ROLE-SPECIFIC KNOWLEDGE
═══════════════════════════════════════════

**Fund Manager (FM)** — Reviews AI-screened applications, makes funding decisions
  • Dashboard: KPI overview, pending reviews, disbursement stats
  • Applications Pipeline: AI screening results, composite scores, shortlist/approve/reject
  • Grants: Active grant monitoring, milestone tracking, payment scheduling
  • Evidence: Verify contractor-submitted deliverables
  • Impact: Environmental outcome metrics and reporting

**Contractor** — Submits proposals, manages active grants
  • Dashboard: Application status, active contracts, upcoming milestones
  • RFPs: Browse and apply to open funding opportunities
  • Applications: Track submission status and AI screening feedback
  • Contracts: View active grants, submit milestone evidence

**Auditor** — Ensures compliance and transparency across the platform
  • Home: Platform health metrics, anomaly detection, activity stream
  • Decisions: Review AI vs Fund Manager decision concordance
  • Programs: Audit funding programs and allocation
  • Disbursements: Verify payment integrity and ALIN credential encoding

**Admin** — System administration and user management
  • Users: Manage platform user accounts and roles
  • Programs: Configure funding programs
  • System: Platform configuration and health monitoring

═══════════════════════════════════════════
  SPECIAL FEATURES
═══════════════════════════════════════════
• **ALIN Encoding** — Secure credential textures that protect disbursement integrity. Contractors encode credentials; FMs and Auditors verify encoding status.
• **AI Screening Modal** — 7-stage interactive walkthrough: Document Intake → Procurement → Vision → Viability → Impact → Composite → Verdict
• **Navigator Video Briefing** — HeyGen AI avatar delivers personalized application feedback to contractors
• **Score Rings** — Circular SVG visualizations: green ≥75, amber ≥50, red <50
• **Neumorphic Design System** — Organic biophilic UI inspired by Saudi Green Initiative (leaf/ocean/sand color tokens)

═══════════════════════════════════════════
  RESPONSE GUIDELINES
═══════════════════════════════════════════
• Keep responses concise (under 150 words) unless the user asks for detail
• Be specific and actionable — reference the user's current page
• Use **bold** for emphasis and bullet points for lists
• When describing scores, explain the 4-dimension breakdown
• Never fabricate data — describe features, workflows, and capabilities
• Be warm and professional — you're a trusted advisor
• If asked about something outside iFundOS, politely redirect to platform topics
• For greetings, be friendly and mention what you can help with on their current page`;
}

// ─── Route Handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, role, pathname, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userRole = role ?? "FUND_MANAGER";
    const userPath = pathname ?? "/dashboard";

    // ─── Claude API (live mode) ───────────────────────────────────────
    if (!isMockMode) {
      try {
        const client = new Anthropic();

        // Build conversation messages from history
        const messages: Anthropic.MessageParam[] = [];

        // Include up to 20 previous turns for context
        if (Array.isArray(history)) {
          const recentHistory = history.slice(-20);
          for (const msg of recentHistory) {
            if (msg.role === "user" && typeof msg.content === "string") {
              messages.push({ role: "user", content: msg.content });
            } else if (msg.role === "navigator" && typeof msg.content === "string") {
              messages.push({ role: "assistant", content: msg.content });
            }
          }
        }

        // Add the current message
        messages.push({ role: "user", content: message });

        // Ensure messages alternate properly (Claude requires user/assistant alternation)
        const cleanMessages = enforceAlternation(messages);

        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: buildSystemPrompt(userRole, userPath),
          messages: cleanMessages,
        });

        const text =
          response.content[0]?.type === "text"
            ? response.content[0].text
            : "I couldn't generate a response. Please try again.";

        return NextResponse.json({ response: text, source: "claude" });
      } catch (err) {
        console.error("[Navigator] Claude API error:", err);
        // Fall through to scripted responses
      }
    }

    // ─── Scripted fallback (demo / no API key) ────────────────────────
    await new Promise((r) => setTimeout(r, 600));

    const scripted = findScriptedResponse(userRole, userPath, message);
    return NextResponse.json({
      response:
        scripted ??
        "I'm not sure I understand. Try asking about the current page or platform features.",
      source: "scripted",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Ensure messages strictly alternate between user and assistant.
 * Claude API requires this — consecutive same-role messages get merged.
 */
function enforceAlternation(messages: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  if (messages.length === 0) return [];

  const result: Anthropic.MessageParam[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const prev = result[result.length - 1];
    const curr = messages[i];

    if (prev.role === curr.role) {
      // Merge consecutive same-role messages
      const prevText = typeof prev.content === "string" ? prev.content : "";
      const currText = typeof curr.content === "string" ? curr.content : "";
      result[result.length - 1] = {
        role: prev.role,
        content: `${prevText}\n\n${currText}`,
      };
    } else {
      result.push(curr);
    }
  }

  // Must start with user message
  if (result.length > 0 && result[0].role !== "user") {
    result.shift();
  }

  return result;
}
