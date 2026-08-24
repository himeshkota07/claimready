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

  const used = new Set<number>();
  let totalScore = 0;

  for (const tokenL of longer) {
    let best = 0;
    let bestIdx = -1;
    shorter.forEach((tokenS, idx) => {
      if (used.has(idx)) return;
      const sim = tokenSimilarity(tokenL, tokenS);
      if (sim > best) {
        best = sim;
        bestIdx = idx;
      }
    });
    if (bestIdx >= 0 && best > 0.5) used.add(bestIdx);
    totalScore += best;
  }

  const score = (totalScore / longer.length) * 100;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function nameMatchSeverity(score: number): "red" | "amber" | "green" {
  if (score >= 90) return "green";
  if (score >= 65) return "amber";
  return "red";
}
