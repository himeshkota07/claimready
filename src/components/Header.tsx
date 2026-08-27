import Link from "next/link";

const NAV_LINKS = [
  { href: "/preflight", label: "Pre-flight check" },
  { href: "/claim", label: "Guided claim" },
  { href: "/decoder", label: "Rejection decoder" },
  { href: "/insights", label: "Insights" },
  { href: "/mocked", label: "What's real" },
];

export function Header() {
  return (
    <header className="print:hidden border-b-4 border-brand-700 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-brand-900">ClaimReady</span>
          <span className="hidden text-xs uppercase tracking-wide text-slate-500 sm:inline">
            EPFO PF Claim Pre-Flight Service
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded px-2.5 py-1.5 font-medium text-brand-800 transition hover:bg-brand-50 hover:text-brand-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
