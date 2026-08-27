import { NextRequest, NextResponse } from "next/server";
import { draftGrievanceLetter } from "@/lib/ai";
import { Language } from "@/lib/types";
import { checkAiRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rateLimit = checkAiRateLimit(getClientIp(req), "grievance");
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const body = await req.json().catch(() => null);
  const rawText = typeof body?.rawText === "string" ? body.rawText.trim() : "";
  const plainReason = typeof body?.plainReason === "string" ? body.plainReason.trim() : "";
  const language: Language = ["en", "hi", "kn"].includes(body?.language) ? body.language : "en";

  if (!rawText || !plainReason) {
    return NextResponse.json({ error: "rawText and plainReason are required" }, { status: 400 });
  }
  if (rawText.length > 500 || plainReason.length > 1000) {
    return NextResponse.json({ error: "input too long" }, { status: 400 });
  }

  const result = await draftGrievanceLetter(rawText, plainReason, language);
  return NextResponse.json(result);
}
