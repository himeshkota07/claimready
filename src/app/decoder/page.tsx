"use client";

import { useState } from "react";
import { REJECTION_SAMPLES } from "@/lib/rejection-strings";
import { RejectionDecoderOutput, WhoFixes, Language } from "@/lib/types";
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

export default function DecoderPage() {
  const [rawText, setRawText] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [result, setResult] = useState<DecodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDecode(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text, language }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as DecodeResponse;
      setResult(data);
    } catch {
      setError("Couldn't decode that just now. Try again in a moment.");
    } finally {
      setLoading(false);
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
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder='e.g. "Name not matching as per records"'
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
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
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
        </div>
      )}
    </div>
  );
}
