import { NextRequest, NextResponse } from "next/server";
import { decodeRejection } from "@/lib/ai";
import { Language } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawText = typeof body?.rawText === "string" ? body.rawText.trim() : "";
  const language: Language = ["en", "hi", "kn"].includes(body?.language) ? body.language : "en";

  if (!rawText) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }
  if (rawText.length > 500) {
    return NextResponse.json({ error: "rawText too long" }, { status: 400 });
  }

  const result = await decodeRejection(rawText, language);
  return NextResponse.json(result);
}
