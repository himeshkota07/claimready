// Fuzzy name-match scoring. Deterministic — no LLM involved.
// Normalises common Indian-name variation (initials, middle names, spacing,
// honorifics) then scores similarity with Levenshtein distance.

const HONORIFICS = new Set(["mr", "mrs", "ms", "dr", "shri", "smt", "kumari"]);

function normalise(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[.]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !HONORIFICS.has(t));
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array(n + 1)
    .fill(0)
    .map((_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = temp;
    }
  }
  return dp[n];
}

function tokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  // Treat a single-letter token as an initial: matches if it's a prefix.
  if (a.length === 1 || b.length === 1) {
    const [short, long] = a.length <= b.length ? [a, b] : [b, a];
    return long.startsWith(short) ? 0.9 : 0;
  }
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, 1 - dist / maxLen);
}

// Best-possible one-to-one pairing of shorter's tokens into longer's slots
// (each longer token matched to at most one shorter token, or left
// unmatched — contributing 0). Exhaustive search: name token counts are
// tiny (2-5 in practice) so this is instant, and it's the thing that makes
// the score correct — a greedy left-to-right pick can lock in a mediocre
// match early and miss a better pairing later in the list (confirmed: it
// mismatched real name pairs during testing, e.g. picking a token because
// it was the least-bad option scanned so far, not the best one available
// overall). Falls back to a fast greedy pass above a size threshold where
// factorial blowup would matter — no real name gets close to that.
const EXHAUSTIVE_TOKEN_LIMIT = 8;

function bestGreedyMatching(longer: string[], shorter: string[]): number {
  const used = new Array(shorter.length).fill(false);
  let total = 0;
  for (const tokenL of longer) {
    let best = 0;
    let bestIdx = -1;
    shorter.forEach((tokenS, idx) => {
      if (used[idx]) return;
      const sim = tokenSimilarity(tokenL, tokenS);
      if (sim > best) {
        best = sim;
        bestIdx = idx;
      }
    });
    if (bestIdx >= 0 && best > 0.5) used[bestIdx] = true;
    total += best;
  }
  return total;
}

function bestExhaustiveMatching(longer: string[], shorter: string[]): number {
  const usedShorter = new Array(shorter.length).fill(false);

  function rec(i: number): number {
    if (i === longer.length) return 0;
    let best = rec(i + 1); // leave longer[i] unmatched
    for (let j = 0; j < shorter.length; j++) {
      if (usedShorter[j]) continue;
      const sim = tokenSimilarity(longer[i], shorter[j]);
      if (sim <= 0) continue;
      usedShorter[j] = true;
      const candidate = sim + rec(i + 1);
      if (candidate > best) best = candidate;
      usedShorter[j] = false;
    }
    return best;
  }

  return rec(0);
}

/**
 * Returns a 0-100 similarity score between two names, tolerant of
 * initials, dropped middle names, and word-order swaps.
 */
export function nameMatchScore(nameA: string, nameB: string): number {
  const tokensA = normalise(nameA);
  const tokensB = normalise(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const longer = tokensA.length >= tokensB.length ? tokensA : tokensB;
  const shorter = tokensA.length >= tokensB.length ? tokensB : tokensA;

  const totalScore =
    longer.length <= EXHAUSTIVE_TOKEN_LIMIT
      ? bestExhaustiveMatching(longer, shorter)
      : bestGreedyMatching(longer, shorter);

  const score = (totalScore / longer.length) * 100;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function nameMatchSeverity(score: number): "red" | "amber" | "green" {
  if (score >= 90) return "green";
  if (score >= 65) return "amber";
  return "red";
}
