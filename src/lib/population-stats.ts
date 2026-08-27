// Aggregates the deterministic rules engine's output across the whole mock
// database. Pure function over existing logic — no new AI calls, no new
// data, just running runPreflightCheck 50 times and counting. Powers
// /insights, which mirrors (qualitatively, not statistically) the real
// EPFO rejection-cause breakdown cited in claimready-master-doc.md.

import { CitizenProfile, Severity } from "./types";
import { runPreflightCheck } from "./rules-engine";

export interface IssueBreakdownEntry {
  key: string;
  label: string;
  count: number;
}

export interface PopulationStats {
  total: number;
  bySeverity: Record<Severity, number>;
  issueBreakdown: IssueBreakdownEntry[];
}

const ISSUE_LABELS: Record<string, string> = {
  "name-mismatch": "Name mismatch (Aadhaar or bank vs EPFO)",
  "invalid-ifsc": "Invalid IFSC format",
  "invalid-uan": "Invalid UAN format",
  "bank-not-seeded": "Bank KYC not seeded",
  "aadhaar-kyc-incomplete": "Aadhaar KYC incomplete",
  "pan-not-linked": "PAN not linked (service under 5 years)",
  "exit-not-approved": "Exit not approved by employer",
  "not-yet-eligible": "Not yet eligible (waiting period / advance category)",
};

// name-mismatch-aadhaar and name-mismatch-bank are two separate issues on a
// citizen (see rules-engine.ts) but should count as one "name mismatch"
// affected-citizen for this breakdown, not double the population.
function normalizeIssueKey(id: string): string {
  return id.replace(/-aadhaar$|-bank$/, "");
}

export function computePopulationStats(citizens: CitizenProfile[], now: Date = new Date()): PopulationStats {
  const bySeverity: Record<Severity, number> = { red: 0, amber: 0, green: 0 };
  const counts = new Map<string, number>();

  for (const citizen of citizens) {
    const result = runPreflightCheck(citizen, now);
    bySeverity[result.overall]++;

    const seenKeys = new Set<string>();
    for (const issue of result.issues) seenKeys.add(normalizeIssueKey(issue.id));
    for (const key of seenKeys) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const issueBreakdown = Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: ISSUE_LABELS[key] ?? key, count }))
    .sort((a, b) => b.count - a.count);

  return { total: citizens.length, bySeverity, issueBreakdown };
}
