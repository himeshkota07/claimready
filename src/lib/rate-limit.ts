import { NextResponse } from "next/server";

// Best-effort in-memory rate limit for the OpenAI-backed routes.
// State lives per serverless instance — it resets on a cold start and isn't
// shared across instances, so it won't stop a distributed abuser. What it
// does stop: a single reviewer's browser, script, or accidental retry loop
// from burning through the OpenAI budget mid-judging (see risk register in
// claimready-master-doc.md — "API key exposure / credit drain").

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
const GLOBAL_KEY = "__global__";

function prune(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((t) => now - t < windowMs);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  const timestamps = prune(existing?.timestamps ?? [], windowMs, now);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets.set(key, { timestamps });
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  if (key !== GLOBAL_KEY && timestamps.length === 0) {
    buckets.delete(key);
  } else {
    buckets.set(key, { timestamps });
  }
  return { allowed: true };
}

const PER_IP_LIMIT = 8;
const PER_IP_WINDOW_MS = 60_000; // 8 requests/minute per IP, per route

const GLOBAL_LIMIT = 60;
const GLOBAL_WINDOW_MS = 60_000; // 60 requests/minute total, per route, on this instance

/**
 * Call once per incoming request to an OpenAI-backed route, before making
 * the model call. `scope` namespaces the limit per route (decode/intake/
 * extract) so one busy feature doesn't starve the others.
 */
export function checkAiRateLimit(ip: string, scope: string): RateLimitResult {
  const globalResult = hit(`${scope}:${GLOBAL_KEY}`, GLOBAL_LIMIT, GLOBAL_WINDOW_MS);
  if (!globalResult.allowed) return globalResult;
  return hit(`${scope}:ip:${ip}`, PER_IP_LIMIT, PER_IP_WINDOW_MS);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: "Too many requests. Please wait a moment and try again.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds ?? 30) } }
  );
}
