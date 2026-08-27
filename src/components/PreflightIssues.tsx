"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CitizenProfile, WhoFixes } from "@/lib/types";
import { runPreflightCheck } from "@/lib/rules-engine";
import { applyIssueFixes } from "@/lib/fix-simulator";
import { StatusPill } from "@/components/StatusPill";

const WHO_LABELS: Record<WhoFixes, string> = {
  you: "You need to fix this",
  employer: "Your employer needs to fix this",
  field_office: "The EPFO field office needs to fix this",
};

const WHO_STYLES: Record<WhoFixes, string> = {
  you: "bg-brand-50 text-brand-700 border-brand-200",
  employer: "bg-purple-50 text-purple-700 border-purple-200",
  field_office: "bg-slate-100 text-slate-700 border-slate-300",
};

export function PreflightIssues({ citizen }: { citizen: CitizenProfile }) {
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());

  const original = useMemo(() => runPreflightCheck(citizen), [citizen]);
  const hasFixes = fixedIds.size > 0;

  const simulated = useMemo(() => {
    if (!hasFixes) return null;
    const patched = applyIssueFixes(citizen, fixedIds);
    return runPreflightCheck(patched);
  }, [citizen, fixedIds, hasFixes]);

  const hasIssues = original.issues.length > 0;

  function toggleFix(id: string) {
    setFixedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-slate-900">
        {hasIssues ? `${original.issues.length} thing${original.issues.length > 1 ? "s" : ""} to fix` : "Nothing to fix"}
      </h2>

      {!hasIssues && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-emerald-800">
            This record passes every check ClaimReady runs. You can proceed straight to filing.
          </p>
          <Link
            href="/claim"
            className="mt-3 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Start guided claim &rarr;
          </Link>
        </div>
      )}

      {hasIssues && (
        <div className="mt-4 rounded-md border border-dashed border-brand-300 bg-brand-50 p-4 print:hidden">
          <p className="text-sm text-brand-900">
            <strong>Try it:</strong> check off issues below as &quot;fixed&quot; to see the result
            update live — this re-runs the real rules engine on a simulated corrected record, it
            doesn&apos;t just hide the card.
          </p>
          {hasFixes && simulated && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-brand-200 pt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Simulated result:
              </span>
              <StatusPill severity={simulated.overall} />
              <span className="text-sm text-brand-900">
                {simulated.issues.length === 0
                  ? "All checked issues resolved — nothing left to fix."
                  : `${simulated.issues.length} issue${simulated.issues.length > 1 ? "s" : ""} would remain.`}
              </span>
              <button
                onClick={() => setFixedIds(new Set())}
                className="ml-auto text-xs font-medium text-brand-700 underline hover:text-brand-900"
              >
                Reset simulation
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {original.issues
          .slice()
          .sort((a, b) => (a.severity === "red" ? -1 : b.severity === "red" ? 1 : 0))
          .map((issue) => {
            const isFixed = fixedIds.has(issue.id);
            return (
              <div
                key={issue.id}
                className={`rounded-md border p-5 transition ${isFixed ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusPill severity={issue.severity} />
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${WHO_STYLES[issue.whoFixes]}`}
                  >
                    {WHO_LABELS[issue.whoFixes]}
                  </span>
                </div>
                <p className="mt-3 text-slate-800">{issue.plainReason}</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Exact steps
                    </p>
                    <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-slate-700">
                      {issue.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    {issue.docsNeeded.length > 0 && (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Documents needed
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                          {issue.docsNeeded.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estimated time
                    </p>
                    <p className="text-sm text-slate-700">{issue.estTime}</p>
                  </div>
                </div>

                <label className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-700 print:hidden">
                  <input
                    type="checkbox"
                    checked={isFixed}
                    onChange={() => toggleFix(issue.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                  />
                  Mark as fixed (simulate)
                </label>
              </div>
            );
          })}
      </div>
    </div>
  );
}
