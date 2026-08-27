// Powers the "mark as fixed, watch it turn green" toggle on pre-flight
// results. Given an issue id, returns a *cloned* citizen with the
// underlying record field(s) that issue depends on patched to a passing
// state — then the caller re-runs the real runPreflightCheck on that
// clone. This isn't cosmetic (just hiding the issue card): it re-derives
// eligibility too, so fixing "exit not approved" can genuinely flip
// eligibleForm from null to "19", the same way it would for a real record.

import { CitizenProfile } from "./types";
import { ADVANCE_MIN_SERVICE_YEARS } from "./rules-engine";

function monthsAgoIso(months: number, now: Date): string {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function applyIssueFix(citizen: CitizenProfile, issueId: string, now: Date = new Date()): CitizenProfile {
  const record = { ...citizen.record };

  switch (issueId) {
    case "name-mismatch-aadhaar":
      record.nameOnAadhaar = record.nameOnEpfo;
      break;
    case "name-mismatch-bank":
      record.nameOnBank = record.nameOnEpfo;
      break;
    case "invalid-ifsc":
      record.bankIfsc = "SBIN0001234";
      break;
    case "invalid-uan":
      // Defensive/near-unreachable in practice (login already validates
      // UAN format) — nothing meaningful to simulate fixing.
      break;
    case "bank-not-seeded":
      record.bankSeeded = true;
      break;
    case "aadhaar-kyc-incomplete":
      record.aadhaarLinked = true;
      record.aadhaarVerified = true;
      break;
    case "pan-not-linked":
      record.panLinked = true;
      break;
    case "exit-not-approved":
      if (!record.dateOfExit) record.dateOfExit = monthsAgoIso(3, now);
      record.employerApprovedExit = true;
      break;
    case "not-yet-eligible":
      // Covers two distinct blocking reasons — apply both patches; only
      // the one that actually applies to this citizen has any effect.
      if (citizen.desiredClaim !== "31") {
        record.dateOfExit = monthsAgoIso(3, now);
        record.employerApprovedExit = true;
      } else {
        const required = ADVANCE_MIN_SERVICE_YEARS[citizen.advanceCategory ?? "medical"];
        record.serviceYears = Math.max(record.serviceYears, required);
      }
      break;
    default:
      break;
  }

  return { ...citizen, record };
}

export function applyIssueFixes(citizen: CitizenProfile, issueIds: Set<string>, now: Date = new Date()): CitizenProfile {
  let patched = citizen;
  for (const id of issueIds) patched = applyIssueFix(patched, id, now);
  return patched;
}
