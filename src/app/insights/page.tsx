import Link from "next/link";
import { CITIZENS } from "@/lib/citizens";
import { computePopulationStats } from "@/lib/population-stats";

const SEVERITY_META = {
  red: { label: "Would be rejected today", dot: "bg-red-600", text: "text-red-700", ring: "border-red-200 bg-red-50" },
  amber: { label: "Would need attention", dot: "bg-amber-500", text: "text-amber-700", ring: "border-amber-200 bg-amber-50" },
  green: { label: "Would pass clean", dot: "bg-emerald-600", text: "text-emerald-700", ring: "border-emerald-200 bg-emerald-50" },
} as const;

export default function InsightsPage() {
  const stats = computePopulationStats(CITIZENS);
  const maxIssueCount = Math.max(1, ...stats.issueBreakdown.map((i) => i.count));
  const rejectedPct = Math.round(((stats.bySeverity.red + stats.bySeverity.amber) / stats.total) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Population insights</h1>
      <p className="mt-2 text-sm text-slate-600">
        The same deterministic rules engine that runs a single pre-flight check, run across all{" "}
        {stats.total} profiles in the mock database at once. No new logic, no AI calls — just
        counting real output.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {(["red", "amber", "green"] as const).map((sev) => {
          const meta = SEVERITY_META[sev];
          const count = stats.bySeverity[sev];
          const pct = Math.round((count / stats.total) * 100);
          return (
            <div key={sev} className={`rounded-md border p-4 ${meta.ring}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                <span className={`text-xs font-medium uppercase tracking-wide ${meta.text}`}>{meta.label}</span>
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{count}</p>
              <p className="text-sm text-slate-500">{pct}% of {stats.total}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          What&apos;s actually causing it
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Citizens can hit more than one issue — bars count how many profiles are affected by
          each cause, not total issue count.
        </p>
        <div className="mt-4 space-y-3">
          {stats.issueBreakdown.map((entry) => {
            const widthPct = Math.max(4, Math.round((entry.count / maxIssueCount) * 100));
            return (
              <div key={entry.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-slate-700">{entry.label}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-5 flex-1 rounded-sm bg-slate-100">
                    <div
                      className="h-5 rounded-r-sm bg-brand-700"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm font-medium text-slate-900">
                    {entry.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-md border border-brand-200 bg-brand-50 p-5">
        <p className="text-sm text-brand-900">
          <strong>{rejectedPct}%</strong> of this mock database would be rejected or flagged today —
          well above EPFO&apos;s own published combined return/rejection rate (~21.6%, cited in the
          project plan). That&apos;s deliberate, not a modeling error: the generator rolls several
          independent failure probabilities per citizen (name match, KYC, bank seeding, exit
          approval) to exercise the rules engine broadly, and those compound fast — it was never
          tuned to reproduce the real rate, and 50 synthetic profiles aren&apos;t a statistical
          sample of the real system either way. What the real EPFO figures do support is the
          underlying shape reflected here — most of what shows up below is fixable paperwork
          (a name mismatch, a KYC step, an unapproved exit), not genuine ineligibility.
        </p>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        See <Link href="/mocked" className="underline">what&apos;s real, what&apos;s mocked</Link> for
        exactly how this database is generated, and <Link href="/preflight" className="underline">browse individual profiles</Link>.
      </p>
    </div>
  );
}
