import Link from "next/link";
import { notFound } from "next/navigation";
import { getCitizenByUan } from "@/lib/citizens";
import { runPreflightCheck } from "@/lib/rules-engine";
import { StatusPill } from "@/components/StatusPill";
import { WhoFixes } from "@/lib/types";

const WHO_LABELS: Record<WhoFixes, string> = {
  you: "You need to fix this",
  employer: "Your employer needs to fix this",
  field_office: "The EPFO field office needs to fix this",
};

const WHO_STYLES: Record<WhoFixes, string> = {
  you: "bg-blue-50 text-blue-700 border-blue-200",
  employer: "bg-purple-50 text-purple-700 border-purple-200",
  field_office: "bg-slate-100 text-slate-700 border-slate-300",
};

const FORM_LABELS: Record<string, string> = {
  "19": "Form 19 — Final PF settlement",
  "10C": "Form 10C — EPS pension withdrawal",
  "31": "Form 31 — Partial/advance withdrawal",
};

export default async function PreflightResultPage({
  params,
}: {
  params: Promise<{ uan: string }>;
}) {
  const { uan } = await params;
  const citizen = getCitizenByUan(uan);
  if (!citizen) notFound();

  const result = runPreflightCheck(citizen);
  const hasIssues = result.issues.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Pre-flight result for</p>
          <h1 className="text-2xl font-bold text-slate-900">{citizen.displayName}</h1>
        </div>
        <StatusPill severity={result.overall} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Which form applies
        </h2>
        {result.eligibleForm ? (
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {FORM_LABELS[result.eligibleForm]}
          </p>
        ) : (
          <p className="mt-1 text-lg font-semibold text-red-700">Not yet claimable</p>
        )}
        <p className="mt-1 text-sm text-slate-600">{result.formReasoning}</p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Name match, deterministic score
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Aadhaar vs EPFO record</p>
            <p className="text-lg font-semibold text-slate-900">{result.nameMatch.aadhaarVsEpfo}%</p>
          </div>
          <div>
            <p className="text-slate-500">Bank vs EPFO record</p>
            <p className="text-lg font-semibold text-slate-900">{result.nameMatch.bankVsEpfo}%</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">
          {hasIssues ? `${result.issues.length} thing${result.issues.length > 1 ? "s" : ""} to fix` : "Nothing to fix"}
        </h2>

        {!hasIssues && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
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

        <div className="mt-4 space-y-4">
          {result.issues
            .slice()
            .sort((a, b) => (a.severity === "red" ? -1 : b.severity === "red" ? 1 : 0))
            .map((issue) => (
              <div key={issue.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
              </div>
            ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/preflight" className="text-sm text-slate-600 underline hover:text-slate-900">
          &larr; Check a different profile
        </Link>
      </div>
    </div>
  );
}
