"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIZENS, FEATURED_UANS, SYNTHETIC_CITIZENS, searchCitizens } from "@/lib/citizens";

const FEATURED = FEATURED_UANS.map((uan) => CITIZENS.find((c) => c.uan === uan)!);

export default function PreflightLoginPage() {
  const router = useRouter();
  const [uan, setUan] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [prefilledFromDoc, setPrefilledFromDoc] = useState(false);

  // Carried over from /claim when a UAN was extracted from an uploaded
  // document. Read via window.location instead of useSearchParams(): that
  // hook forces this whole page out of static prerendering (confirmed —
  // the shipped HTML went from fully server-rendered to a blank shell that
  // only fills in after JS hydrates, exactly the slow-connection regression
  // this project's own plan calls out as unacceptable). A plain effect
  // costs a one-frame-later fill-in instead, which is a fine trade.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("uan");
    if (fromUrl) {
      // Reading window.location during the initial render (instead of an
      // effect) would mismatch the static HTML rendered without a browser —
      // this has to run post-hydration. That's exactly the "synchronize
      // with an external system" case effects exist for, not a derived-
      // state anti-pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUan(fromUrl);
      setPrefilledFromDoc(true);
    }
  }, []);

  // CITIZENS.length (50), not a smaller cap — the heading below promises
  // "the full mock database" and the list is already in a scrollable,
  // fixed-height container, so there's no reason to silently truncate it.
  const results = useMemo(() => searchCitizens(query, CITIZENS.length), [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const citizen = CITIZENS.find((c) => c.uan === uan.trim());
    if (!citizen) {
      setError("No demo profile found for that UAN. Try one of the profiles below.");
      return;
    }
    if (citizen.password !== password) {
      setError("Incorrect password for this demo profile.");
      return;
    }
    router.push(`/preflight/${citizen.uan}`);
  }

  function fillCredentials(u: string, p: string) {
    setUan(u);
    setPassword(p);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Pre-flight check</h1>
      <p className="mt-2 text-sm text-slate-600">
        Mock UAN login — this pulls a simulated EPFO record, not a real one. No real credentials
        are collected or stored anywhere. Every account below uses password{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">demo123</code>.
      </p>
      {prefilledFromDoc && (
        <p className="mt-2 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
          UAN prefilled from the document you uploaded on the guided-claim page — just add the
          password.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-md border border-slate-200 bg-white p-6">
        <div>
          <label htmlFor="uan" className="block text-sm font-medium text-slate-700">
            UAN
          </label>
          <input
            id="uan"
            value={uan}
            onChange={(e) => setUan(e.target.value)}
            placeholder="12-digit UAN"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            inputMode="numeric"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo123"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Log in and run check
        </button>
      </form>

      <div className="mt-8">
        <p className="text-sm font-medium text-slate-700">Featured demo profiles:</p>
        <p className="text-xs text-slate-500">One per failure mode called out in the project plan.</p>
        <div className="mt-2 grid gap-2">
          {FEATURED.map((c) => (
            <button
              key={c.id}
              onClick={() => fillCredentials(c.uan, c.password)}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-brand-400"
            >
              <span>
                <span className="font-medium text-slate-900">{c.label}</span>
                <span className="text-slate-500"> — {c.failureMode}</span>
              </span>
              <span className="font-mono text-xs text-slate-400">{c.uan}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-slate-700">
          Browse the full mock database ({CITIZENS.length} synthetic profiles):
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or UAN..."
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <div className="mt-2 max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200 bg-white">
          {results.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-400">No profiles match that search.</p>
          )}
          {results.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <button onClick={() => fillCredentials(c.uan, c.password)} className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-slate-900">{c.displayName}</p>
                <p className="truncate text-xs text-slate-500">
                  {c.failureMode} &middot; <span className="font-mono">{c.uan}</span>
                </p>
              </button>
              <div className="flex shrink-0 gap-2 text-xs">
                <a
                  href={`/api/mock-documents/${c.uan}/uan-card.png`}
                  download
                  className="text-brand-700 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  UAN card
                </a>
                <a
                  href={`/api/mock-documents/${c.uan}/passbook.png`}
                  download
                  className="text-brand-700 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Passbook
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Click a row to fill in its login above. {SYNTHETIC_CITIZENS.length} of these{" "}
          {CITIZENS.length} are generated from a seeded deterministic model (random name/date/KYC
          combinations); the 5 featured above are hand-authored, not generated — see{" "}
          <a href="/mocked" className="underline">what&apos;s real, what&apos;s mocked</a>.
        </p>
      </div>
    </div>
  );
}
