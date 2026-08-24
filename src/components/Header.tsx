import Link from "next/link";

const NAV_LINKS = [
  { href: "/preflight", label: "Pre-flight check" },
  { href: "/claim", label: "Guided claim" },
  { href: "/decoder", label: "Rejection decoder" },
  { href: "/mocked", label: "What's real" },
];

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">ClaimReady</span>
          <span className="hidden text-xs text-slate-500 sm:inline">for EPFO PF claims</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
