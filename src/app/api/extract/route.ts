import { NextRequest, NextResponse } from "next/server";
import { extractDocumentFields } from "@/lib/ai";
import { checkAiRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const MAX_DATA_URL_LENGTH = 6_000_000; // ~4.5MB image, base64-inflated

export async function POST(req: NextRequest) {
  const rateLimit = checkAiRateLimit(getClientIp(req), "extract");
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const body = await req.json().catch(() => null);
  const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : "";

  if (!imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "imageDataUrl must be a data:image/* URL" }, { status: 400 });
  }
  if (imageDataUrl.length > MAX_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "image too large" }, { status: 400 });
  }

  const result = await extractDocumentFields(imageDataUrl);
  return NextResponse.json(result);
}
