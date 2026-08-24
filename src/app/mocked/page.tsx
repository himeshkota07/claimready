import { aiIsConfigured } from "@/lib/ai";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
    </div>
  );
}

export default function MockedPage() {
  const aiLive = aiIsConfigured();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">What&apos;s real, what&apos;s mocked</h1>
      <p className="mt-2 text-sm text-slate-600">
        Full disclosure, not a footnote. Everything below is accurate as of this build.
      </p>

      <Section title="What's real">
        <ul className="list-disc space-y-2 pl-4">
          <li>
            The deterministic rules engine (name-match fuzzy scoring, UAN/IFSC format validation,
            KYC-completeness checks, Form 19 / 10C / 31 eligibility logic) runs real code against
            whatever record it&apos;s given — nothing about the checking logic itself is faked.
          </li>
          <li>
            Eligibility thresholds (2-month unemployment wait for final settlement, the 10-year
            EPS service cutoff, advance-category service minimums) are taken from the publicly
            published EPF Scheme 1952 / EPS 1995 provisions, cross-checked against public
            secondary sources. They are simplified for a 5-day build and have not been verified
            against internal EPFO circulars — treat exact day-counts as approximate.
          </li>
          <li>
            The rejection reason strings in the decoder are paraphrased from patterns reported on
            public forums, plus the official list of rejection causes read into the record by the
            Minister of State for Labour and Employment in a written Lok Sabha reply
            (9 March 2026, responding to MP Asaduddin Owaisi). No individual&apos;s claim data is used.
          </li>
          <li>
            The OpenAI integration is real and server-side only (API key never reaches the
            browser).{" "}
            <strong>
              {aiLive
                ? "It is currently live on this deployment."
                : "It is not configured on this deployment right now, so every AI-shaped feature below is running its deterministic fallback template instead — the UI labels every response with which one ran."}
            </strong>
          </li>
          <li>
            The Hindi/Kannada language toggle on the rejection decoder only actually translates
            when a live OpenAI key is configured. Without one, it returns English regardless of
            the language selected, and the page says so inline rather than silently
            mistranslating.
          </li>
        </ul>
      </Section>

      <Section title="What's mocked">
        <ul className="list-disc space-y-2 pl-4">
          <li>
            <strong>Login is not real authentication.</strong> The &quot;UAN login&quot; on the
            pre-flight check page matches against five fictional citizen profiles seeded in code.
            No real UAN, password, or session exists anywhere.
          </li>
          <li>
            <strong>Every citizen record is synthetic.</strong> Names, dates, account numbers, and
            IFSC codes are invented for this demo. No real Aadhaar, PAN, bank, or health data is
            used anywhere in this project.
          </li>
          <li>
            <strong>There is no database.</strong> All records are plain seeded data in the
            codebase. Nothing is written back or persisted.
          </li>
          <li>
            <strong>Document upload does not verify a real ID.</strong> With no OpenAI key
            configured, any image you upload returns the same fixed mock extraction — it is not
            reading your file. With a key configured, it genuinely runs vision extraction on
            whatever image is uploaded, but still against a mock passbook/UAN-card format, not a
            live EPFO document store.
          </li>
          <li>
            <strong>Nothing here submits a real claim.</strong> This tool ends at &quot;here is
            what to fix and which form applies&quot; — it does not file anything with EPFO, and
            it never will without EPFO&apos;s own integration.
          </li>
          <li>
            <strong>This is not an EPFO product.</strong> ClaimReady is an independent hackathon
            prototype, not affiliated with, endorsed by, or built in partnership with EPFO or the
            Government of India.
          </li>
        </ul>
      </Section>

      <Section title="The population and rejection statistics cited in the pitch">
        <p>
          Figures like the ~26% claim rejection rate, the 11.92% final-settlement rejection rate,
          and the ~20 lakh annual EPFiGMS grievances are drawn from the EPFO Annual Report (via
          FACTLY&apos;s published analysis), Business Standard&apos;s reporting on EPFO&apos;s own
          return/rejection breakdown, and the Lok Sabha reply cited above. They describe the real
          national system ClaimReady argues for — they are not generated by, or verified inside,
          this prototype.
        </p>
      </Section>
    </div>
  );
}
