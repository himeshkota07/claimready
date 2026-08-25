import { NextRequest, NextResponse } from "next/server";
import { classifyIntake } from "@/lib/ai";
import { checkAiRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rateLimit = checkAiRateLimit(getClientIp(req), "intake");
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: "text too long" }, { status: 400 });
  }

  const result = await classifyIntake(text);
  return NextResponse.json(result);
}
