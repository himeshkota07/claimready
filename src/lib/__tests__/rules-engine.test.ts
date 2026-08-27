// Regression tests for rules-engine.ts. Nearly every real bug found during
// this project's manual testing lived here (a Form 31 false-positive, a
// calendar-math date bug, a self-contradicting "nothing to fix" page) --
// these pin down the fixes so a future edit can't silently reintroduce them.

import { describe, expect, it } from "vitest";
import { runPreflightCheck } from "../rules-engine";
import { CitizenProfile, EpfoRecord } from "../types";

const NOW = new Date("2026-08-27");

function cleanRecord(overrides: Partial<EpfoRecord> = {}): EpfoRecord {
  return {
    uan: "999999999901",
    nameOnEpfo: "Clean Person",
    nameOnAadhaar: "Clean Person",
    nameOnBank: "Clean Person",
    dob: "1985-01-01",
    dateOfJoining: "2015-01-01",
    dateOfExit: "2026-06-01", // ~3 months before NOW
    employerApprovedExit: true,
    serviceYears: 11,
    aadhaarLinked: true,
    aadhaarVerified: true,
    panLinked: true,
    bankAccountNumber: "12345678901",
    bankIfsc: "SBIN0001234",
    bankSeeded: true,
    epsMemberSince: "2015-01-01",
    mobile: "9800XXXX21",
    ...overrides,
  };
}

function citizen(overrides: Partial<CitizenProfile> = {}, recordOverrides: Partial<EpfoRecord> = {}): CitizenProfile {
  return {
    id: "test",
    label: "Test",
    displayName: "Clean Person",
    failureMode: "",
    uan: "999999999901",
    password: "x",
    desiredClaim: "19",
    record: cleanRecord(recordOverrides),
    ...overrides,
  };
}

describe("a fully clean record", () => {
  it("passes with zero issues and eligibleForm set", () => {
    const result = runPreflightCheck(citizen(), NOW);
    expect(result.overall).toBe("green");
    expect(result.issues).toHaveLength(0);
    expect(result.eligibleForm).toBe("19");
  });
});

describe("Form 31 (advance) — regression for the exit-approval false positive", () => {
  it("never raises exit-not-approved, even with no exit date at all", () => {
    const c = citizen(
      { desiredClaim: "31", advanceCategory: "medical" },
      { dateOfExit: null, employerApprovedExit: false }
    );
    const result = runPreflightCheck(c, NOW);
    expect(result.issues.find((i) => i.id === "exit-not-approved")).toBeUndefined();
  });

  it("rejects when service falls short of the category minimum", () => {
    const c = citizen(
      { desiredClaim: "31", advanceCategory: "marriage" }, // needs 7 years
      { dateOfExit: null, employerApprovedExit: false, serviceYears: 3 }
    );
    const result = runPreflightCheck(c, NOW);
    expect(result.eligibleForm).toBeNull();
    expect(result.overall).toBe("red");
  });

  it("accepts when service meets the category minimum", () => {
    const c = citizen(
      { desiredClaim: "31", advanceCategory: "marriage" },
      { dateOfExit: null, employerApprovedExit: false, serviceYears: 8 }
    );
    const result = runPreflightCheck(c, NOW);
    expect(result.eligibleForm).toBe("31");
  });

  it("medical advance needs no minimum service at all", () => {
    const c = citizen(
      { desiredClaim: "31", advanceCategory: "medical" },
      { dateOfExit: null, employerApprovedExit: false, serviceYears: 0.5 }
    );
    const result = runPreflightCheck(c, NOW);
    expect(result.eligibleForm).toBe("31");
  });
});

