import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MODEL = "claude-haiku-4-5-20251001"; // cheap + fast; good for high volume
const DAILY_LIMIT = 15; // AI advice requests per user per day

// Build a compact, trusted-facts prompt from the numbers the app already computed.
// The model is told never to invent numbers.
function buildFacts(c) {
  const lines = [];
  if (c.level) lines.push(`Programme: ${c.level}`);
  if (c.scaleMax) lines.push(`Grade scale: ${c.scaleMax}.00`);
  if (c.cgpa != null) lines.push(`Current CGPA: ${c.cgpa} (${c.currentClass || "n/a"})`);
  if (c.targetClass) lines.push(`Target class: ${c.targetClass}`);
  if (c.projectedFinal != null)
    lines.push(`Projected final CGPA at current trend: ${c.projectedFinal} (${c.projectedClass || "n/a"})`);
  if (c.chance != null) lines.push(`Modelled chance of the target: ${c.chance}%`);
  if (c.trend) lines.push(`Recent trend: ${c.trend}`);
  if (c.unitsRemaining) lines.push(`Credit units left: ${c.unitsRemaining}`);
  if (c.requiredGpa != null)
    lines.push(`Average GPA needed across remaining units for the target: ${c.requiredGpa}`);
  return lines.join("\n");
}

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "AI Advisor isn't configured yet." }, { status: 503 });
  }

  // Must be signed in (protects your API spend from anonymous abuse).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to use the AI Advisor." }, { status: 401 });
  }

  // Daily per-user cap.
  try {
    const { data: allowed } = await supabase.rpc("bump_ai_usage", { p_limit: DAILY_LIMIT });
    if (allowed === false) {
      return NextResponse.json(
        { error: "You've reached today's AI Advisor limit. Try again tomorrow." },
        { status: 429 }
      );
    }
  } catch {
    // if the rate-limit function isn't installed, fail open but keep going
  }

  const ctx = await req.json().catch(() => ({}));
  const facts = buildFacts(ctx);
  if (!facts) {
    return NextResponse.json({ error: "Add some courses first, then ask for advice." }, { status: 400 });
  }

  const system =
    "You are a warm, sharp academic advisor for Nigerian university students using NaijaCGPA. " +
    "You are given already-computed, trusted numbers — NEVER invent, change, or recalculate any number; use only what you're given. " +
    "Reply in 90 words or fewer, in plain encouraging English. Structure: (1) one honest line on where they stand, " +
    "(2) two or three specific, doable actions for this semester, (3) one motivating closing line. " +
    "No headings, no bullet lists, don't just restate the raw figures, at most one emoji. If the target looks out of reach, be kind and suggest aiming realistically.";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 320,
        system,
        messages: [{ role: "user", content: `Here are my numbers:\n${facts}\n\nGive me advice.` }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "The AI Advisor is busy — try again in a moment." }, { status: 502 });
    }
    const data = await res.json();
    const advice = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return NextResponse.json({ advice });
  } catch {
    return NextResponse.json({ error: "Couldn't reach the AI Advisor right now." }, { status: 502 });
  }
}
