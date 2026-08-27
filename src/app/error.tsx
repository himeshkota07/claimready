"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">This page hit an error</h1>
      <p className="mt-4 text-slate-600">
        That&apos;s on this prototype, not on you. Try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-400"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
