// Shared IFSC-prefix -> mock bank name lookup and branch derivation, used by
// both the citizen generator (to build plausible-looking IFSCs) and the
// mock document renderer (to print a bank name/branch on a passbook without
// storing that as separate, redundant fields on every citizen record).

export const IFSC_BANKS: { prefix: string; name: string }[] = [
  { prefix: "SBIN", name: "State Bank of India (mock)" },
  { prefix: "HDFC", name: "HDFC Bank (mock)" },
  { prefix: "ICIC", name: "ICICI Bank (mock)" },
  { prefix: "PUNB", name: "Punjab National Bank (mock)" },
  { prefix: "UTIB", name: "Axis Bank (mock)" },
  { prefix: "KKBK", name: "Kotak Mahindra Bank (mock)" },
  { prefix: "CNRB", name: "Canara Bank (mock)" },
  { prefix: "UBIN", name: "Union Bank of India (mock)" },
];

const FALLBACK_BANK_NAME = "Partner Bank (mock)";

export function bankNameForIfsc(ifsc: string): string {
  const prefix = ifsc.slice(0, 4).toUpperCase();
  return IFSC_BANKS.find((b) => b.prefix === prefix)?.name ?? FALLBACK_BANK_NAME;
}

export const BRANCHES = [
  "Koramangala Branch", "Indiranagar Branch", "Andheri West Branch", "Salt Lake Branch",
  "Anna Nagar Branch", "Banjara Hills Branch", "Vashi Branch", "Gomti Nagar Branch",
  "Sector 18 Branch", "MG Road Branch", "Civil Lines Branch", "Whitefield Branch",
];

/** Deterministic branch pick from a UAN, so the same citizen always gets the same branch. */
export function branchForUan(uan: string): string {
  let sum = 0;
  for (let i = 0; i < uan.length; i++) sum += uan.charCodeAt(i);
  return BRANCHES[sum % BRANCHES.length];
}

function pad(n: number, width: number): string {
  return String(Math.floor(n)).padStart(width, "0");
}

/** Builds a plausible IFSC from a random bank; `valid` controls whether the
 * fixed 5th character is correctly "0" (real format) or corrupted (a
 * plausible data-entry error, used to seed some invalid-IFSC cases). */
export function randomIfsc(rng: () => number, valid: boolean): { ifsc: string; bankName: string } {
  const bank = IFSC_BANKS[Math.floor(rng() * IFSC_BANKS.length) % IFSC_BANKS.length];
  const branchCode = pad(rng() * 999999, 6);
  const ifsc = valid ? `${bank.prefix}0${branchCode}` : `${bank.prefix}${1 + Math.floor(rng() * 9)}${branchCode}`;
  return { ifsc, bankName: bank.name };
}
