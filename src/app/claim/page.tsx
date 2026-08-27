"use client";

import { useState } from "react";
import Link from "next/link";
import { IntakeClassification, ExtractedDocFields } from "@/lib/ai";
import { getCitizenByUan } from "@/lib/citizens";
import { ClaimForm } from "@/lib/types";
import { ClaimFormPreview } from "@/components/ClaimFormPreview";

const FORM_LABELS: Record<string, string> = {
  "19": "Form 19 — Final PF settlement",
  "10C": "Form 10C — EPS pension withdrawal",
  "31": "Form 31 — Partial/advance withdrawal",
  unclear: "Not sure yet",
};

const MAX_FILES = 3;

type IntakeResponse = IntakeClassification & { source: "openai" | "fallback" };
type ExtractResponse = ExtractedDocFields & { source: "openai" | "fallback" };

interface MergedFields {
  name: string | null;
  uan: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  perFile: { fileName: string; documentType: string; source: "openai" | "fallback" }[];
  anySource: "openai" | "fallback" | null;
}

const CLARIFYING_PROMPTS = [
  "I've left my job for good and want my full PF balance",
  "I need money for medical treatment",
  "I need money for my child's education",
  "I need money for a wedding in the family",
  "I'm buying or building a house",
  "I want my pension withdrawn as a lump sum",
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Two documents together (a UAN card for name/UAN, a passbook for account/IFSC)
// give a complete field set; one alone only ever gives half. Merge takes the
// first non-null value found per field, in upload order.
function mergeExtractions(files: File[], results: ExtractResponse[]): MergedFields {
  const merged: MergedFields = { name: null, uan: null, accountNumber: null, ifsc: null, perFile: [], anySource: null };
  results.forEach((r, i) => {
    merged.name ??= r.name;
    merged.uan ??= r.uan;
    merged.accountNumber ??= r.accountNumber;
    merged.ifsc ??= r.ifsc;
    if (merged.anySource === null || r.source === "openai") merged.anySource = r.source;
    merged.perFile.push({ fileName: files[i]?.name ?? `document ${i + 1}`, documentType: r.documentType, source: r.source });
  });
  return merged;
}

export default function GuidedClaimPage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [intake, setIntake] = useState<IntakeResponse | null>(null);
  const [merged, setMerged] = useState<MergedFields | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runIntake(situationText: string, includeFiles: boolean) {
    if (!situationText.trim()) return;
    setLoading(true);
    setError(null);
    setIntake(null);
    if (!includeFiles) setMerged(null);

    try {
      const intakeRes = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: situationText }),
      });
      if (intakeRes.status === 429) {
        const data = await intakeRes.json().catch(() => null);
        const wait = data?.retryAfterSeconds ? ` Try again in about ${data.retryAfterSeconds}s.` : "";
        setError(`This demo is getting a lot of requests right now.${wait}`);
        return;
      }
      if (!intakeRes.ok) throw new Error("intake failed");
      setIntake(await intakeRes.json());

      if (includeFiles && files.length > 0) {
        const results = await Promise.all(
          files.map(async (file) => {
            const dataUrl = await fileToDataUrl(file);
            const res = await fetch("/api/extract", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageDataUrl: dataUrl }),
            });
            return res.ok ? ((await res.json()) as ExtractResponse) : null;
          })
        );
        const ok = results.filter((r): r is ExtractResponse => r !== null);
        if (ok.length > 0) setMerged(mergeExtractions(files, ok));
      }
    } catch {
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, MAX_FILES);
    setFiles(selected);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runIntake(text, true);
  }

  function handleClarify(prompt: string) {
    setText(prompt);
    runIntake(prompt, true);
  }

  const recognizedCitizen = merged?.uan ? getCitizenByUan(merged.uan) : null;
  const previewFormType: ClaimForm | null =
    intake && ["19", "10C", "31"].includes(intake.formGuess) ? (intake.formGuess as ClaimForm) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Guided claim</h1>
      <p className="mt-2 text-sm text-slate-600">
        Describe your situation in your own words — no form jargon needed. We&apos;ll work out
        which claim form applies and start prefilling it from any documents you upload.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-md border border-slate-200 bg-white p-5">
        <div>
          <label htmlFor="situation" className="block text-sm font-medium text-slate-700">
            What&apos;s your situation?
          </label>
          <textarea
            id="situation"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={`e.g. "I left my job two months ago and want to withdraw my full PF balance" or "I need money for my daughter's wedding"`}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="doc" className="block text-sm font-medium text-slate-700">
            Upload your UAN card and/or passbook (optional, up to {MAX_FILES})
          </label>
          <input
            id="doc"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {files.length} file{files.length > 1 ? "s" : ""} selected: {files.map((f) => f.name).join(", ")}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Mock documents only — nothing here should be a real ID. A UAN card alone only gives
            your name and UAN; add a passbook too for your bank account and IFSC.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Don&apos;t have any handy? Try both samples:{" "}
            <a href="/api/mock-documents/100200300401/uan-card.png" download className="text-brand-700 underline">
              UAN card
            </a>{" "}
            and{" "}
            <a href="/api/mock-documents/100200300405/passbook.png" download className="text-brand-700 underline">
              passbook
            </a>
            . Both are generated on the fly from the mock database (synthetic, watermarked) — or{" "}
            <Link href="/preflight" className="text-brand-700 underline">
              browse all 50 mock profiles
            </Link>{" "}
            and grab documents for any of them.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Working it out..." : "Continue"}
        </button>
      </form>

      {intake && (
        <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Based on what you told us
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{FORM_LABELS[intake.formGuess]}</p>
          <p className="mt-1 text-sm text-slate-600">{intake.reasoning}</p>
          {intake.detectedCategory && (
            <p className="mt-2 inline-block rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {intake.detectedCategory}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            {intake.source === "openai" ? "Classified by OpenAI model" : "Offline fallback template (no API key configured)"}
          </p>

          {intake.formGuess === "unclear" && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700">
                Which of these is closest to your situation?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CLARIFYING_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleClarify(prompt)}
                    disabled={loading}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {merged && (
        <div className="mt-4 rounded-md border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Detected from your document{merged.perFile.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
            {merged.perFile.map((f, i) => (
              <li key={i}>
                {f.fileName} — read as {f.documentType.replace("_", " ")} (
                {f.source === "openai" ? "OpenAI vision" : "offline fallback"})
              </li>
            ))}
          </ul>

          {recognizedCitizen && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm text-emerald-900">
                This UAN matches a record in the mock database ({recognizedCitizen.displayName}) —
                skip the login and jump straight to its pre-flight status.
              </p>
              <Link
                href={`/preflight/${merged.uan}`}
                className="mt-2 inline-block rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                View pre-flight status &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {previewFormType && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prefilled form preview
          </p>
          <ClaimFormPreview
            formType={previewFormType}
            name={merged?.name ?? null}
            uan={merged?.uan ?? null}
            accountNumber={merged?.accountNumber ?? null}
            ifsc={merged?.ifsc ?? null}
            advanceCategory={intake?.detectedCategory ?? null}
          />
        </div>
      )}

      {intake && (
        <div className="mt-6 rounded-md border border-brand-200 bg-brand-50 p-5">
          <p className="text-sm text-brand-900">
            {intake.formGuess === "unclear"
              ? "Pick one of the options above for a specific form match, or run a pre-flight check now — it works off your actual EPFO record, so it doesn't need a guessed form type to check your eligibility and flag issues."
              : "Next, run a pre-flight check to make sure this claim won't bounce back before you submit it."}
          </p>
          <Link
            href={merged?.uan ? `/preflight?uan=${merged.uan}` : "/preflight"}
            className="mt-3 inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Run pre-flight check &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
