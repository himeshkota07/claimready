// Deterministic rules engine. No LLM calls anywhere in this file.
// Eligibility thresholds are simplified from publicly published EPF
// Scheme 1952 / EPS 1995 provisions (Form 19 / 10C / 31). See /mocked.

import { CitizenProfile, ClaimForm, PreflightResult, Severity, ValidationIssue } from "./types";
import { nameMatchScore, nameMatchSeverity } from "./name-match";

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UAN_REGEX = /^\d{12}$/;

function monthsSince(dateIso: string, reference: Date): number {
  const d = new Date(dateIso);
  return (
    (reference.getFullYear() - d.getFullYear()) * 12 +
    (reference.getMonth() - d.getMonth())
  );
}

function ageAt(dob: string, reference: Date): number {
  const d = new Date(dob);
  let age = reference.getFullYear() - d.getFullYear();
  const monthDiff = reference.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

function severityRank(s: Severity): number {
  return s === "red" ? 2 : s === "amber" ? 1 : 0;
}

function worstOf(issues: ValidationIssue[]): Severity {
  return issues.reduce<Severity>(
    (worst, issue) => (severityRank(issue.severity) > severityRank(worst) ? issue.severity : worst),
    "green"
  );
}

export function determineEligibleForm(citizen: CitizenProfile, now: Date): {
  form: ClaimForm | null;
  reasoning: string;
} {
  const { record } = citizen;

  if (citizen.desiredClaim === "31") {
    return {
      form: "31",
      reasoning:
        "Requested as a partial/advance withdrawal (Form 31) — service length and category-specific rules apply, checked separately from final settlement.",
    };
  }

  const age = ageAt(record.dob, now);
  const retiredByAge = age >= 58;
  const unemployedMonths = record.dateOfExit ? monthsSince(record.dateOfExit, now) : 0;
  const unemployedEnough = record.dateOfExit !== null && unemployedMonths >= 2;

  if (!record.dateOfExit) {
    return {
      form: null,
      reasoning:
        "No date of exit is on record yet. Final settlement (Form 19) needs a marked exit date, and it normally becomes claimable 2 months after that date (waived at retirement, permanent migration, or if the establishment has closed).",
    };
  }

  if (!unemployedEnough && !retiredByAge) {
    const monthsLeft = Math.max(0, 2 - unemployedMonths);
    return {
      form: null,
      reasoning: `Exit is marked, but final settlement (Form 19) is normally payable only after 2 months of unemployment. About ${monthsLeft} more month(s) to go, unless this exit was for retirement, permanent migration abroad, or establishment closure.`,
    };
  }

  if (record.serviceYears < 10) {
    return {
      form: "19",
      reasoning:
        "Eligible for final PF settlement (Form 19). Since contributory service is under 10 years, the EPS pension portion is claimable as a lump sum via Form 10C rather than a monthly pension.",
    };
  }

  return {
    form: "19",
    reasoning:
      "Eligible for final PF settlement (Form 19). Because contributory service has crossed 10 years, EPS pension is preserved (scheme certificate) rather than paid out as a Form 10C lump sum — a monthly pension applies from age 58 instead.",
  };
}

export function runPreflightCheck(citizen: CitizenProfile, now: Date = new Date()): PreflightResult {
  const { record } = citizen;
  const issues: ValidationIssue[] = [];

  // --- Name-match scoring (deterministic fuzzy match) ---
  const aadhaarVsEpfo = nameMatchScore(record.nameOnAadhaar, record.nameOnEpfo);
  const bankVsEpfo = nameMatchScore(record.nameOnBank, record.nameOnEpfo);

  const worstNameScore = Math.min(aadhaarVsEpfo, bankVsEpfo);
  const nameSeverity = nameMatchSeverity(worstNameScore);
  if (nameSeverity !== "green") {
    const mismatchedWith =
      aadhaarVsEpfo <= bankVsEpfo
        ? `Aadhaar ("${record.nameOnAadhaar}")`
        : `bank account ("${record.nameOnBank}")`;
    issues.push({
      id: "name-mismatch",
      severity: nameSeverity,
      field: "name",
      plainReason: `The name on your EPFO record ("${record.nameOnEpfo}") does not closely match your ${mismatchedWith}. EPFO's own list of common rejection causes includes name mismatch as a top reason.`,
      whoFixes: "you",
      steps:
        nameSeverity === "red"
          ? [
              "File a Joint Declaration (with your employer) to correct the name on the EPFO record, OR",
              "Update the name on your Aadhaar/bank record to match EPFO exactly via UIDAI/your bank",
              "Re-run this check after the correction is reflected (usually 3-7 working days)",
            ]
          : [
              "Double check for spelling differences, initials, or a dropped middle name",
              "If it's a minor variation (e.g. initials vs full name), attach a supporting ID as backup — many field offices accept this without a formal correction",
            ],
      docsNeeded: nameSeverity === "red" ? ["Joint Declaration form", "Aadhaar copy", "PAN or another photo ID"] : ["Any government photo ID showing the full name"],
      estTime: nameSeverity === "red" ? "5-10 working days" : "No delay if backup ID is attached",
    });
  }

  // --- IFSC validity ---
  if (!IFSC_REGEX.test(record.bankIfsc)) {
    issues.push({
      id: "invalid-ifsc",
      severity: "red",
      field: "bank_ifsc",
      plainReason: `The IFSC code on file ("${record.bankIfsc}") is not in a valid format. A valid IFSC is 11 characters: 4 letters (bank code), then "0", then 6 letters/digits (branch code).`,
      whoFixes: "you",
      steps: [
        "Open your bank passbook or netbanking and copy the exact IFSC printed there",
        "Update your bank KYC on the EPFO member portal (or ask your employer to update it via the employer portal)",
        "Re-verify — bank KYC approval by employer/field office typically takes a few days",
      ],
      docsNeeded: ["Bank passbook first page or a cancelled cheque"],
      estTime: "2-5 working days",
    });
  }

  // --- UAN format sanity (defensive; login already validated this in practice) ---
  if (!UAN_REGEX.test(record.uan)) {
    issues.push({
      id: "invalid-uan",
      severity: "red",
      field: "uan",
      plainReason: "UAN must be exactly 12 digits.",
      whoFixes: "field_office",
      steps: ["Contact your regional EPFO field office to verify your UAN allotment"],
      docsNeeded: ["Aadhaar", "Any previous PF-related communication"],
      estTime: "Varies",
    });
  }

  // --- Bank KYC seeding ---
  if (!record.bankSeeded) {
    issues.push({
      id: "bank-not-seeded",
      severity: "amber",
      field: "bank_kyc",
      plainReason: "Your bank account is on record but has not been digitally KYC-approved yet — this approval step is what lets EPFO transfer the money.",
      whoFixes: "employer",
      steps: [
        "Ask your employer (or the field office, if you're no longer employed there) to approve your bank KYC on the EPFO employer portal",
        "This is a one-click approval on their end once the account details are correct",
      ],
      docsNeeded: [],
      estTime: "1-3 working days once requested",
    });
  }

  // --- Aadhaar KYC ---
  if (!record.aadhaarLinked || !record.aadhaarVerified) {
    issues.push({
      id: "aadhaar-kyc-incomplete",
      severity: "red",
      field: "aadhaar_kyc",
      plainReason: "Aadhaar is not linked and OTP-verified on your EPFO profile. This is required KYC and is one of the most common reasons claims are returned.",
      whoFixes: "you",
      steps: [
        "Log in to the EPFO member portal and go to Manage > KYC",
        "Enter your Aadhaar number and complete OTP verification",
        "Wait for employer digital approval of the KYC entry",
      ],
      docsNeeded: ["Aadhaar number", "Mobile number linked to Aadhaar (for OTP)"],
      estTime: "Same day for you; 2-4 days for employer approval",
    });
  }

  // --- PAN linkage (affects TDS, not eligibility, but flagged if service < 5 years) ---
  if (!record.panLinked && record.serviceYears < 5) {
    issues.push({
      id: "pan-not-linked",
      severity: "amber",
      field: "pan_kyc",
      plainReason: "PAN is not linked. Since your contributory service is under 5 years, withdrawal is taxable and TDS is deducted at a much higher rate without PAN on file.",
      whoFixes: "you",
      steps: [
        "Link PAN under Manage > KYC on the EPFO member portal",
        "Wait for employer digital approval",
      ],
      docsNeeded: ["PAN card"],
      estTime: "2-4 working days",
    });
  }

  // --- Employer exit approval / date of exit ---
  if (!record.dateOfExit || !record.employerApprovedExit) {
    issues.push({
      id: "exit-not-approved",
      severity: "red",
      field: "date_of_exit",
      plainReason: !record.dateOfExit
        ? "Your date of exit has not been marked on the EPFO record at all."
        : "Your date of exit is marked but your employer has not digitally approved it yet. Final settlement cannot be processed until this approval is in place.",
      whoFixes: "employer",
      steps: [
        "Ask your (former) employer's HR/PF admin to mark and approve your date of exit on the EPFO employer portal",
        "If the employer is unresponsive, you can request the field office to mark it based on other evidence (relieving letter, last salary slip) after 2 months from the actual exit date",
      ],
      docsNeeded: ["Relieving letter or last working day proof, if escalating to the field office"],
      estTime: "Employer: 1-3 days if responsive. Field office escalation: 15-20 days",
    });
  }

  const { form, reasoning } = determineEligibleForm(citizen, now);

  // If eligibility itself fails (e.g. no exit date, waiting period), that's the top-line issue.
  const eligibilityBlocking = form === null;
  const overall: Severity = eligibilityBlocking ? "red" : worstOf(issues);

  return {
    overall,
    eligibleForm: form,
    formReasoning: reasoning,
    issues,
    nameMatch: { aadhaarVsEpfo, bankVsEpfo },
  };
}
