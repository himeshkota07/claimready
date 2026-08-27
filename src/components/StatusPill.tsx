import { Severity } from "@/lib/types";

const STYLES: Record<Severity, string> = {
  red: "bg-red-100 text-red-800 border-red-300",
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  green: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const LABELS: Record<Severity, string> = {
  red: "Will be rejected",
  amber: "Needs attention",
  green: "Looks good",
};

export function StatusPill({ severity, label }: { severity: Severity; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${STYLES[severity]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {label ?? LABELS[severity]}
    </span>
  );
}
