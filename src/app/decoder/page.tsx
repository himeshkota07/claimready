"use client";

import { useState } from "react";
import { REJECTION_SAMPLES } from "@/lib/rejection-strings";
import { RejectionDecoderOutput, WhoFixes, Language } from "@/lib/types";
import { GrievanceLetterResult } from "@/lib/ai";
import { StatusPill } from "@/components/StatusPill";

const WHO_LABELS: Record<WhoFixes, string> = {
  you: "You need to fix this",
  employer: "Your employer needs to fix this",
  field_office: "The EPFO field office needs to fix this",
};

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

type DecodeResponse = RejectionDecoderOutput & { source: "openai" | "fallback" };
type GrievanceResponse = GrievanceLetterResult & { source: "openai" | "fallback" };

export default function DecoderPage() {
  const [rawText, setRawText] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [result, setResult] = useState<DecodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [grievance, setGrievance] = useState<GrievanceResponse | null>(null);
  const [grievanceLoading, setGrievanceLoading] = useState(false);
  const [grievanceError, setGrievanceError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleDecode(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setGrievance(null);
    setGrievanceError(null);
    try {
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text, language }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => null);
        const wait = data?.retryAfterSeconds ? ` Try again in about ${data.retryAfterSeconds}s.` : "";
        setError(`This demo is getting a lot of requests right now.${wait}`);
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as DecodeResponse;
      setResult(data);
    } catch {
      setError("Couldn't decode that just now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDraftGrievance() {
    if (!result) return;
    setGrievanceLoading(true);
    setGrievanceError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, plainReason: result.plainReason, language }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => null);
        const wait = data?.retryAfterSeconds ? ` Try again in about ${data.retryAfterSeconds}s.` : "";
        setGrievanceError(`This demo is getting a lot of requests right now.${wait}`);
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      setGrievance(await res.json());
    } catch {
      setGrievanceError("Couldn't draft that just now. Try again in a moment.");
    } finally {
      setGrievanceLoading(false);
    }
  }

  async function handleCopyGrievance() {
    if (!grievance) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${grievance.subject}\n\n${grievance.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setGrievanceError("Couldn't copy to clipboard — select and copy the text manually.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Rejection decoder</h1>
      <p className="mt-2 text-sm text-slate-600">
        Paste the exact rejection reason from your EPFO claim status. This uses an OpenAI model
        to translate it into plain language, decide who needs to act, and lay out exact next
        steps — the deterministic rules engine handles form validation elsewhere, but reading
        cryptic free-text rejection language is genuinely a judgment task.
      </p>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Or try a real-world example
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {REJECTION_SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setRawText(s.raw);
                handleDecode(s.raw);
              }}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
            >
              {s.raw}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="rawText" className="block text-sm font-medium text-slate-700">
          Rejection reason
        </label>
        <textarea
          id="rawText"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder='e.g. "Name not matching as per records"'
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1" role="group" aria-label="Output language">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                aria-pressed={language === l.code}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  language === l.code
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleDecode(rawText)}
            disabled={loading || !rawText.trim()}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Decoding..." : "Decode"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && (
        <div
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          lang={result.source === "openai" ? result.language : "en"}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusPill severity="red" label="Decoded" />
            <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500">
              {result.source === "openai" ? "Explained by OpenAI model" : "Offline fallback template (no API key configured)"}
            </span>
          </div>

          {result.source === "fallback" && result.language !== "en" && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Hindi/Kannada output needs a live OpenAI key — the offline fallback below is
              English-only regardless of the language selected.
            </p>
          )}

          <p className="mt-3 text-slate-800">{result.plainReason}</p>

          <p className="mt-4 inline-block rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {WHO_LABELS[result.whoMustFix]}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Exact steps
              </p>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-slate-700">
                {result.exactSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
            <div>
              {result.docsNeeded.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Documents needed
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {result.docsNeeded.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estimated time
              </p>
              <p className="text-sm text-slate-700">{result.estTime}</p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">
              Already tried the steps above, or need to escalate formally? Draft an EPFiGMS
              grievance letter from this rejection.
            </p>
            <button
              onClick={handleDraftGrievance}
              disabled={grievanceLoading}
              className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {grievanceLoading ? "Drafting..." : "Draft a grievance letter"}
            </button>

            {grievanceError && <p className="mt-2 text-sm text-red-600">{grievanceError}</p>}

            {grievance && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs text-slate-500">
                    {grievance.source === "openai" ? "Drafted by OpenAI model" : "Offline fallback template (no API key configured)"}
                  </span>
                  <button
                    onClick={handleCopyGrievance}
                    className="rounded-md bg-blue-700 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                  >
                    {copied ? "Copied!" : "Copy letter"}
                  </button>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</p>
                <p className="text-sm text-slate-800">{grievance.subject}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Letter</p>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-slate-800">{grievance.body}</pre>
                <p className="mt-3 text-xs text-slate-400">
                  Fill in the bracketed placeholders with your real details before submitting via
                  the EPFiGMS portal. This is a draft, not a submission — nothing here is sent
                  anywhere on your behalf.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
