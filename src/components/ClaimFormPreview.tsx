import { ClaimForm } from "@/lib/types";

const FORM_TITLES: Record<ClaimForm, string> = {
  "19": "Form 19 — Application for Final PF Settlement",
  "10C": "Form 10C — Application for EPS Withdrawal Benefit",
  "31": "Form 31 — Application for PF Advance / Partial Withdrawal",
};

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-b border-slate-200 py-2.5 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {value ? (
        <p className="mt-0.5 text-sm text-slate-900">{value}</p>
      ) : (
        <p className="mt-0.5 text-sm italic text-slate-400">Not detected — fill in manually</p>
      )}
    </div>
  );
}

export function ClaimFormPreview({
  formType,
  name,
  uan,
  accountNumber,
  ifsc,
  advanceCategory,
}: {
  formType: ClaimForm;
  name: string | null;
  uan: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  advanceCategory?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-300">
      <div className="flex items-center justify-between bg-brand-900 px-4 py-2.5">
        <p className="text-sm font-semibold text-white">{FORM_TITLES[formType]}</p>
        <span className="rounded-sm border border-brand-400 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-200">
          Preview only
        </span>
      </div>
      <div className="bg-white px-4 py-1">
        <Field label="Applicant name" value={name} />
        <Field label="UAN" value={uan} />
        <Field label="Bank account number" value={accountNumber} />
        <Field label="IFSC code" value={ifsc} />
        {formType === "31" && <Field label="Advance category" value={advanceCategory ?? null} />}
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
        <p className="text-[11px] text-slate-500">
          Visual preview of what this form would look like prefilled. ClaimReady does not submit
          anything on your behalf — see{" "}
          <a href="/mocked" className="underline">
            what&apos;s real, what&apos;s mocked
          </a>
          .
        </p>
      </div>
    </div>
  );
}
