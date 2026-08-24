// Rejection reason strings, paraphrased from patterns commonly reported on
// public forums (Reddit r/IndiaInvestments, TeamBHP, quora threads) and from
// the official rejection-cause list cited in the Lok Sabha reply (9 Mar 2026,
// MoS Labour & Employment) to MP Asaduddin Owaisi's question. No personal
// data — every string below is a generic pattern, not a specific person's claim.

export interface RejectionSample {
  id: string;
  raw: string;
}

export const REJECTION_SAMPLES: RejectionSample[] = [
  { id: "r1", raw: "Name not matching as per records" },
  { id: "r2", raw: "DOJ/DOE not correct" },
  { id: "r3", raw: "Form not signed by authorized signatory" },
  { id: "r4", raw: "UAN not KYC-verified / Aadhaar not verified" },
  { id: "r5", raw: "Bank details/IFSC code do not match" },
  { id: "r6", raw: "Date of exit not updated by employer" },
  { id: "r7", raw: "Signature mismatch" },
  { id: "r8", raw: "Claim already settled / duplicate claim" },
  { id: "r9", raw: "Member ID mentioned in the claim is incorrect" },
  { id: "r10", raw: "Cheque/passbook copy not clear or not attached" },
  { id: "r11", raw: "Death certificate / legal heir certificate not submitted" },
  { id: "r12", raw: "Contribution details under verification, discrepancy found" },
];
