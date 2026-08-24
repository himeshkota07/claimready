import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        EPFO PF withdrawal claims
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
        You wait 20 days for a claim decision. Find out what will fail{" "}
        <span className="text-blue-700">before</span> you submit.
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Around 1 in 4 PF claims get returned or rejected — most for fixable paperwork issues,
        not because the person wasn&apos;t eligible. ClaimReady checks your record against the
        same things EPFO checks, upfront, so you know exactly what to fix and who has to fix it.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/preflight"
          className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <span className="text-2xl">🔍</span>
          <h2 className="mt-3 text-xl font-semibold text-slate-900 group-hover:text-blue-700">
            Will my claim get rejected?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Log in with your UAN and run a pre-flight check before you file. Catch name
            mismatches, bad IFSC codes, missing KYC, and unapproved exits now.
          </p>
          <span className="mt-4 text-sm font-medium text-blue-700">Run the check &rarr;</span>
        </Link>

        <Link
          href="/decoder"
          className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <span className="text-2xl">📄</span>
          <h2 className="mt-3 text-xl font-semibold text-slate-900 group-hover:text-blue-700">
            My claim was rejected — why?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Paste the cryptic rejection reason you got. Get a plain-language explanation, who
            needs to fix it, and the exact steps to resubmit successfully.
          </p>
          <span className="mt-4 text-sm font-medium text-blue-700">Decode it &rarr;</span>
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/claim" className="text-slate-600 underline hover:text-slate-900">
          Or start a guided claim from scratch &rarr;
        </Link>
      </div>

      <p className="mt-12 text-xs text-slate-400">
        This is an independent hackathon prototype and not an official EPFO product. All citizen
        records shown are synthetic.{" "}
        <Link href="/mocked" className="underline">
          Full disclosure here.
        </Link>
      </p>
    </div>
  );
}
