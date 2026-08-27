// Deterministic synthetic citizen generator. Seeded PRNG so the "database"
// is stable across builds/deploys instead of reshuffling on every request,
// but it's genuinely generated data — combinations of name mismatches,
// invalid IFSCs, missing KYC, and unapproved exits are rolled per record,
// not individually authored. All names/numbers are fictional.

import { AdvanceCategory, CitizenProfile, EpfoRecord, ClaimForm } from "./types";
import { randomIfsc } from "./bank-lookup";

const ADVANCE_CATEGORIES: AdvanceCategory[] = ["medical", "education", "marriage", "housing", "home_loan"];

// mulberry32 — small, fast, deterministic PRNG from a numeric seed.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Anita", "Vikram", "Deepa", "Manoj", "Kavita", "Rahul", "Sunita", "Arvind",
  "Meena", "Sanjay", "Pooja", "Ajay", "Lakshmi", "Vijay", "Neha", "Rakesh",
  "Shalini", "Prakash", "Divya", "Naveen", "Geeta", "Ashok", "Radha", "Kiran",
  "Swati", "Mahesh", "Anjali", "Ravi", "Padma", "Sunil", "Rekha", "Dinesh",
  "Farida", "Imran", "Nasreen", "Salim", "Tabassum", "Yusuf", "Ayesha",
  "Joseph", "Mary", "Thomas", "Anna", "George", "Susan", "Xavier", "Rose",
  "Harpreet", "Gurdeep", "Simran", "Jaspreet",
];

const SURNAMES = [
  "Sinha", "Gowda", "Nair", "Mehta", "Iyer", "Reddy", "Sharma", "Verma",
  "Patel", "Rao", "Kulkarni", "Joshi", "Menon", "Pillai", "Chatterjee",
  "Bose", "Desai", "Shetty", "Bhat", "Naidu", "Khan", "Sheikh", "Ansari",
  "D'Souza", "Fernandes", "Pinto", "Singh", "Kaur", "Chauhan", "Tiwari",
];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function pad(n: number, width: number): string {
  return String(Math.floor(n)).padStart(width, "0");
}