describe("the 2-month unemployment wait — day-precision regression", () => {
  it("is NOT satisfied at 32 days (naive month-field math would say '2 months')", () => {
    // Naive calendar-field subtraction (year*12+month diff only) would call
    // 2026-07-26 -> 2026-08-27 "1 month" correctly here, but breaks right at
    // a month-end boundary -- see the exact case documented in
    // rules-engine.ts's monthsSince() comment. This pins the real check:
    // 32 days is short of the 2-month wait regardless of which months they
    // span.
    const c = citizen({}, { dateOfExit: "2026-07-26", employerApprovedExit: true });
    const result = runPreflightCheck(c, new Date("2026-08-27"));
    expect(result.eligibleForm).toBeNull();
  });

  it("IS satisfied at exactly 2 calendar months", () => {
    const c = citizen({}, { dateOfExit: "2026-06-27", employerApprovedExit: true });
    const result = runPreflightCheck(c, new Date("2026-08-27"));
    expect(result.eligibleForm).toBe("19");
  });
});

describe("name mismatch — independent reporting regression", () => {
  it("reports both Aadhaar and bank mismatches when both diverge", () => {
    const c = citizen(
      {},
      { nameOnAadhaar: "Totally Different Name", nameOnBank: "Another Wrong Name" }
    );
    const result = runPreflightCheck(c, NOW);
    const ids = result.issues.map((i) => i.id);
    expect(ids).toContain("name-mismatch-aadhaar");
    expect(ids).toContain("name-mismatch-bank");
  });

  it("reports only the field that actually mismatches", () => {
    const c = citizen({}, { nameOnBank: "Someone Else Entirely" });
    const result = runPreflightCheck(c, NOW);
    const ids = result.issues.map((i) => i.id);
    expect(ids).toContain("name-mismatch-bank");
    expect(ids).not.toContain("name-mismatch-aadhaar");
  });
});

describe("self-contradiction regression: overall red must always have an explanation", () => {
  it("waiting-period block produces an itemized issue, not an empty list", () => {
    const c = citizen({}, { dateOfExit: "2026-08-01", employerApprovedExit: true }); // < 2 months
    const result = runPreflightCheck(c, NOW);
    expect(result.overall).toBe("red");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.find((i) => i.id === "not-yet-eligible")).toBeDefined();
  });

  it("advance-category shortfall produces an itemized issue, not an empty list", () => {
    const c = citizen(
      { desiredClaim: "31", advanceCategory: "home_loan" }, // needs 10 years
      { serviceYears: 2 }
    );
    const result = runPreflightCheck(c, NOW);
    expect(result.overall).toBe("red");
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("does not duplicate when exit-not-approved already covers the blocking reason", () => {
    const c = citizen({}, { dateOfExit: null, employerApprovedExit: false });
    const result = runPreflightCheck(c, NOW);
    const notYetEligible = result.issues.filter((i) => i.id === "not-yet-eligible");
    expect(notYetEligible).toHaveLength(0); // exit-not-approved already explains it
    expect(result.issues.find((i) => i.id === "exit-not-approved")).toBeDefined();
  });
});

describe("field validation", () => {
  it("flags an IFSC with the wrong 5th character", () => {
    const c = citizen({}, { bankIfsc: "SBIN1001234" }); // must be "0" at index 4
    const result = runPreflightCheck(c, NOW);
    expect(result.issues.find((i) => i.id === "invalid-ifsc")).toBeDefined();
  });

  it("accepts a validly-shaped IFSC with letters in the branch code", () => {
    const c = citizen({}, { bankIfsc: "SBIN0RRB001" });
    const result = runPreflightCheck(c, NOW);
    expect(result.issues.find((i) => i.id === "invalid-ifsc")).toBeUndefined();
  });

  it("flags missing Aadhaar KYC", () => {
    const c = citizen({}, { aadhaarLinked: false, aadhaarVerified: false });
    const result = runPreflightCheck(c, NOW);
    expect(result.issues.find((i) => i.id === "aadhaar-kyc-incomplete")).toBeDefined();
  });

  it("flags PAN missing only when service is under 5 years", () => {
    const shortService = citizen({}, { panLinked: false, serviceYears: 3 });
    expect(runPreflightCheck(shortService, NOW).issues.find((i) => i.id === "pan-not-linked")).toBeDefined();

    const longService = citizen({}, { panLinked: false, serviceYears: 8 });
    expect(runPreflightCheck(longService, NOW).issues.find((i) => i.id === "pan-not-linked")).toBeUndefined();
  });
});
