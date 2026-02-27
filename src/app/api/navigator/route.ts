import { NextRequest, NextResponse } from "next/server";
import { findScriptedResponse } from "@/components/navigator/navigator-responses";

/**
 * Navigator API route.
 *
 * If ANTHROPIC_API_KEY is set, forwards to Claude API.
 * Otherwise, uses pre-scripted responses for demo mode.
 */
export async function POST(req: NextRequest) {
  try {
    const { message, role, pathname } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userRole = role ?? "FUND_MANAGER";
    const userPath = pathname ?? "/dashboard";

    // ─── Try Claude API if key is available ───────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are Navigator, the built-in AI advisor for iFundOS — the Saudi Environmental Fund's grant management platform. You are helpful, concise, and professional.

Current context:
- User role: ${userRole}
- Current page: ${userPath}
- Platform: iFundOS (Saudi Green Initiative environmental fund management)

Your capabilities:
- Explain features on the current page
- Guide users through platform workflows
- Answer questions about AI scoring, grant management, audit trails
- Provide context-aware assistance based on the user's role

Rules:
- Keep responses under 150 words
- Be specific and actionable
- Reference the user's current page context when relevant
- Use bullet points for lists
- Do not make up data — describe features and workflows`;

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: "user", content: message }],
          }),
        });

        if (claudeRes.ok) {
          const data = await claudeRes.json();
          const text =
            data.content?.[0]?.type === "text"
              ? data.content[0].text
              : "I couldn't generate a response. Please try again.";

          return NextResponse.json({ response: text, source: "claude" });
        }
      } catch {
        // Fall through to scripted responses
      }
    }

    // ─── Scripted fallback (demo mode) ────────────────────────────────
    // Add a small delay to simulate thinking
    await new Promise((r) => setTimeout(r, 600));

    const scripted = findScriptedResponse(userRole, userPath, message);
    return NextResponse.json({
      response: scripted ?? "I'm not sure I understand. Try asking about the current page or platform features.",
      source: "scripted",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