function dateFromDaysAgo(daysAgo: number, now: Date): string {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function yearsAgo(years: number, now: Date): string {
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function mangleName(rng: () => number, name: string): string {
  const parts = name.split(" ");
  const roll = rng();
  if (roll < 0.4 && parts.length > 1) {
    // Drop to initial, e.g. "Ramesh Kumar Sinha" -> "R K Sinha"
    return parts.map((p, i) => (i < parts.length - 1 ? p[0] : p)).join(" ");
  }
  if (roll < 0.7) {
    // Swap the first name for an unrelated one — a data-entry mixup.
    const other = pick(rng, FIRST_NAMES);
    return [other, ...parts.slice(1)].join(" ");
  }
  // Typo a letter in the surname.
  const last = parts[parts.length - 1];
  const idx = Math.floor(rng() * last.length);
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const typoed = last.slice(0, idx) + pick(rng, chars.split("")) + last.slice(idx + 1);
  return [...parts.slice(0, -1), typoed].join(" ");
}

const ADVANCE_MIN_SERVICE_YEARS: Record<AdvanceCategory, number> = {
  medical: 0,
  education: 7,
  marriage: 7,
  housing: 5,
  home_loan: 10,
};

function describeFailureMode(
  record: EpfoRecord,
  desiredClaim: ClaimForm,
  advanceCategory: AdvanceCategory | undefined
): string {
  const modes: string[] = [];
  if (record.nameOnAadhaar !== record.nameOnEpfo || record.nameOnBank !== record.nameOnEpfo) {
    modes.push("name mismatch");
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(record.bankIfsc)) modes.push("invalid IFSC");
  if (!record.aadhaarLinked || !record.aadhaarVerified) modes.push("KYC incomplete");
  // A Form 31 advance is claimed while still employed — no exit date needed,
  // so this only applies to final settlement / pension withdrawal.
  if (desiredClaim !== "31" && (!record.dateOfExit || !record.employerApprovedExit)) {
    modes.push("exit not approved");
  }
  if (desiredClaim === "31" && record.serviceYears < ADVANCE_MIN_SERVICE_YEARS[advanceCategory ?? "medical"]) {
    modes.push("insufficient service for advance category");
  }
  if (!record.bankSeeded) modes.push("bank KYC not seeded");
  if (modes.length === 0) return "Clean case — passes pre-flight";
  return modes.map((m) => m[0].toUpperCase() + m.slice(1)).join(", ");
}

export function generateSyntheticCitizens(count: number, seed: number, now: Date = new Date()): CitizenProfile[] {
  const rng = mulberry32(seed);
  const citizens: CitizenProfile[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = pick(rng, FIRST_NAMES);
    const surname = pick(rng, SURNAMES);
    const nameOnEpfo = `${firstName} ${surname}`;

    const uan = `10030${pad(1000 + i, 7)}`; // distinct range from the 5 curated profiles (100200300401-405)

    const ageYears = 24 + Math.floor(rng() * 35); // 24-58
    const dob = yearsAgo(ageYears, now);

    // Join date first — bounded by working age (18+) and a realistic career
    // span cap — then everything else (exit date, service years) derives
    // from it, instead of being rolled independently and risking a record
    // that's internally impossible (e.g. 15 years of service claimed only
    // 6 years after the recorded joining date).
    const maxCareerYears = Math.min(ageYears - 18, 20);
    const joiningYearsAgo = 1 + rng() * Math.max(0, maxCareerYears - 1);
    const dateOfJoining = yearsAgo(joiningYearsAgo, now);

    const hasExited = rng() < 0.65;
    let dateOfExit: string | null = null;
    if (hasExited) {
      // 0-13 months ago (some inside the 2-month wait), clamped so exit
      // never lands before the join date.
      const maxMonthsAgo = Math.max(1, Math.floor(joiningYearsAgo * 12) - 1);
      const monthsAgoExit = Math.min(Math.floor(rng() * 14), maxMonthsAgo);
      dateOfExit = dateFromDaysAgo(monthsAgoExit * 30, now);
    }
    const employerApprovedExit = hasExited ? rng() < 0.75 : false;

    const serviceEndMs = (dateOfExit ? new Date(dateOfExit) : now).getTime();
    const serviceYears = Math.round(((serviceEndMs - new Date(dateOfJoining).getTime()) / (365.25 * 86400000)) * 10) / 10;

    const aadhaarLinked = rng() < 0.85;
    const aadhaarVerified = aadhaarLinked && rng() < 0.9;
    const panLinked = rng() < 0.75;
    const bankSeeded = rng() < 0.75;

    const nameOnAadhaar = rng() < 0.85 ? nameOnEpfo : mangleName(rng, nameOnEpfo);
    const nameOnBank = rng() < 0.85 ? nameOnEpfo : mangleName(rng, nameOnEpfo);

    const { ifsc } = randomIfsc(rng, rng() < 0.88);
    const accountNumber = pad(rng() * 99999999999, 11);
    const mobile = `${pad(rng() * 10000, 4)}XXXX${pad(rng() * 100, 2)}`;

    const desiredClaimRoll = rng();
    const desiredClaim: ClaimForm = desiredClaimRoll < 0.55 ? "19" : desiredClaimRoll < 0.8 ? "31" : "10C";
    const advanceCategory: AdvanceCategory | undefined = desiredClaim === "31" ? pick(rng, ADVANCE_CATEGORIES) : undefined;

    const record: EpfoRecord = {
      uan,
      nameOnEpfo,
      nameOnAadhaar,
      nameOnBank,
      dob,
      dateOfJoining,
      dateOfExit,
      employerApprovedExit,
      serviceYears,
      aadhaarLinked,
      aadhaarVerified,
      panLinked,
      bankAccountNumber: accountNumber,
      bankIfsc: ifsc,
      bankSeeded,
      epsMemberSince: dateOfJoining,
      mobile,
    };

    citizens.push({
      id: `synth-${i}`,
      label: `Profile ${i + 1}`,
      displayName: nameOnEpfo,
      failureMode: describeFailureMode(record, desiredClaim, advanceCategory),
      uan,
      password: "demo123",
      desiredClaim,
      advanceCategory,
      record,
    });
  }

  return citizens;
}
