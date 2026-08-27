import Link from "next/link";
import { notFound } from "next/navigation";
import { getCitizenByUan } from "@/lib/citizens";
import { runPreflightCheck } from "@/lib/rules-engine";
import { StatusPill } from "@/components/StatusPill";
import { PrintButton } from "@/components/PrintButton";
import { PreflightIssues } from "@/components/PreflightIssues";

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
  const generatedOn = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Pre-flight result for</p>
          <h1 className="text-2xl font-bold text-slate-900">{citizen.displayName}</h1>
          <p className="hidden text-xs text-slate-400 print:block">
            UAN {citizen.uan} · Generated {generatedOn} · ClaimReady (independent hackathon
            prototype, not an EPFO product — synthetic data, see claimready-epfo.vercel.app/mocked)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill severity={result.overall} />
          <PrintButton />
        </div>
      </div>

      <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
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

      <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
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

      <PreflightIssues citizen={citizen} />

      <div className="mt-8 flex flex-wrap gap-3 print:hidden">
        <Link href="/preflight" className="text-sm text-slate-600 underline hover:text-slate-900">
          &larr; Check a different profile
        </Link>
      </div>
    </div>
  );
}
