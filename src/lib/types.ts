// Core domain types for ClaimReady.
// EPF rule thresholds here are simplified from the publicly published
// EPF Scheme 1952 / EPS 1995 provisions (Form 19 / 10C / 31 eligibility).
// See /mocked for exactly what is real vs simplified for the demo.

export type ClaimForm = "19" | "10C" | "31";

export type Severity = "red" | "amber" | "green";

export type WhoFixes = "you" | "employer" | "field_office";

export interface EpfoRecord {
  uan: string;
  nameOnEpfo: string;
  nameOnAadhaar: string;
  nameOnBank: string;
  dob: string; // ISO date
  dateOfJoining: string; // ISO date
  dateOfExit: string | null; // ISO date, null if not marked
  employerApprovedExit: boolean;
  serviceYears: number; // total contributory service, in years (decimal)
  aadhaarLinked: boolean;
  aadhaarVerified: boolean;
  panLinked: boolean;
  bankAccountNumber: string;
  bankIfsc: string;
  bankSeeded: boolean; // bank account KYC-approved by employer/field office
  epsMemberSince: string | null; // ISO date, null if not an EPS member
  mobile: string; // registered mobile, partly masked — used on generated mock documents
}

export interface CitizenProfile {
  id: string;
  label: string; // e.g. "Citizen A"
  displayName: string;
  failureMode: string;
  uan: string;
  password: string; // mock login only
  record: EpfoRecord;
  desiredClaim: ClaimForm | "unemployment_advance";
}

export interface ValidationIssue {
  id: string;
  severity: Severity;
  field: string;
  plainReason: string;
  whoFixes: WhoFixes;
  steps: string[];
  docsNeeded: string[];
  estTime: string;
}

export interface PreflightResult {
  overall: Severity;
  eligibleForm: ClaimForm | null;
  formReasoning: string;
  issues: ValidationIssue[];
  nameMatch: {
    aadhaarVsEpfo: number;
    bankVsEpfo: number;
  };
}

export interface RejectionDecoderInput {
  rawText: string;
  language: "en" | "hi" | "kn";
}

export interface RejectionDecoderOutput {
  plainReason: string;
  whoMustFix: WhoFixes;
  exactSteps: string[];
  docsNeeded: string[];
  estTime: string;
  language: "en" | "hi" | "kn";
}

export type Language = "en" | "hi" | "kn";
