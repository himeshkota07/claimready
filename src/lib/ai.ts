// Server-side only. Never import this file from a client component.
// Wraps the OpenAI model calls that require actual judgment:
//   - rejection decoder (bureaucratic string -> plain-language fix path)
//   - document vision extraction (mock passbook/UAN card -> structured fields)
//   - multilingual rendering of the above
//
// If OPENAI_API_KEY is not configured, every function below falls back to a
// deterministic keyword-matched template so the app stays fully demoable
// without a live key. The caller always gets `source: "openai" | "fallback"`
// so the UI can be honest about which one ran. See /mocked.

import OpenAI from "openai";
import { Language, RejectionDecoderOutput, WhoFixes } from "./types";

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export function aiIsConfigured(): boolean {
  return client !== null;
}

// A nullable-string field in a strict JSON schema (type: ["string", "null"])
// gives the model two ways to express "nothing here": return JSON null, or
// return the string "null" (a valid string, and a schema-satisfying escape
// hatch some completions reach for). Observed live in production output —
// the UI would render a literal "null" badge otherwise, on a schema that
// looks like it should have made that impossible.
function normalizeNullableString(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "" || trimmed === "null" || trimmed === "none" || trimmed === "n/a") return null;
  return value;
}

const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  kn: "Kannada (Kannada script)",
};

const DECODER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    plainReason: { type: "string" },
    whoMustFix: { type: "string", enum: ["you", "employer", "field_office"] },
    exactSteps: { type: "array", items: { type: "string" } },
    docsNeeded: { type: "array", items: { type: "string" } },
    estTime: { type: "string" },
  },
  required: ["plainReason", "whoMustFix", "exactSteps", "docsNeeded", "estTime"],
} as const;

interface DecodedShape {
  plainReason: string;
  whoMustFix: WhoFixes;
  exactSteps: string[];
  docsNeeded: string[];
  estTime: string;
}

// --- Fallback: keyword-matched templates, used when no API key is set ---
const FALLBACK_RULES: { match: RegExp; result: DecodedShape }[] = [
  {
    match: /name.*(not matching|mismatch)/i,
    result: {
      plainReason:
        "The name on your PF claim doesn't exactly match across your Aadhaar, bank account, and EPFO record. Even small differences (initials, spelling, a dropped middle name) trigger this.",
      whoMustFix: "you",
      exactSteps: [
        "Compare the name spelling on your Aadhaar, bank passbook, and EPFO profile side by side",
        "File a Joint Declaration with your employer to correct the EPFO record to match your Aadhaar",
        "Resubmit once the correction reflects (3-7 working days)",
      ],
      docsNeeded: ["Joint Declaration form", "Aadhaar copy", "A second photo ID"],
      estTime: "5-10 working days",
    },
  },
  {
    match: /doj|doe|date of (joining|exit)/i,
    result: {
      plainReason:
        "Your date of joining or date of exit on the EPFO record doesn't match what's on your claim form, or the exit date hasn't been marked at all.",
      whoMustFix: "employer",
      exactSteps: [
        "Ask your employer's PF admin to verify and correct the date of joining/exit on the employer portal",
        "If the employer is unresponsive after 2 months from your actual exit, escalate to your regional EPFO field office with a relieving letter",
      ],
      docsNeeded: ["Relieving letter", "Last salary slip"],
      estTime: "Employer: 1-3 days. Field office escalation: 15-20 days",
    },
  },
  {
    match: /signat/i,
    result: {
      plainReason:
        "The form wasn't signed by the right person, or the signature on file doesn't match your specimen signature.",
      whoMustFix: "you",
      exactSteps: [
        "Re-download the claim form and sign in the exact style as your bank specimen signature",
        "If you no longer have the same signature style, get it attested by your bank",
      ],
      docsNeeded: ["Bank-attested signature, if signature has changed"],
      estTime: "2-5 working days",
    },
  },
  {
    match: /kyc|aadhaar|verified/i,
    result: {
      plainReason:
        "Your KYC — usually Aadhaar — is not digitally verified on your EPFO profile. Claims can't be processed on unverified KYC.",
      whoMustFix: "you",
      exactSteps: [
        "Log in to the EPFO member portal, go to Manage > KYC",
        "Enter Aadhaar and complete OTP verification",
        "Wait for employer's digital approval of the KYC entry",
      ],
      docsNeeded: ["Aadhaar number", "Mobile number linked to Aadhaar"],
      estTime: "Same day for you; 2-4 days for employer approval",
    },
  },
  {
    match: /bank|ifsc/i,
    result: {
      plainReason:
        "Your bank account number or IFSC code doesn't match what your bank has on record, or isn't in a valid format.",
      whoMustFix: "you",
      exactSteps: [
        "Copy the exact IFSC and account number from your passbook or netbanking",
        "Update bank KYC on the EPFO member portal",
        "Get it approved by your employer or field office",
      ],
      docsNeeded: ["Bank passbook first page or a cancelled cheque"],
      estTime: "2-5 working days",
    },
  },
  {
    match: /duplicate|already settled/i,
    result: {
      plainReason: "EPFO's records show this claim (or an equivalent one) as already paid out.",
      whoMustFix: "field_office",
      exactSteps: [
        "Check your bank statement around the claim date for a credit from EPFO",
        "If nothing was received, raise a grievance on EPFiGMS referencing the claim ID and ask for a payment trace",
      ],
      docsNeeded: ["Claim ID", "Bank statement for the relevant period"],
      estTime: "15-30 days via grievance",
    },
  },
  {
    match: /member id|uan/i,
    result: {
      plainReason: "The UAN or member ID entered on the claim doesn't match EPFO's records.",
      whoMustFix: "you",
      exactSteps: [
        "Double-check your UAN on your salary slip or the EPFO portal",
        "Resubmit the claim with the correct UAN",
      ],
      docsNeeded: [],
      estTime: "No extra delay if resubmitted correctly",
    },
  },
  {
    match: /cheque|passbook.*(clear|attach)/i,
    result: {
      plainReason: "The passbook or cancelled cheque copy you attached was unclear, cropped, or missing.",
      whoMustFix: "you",
      exactSteps: [
        "Scan or photograph the full first page of your passbook (or a cancelled cheque) in good light",
        "Make sure account number, IFSC, and your name are all clearly visible",
        "Re-upload with the claim",
      ],
      docsNeeded: ["Clear passbook first page or cancelled cheque"],
      estTime: "No extra delay if resubmitted correctly",
    },
  },
  {
    match: /death certificate|legal heir/i,
    result: {
      plainReason: "This looks like a claim by a nominee/legal heir, and the required death certificate or legal heir certificate wasn't attached.",
      whoMustFix: "you",
      exactSteps: [
        "Obtain the death certificate from the municipal authority",
        "Obtain a legal heir certificate from the local revenue office if you're not the nominated nominee",
        "Attach both with the claim",
      ],
      docsNeeded: ["Death certificate", "Legal heir certificate (if not the nominee)"],
      estTime: "Varies with local authority turnaround",
    },
  },
  {
    match: /contribution|discrepanc/i,
    result: {
      plainReason: "EPFO's contribution records for your account don't reconcile cleanly — often because an employer missed or delayed a monthly deposit.",
      whoMustFix: "employer",
      exactSteps: [
        "Ask your employer's PF admin to check and reconcile ECR (Electronic Challan cum Return) filings for the disputed months",
        "If the employer can't resolve it, escalate to the field office with your salary slips as proof of deduction",
      ],
      docsNeeded: ["Salary slips for the disputed period"],
      estTime: "15-30 days",
    },
  },
];

const GENERIC_FALLBACK: DecodedShape = {
  plainReason:
    "This rejection reason doesn't match a known pattern in the offline fallback. With a live OpenAI key configured, this would be interpreted directly instead of pattern-matched.",
  whoMustFix: "field_office",
  exactSteps: [
    "Note the exact rejection code/text shown to you",
    "Raise a grievance on EPFiGMS quoting the claim ID and rejection text, and ask for the specific field that failed",
  ],
  docsNeeded: [],
  estTime: "15-30 days via grievance",
};

function fallbackDecode(rawText: string): DecodedShape {
  for (const rule of FALLBACK_RULES) {
    if (rule.match.test(rawText)) return rule.result;
  }
  return GENERIC_FALLBACK;
}

export async function decodeRejection(
  rawText: string,
  language: Language
): Promise<RejectionDecoderOutput & { source: "openai" | "fallback" }> {
  if (!client) {
    const fb = fallbackDecode(rawText);
    return { ...fb, language, source: "fallback" };
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are ClaimReady's rejection decoder for Indian EPFO (Provident Fund) claims. " +
            "Translate a cryptic EPFO rejection string into a plain-language explanation and a concrete fix path. " +
            "Be specific and actionable, never vague. Do not invent EPFO policy you are not confident about — " +
            "prefer generic-but-correct guidance (e.g. 'contact your employer's PF admin') over a fabricated specific rule. " +
            `Respond in ${LANGUAGE_NAMES[language]}, in the structured JSON schema provided.`,
        },
        { role: "user", content: rawText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "rejection_decode", strict: true, schema: DECODER_SCHEMA },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from model");
    const parsed = JSON.parse(content) as DecodedShape;
    return { ...parsed, language, source: "openai" };
  } catch (err) {
    console.error("OpenAI decode failed, using fallback:", err);
    const fb = fallbackDecode(rawText);
    return { ...fb, language, source: "fallback" };
  }
}

// --- Conversational intake: free text -> form guess ---
export interface IntakeClassification {
  formGuess: "19" | "10C" | "31" | "unclear";
  reasoning: string;
  detectedCategory: string | null; // e.g. "resigned", "medical advance", "marriage advance"
}

const INTAKE_FALLBACK_RULES: { match: RegExp; result: IntakeClassification }[] = [
  {
    match: /retir|58 years|resign|left my job|quit|no longer working|last day/i,
    result: {
      formGuess: "19",
      reasoning: "You described leaving your job for good, which points to a final settlement claim.",
      detectedCategory: "exit / resignation / retirement",
    },
  },
  {
    match: /pension|monthly pension|scheme certificate/i,
    result: {
      formGuess: "10C",
      reasoning: "You mentioned pension, which is handled separately from your PF balance via Form 10C.",
      detectedCategory: "pension withdrawal",
    },
  },
  {
    match: /medical|surgery|hospital|treatment/i,
    result: {
      formGuess: "31",
      reasoning: "Medical treatment is a partial-withdrawal (advance) category — no minimum service requirement.",
      detectedCategory: "medical advance",
    },
  },
  {
    match: /marriage|wedding/i,
    result: {
      formGuess: "31",
      reasoning: "Marriage is a partial-withdrawal (advance) category, usually requiring 7 years of service.",
      detectedCategory: "marriage advance",
    },
  },
  {
    match: /education|college|tuition|school fees/i,
    result: {
      formGuess: "31",
      reasoning: "Education expenses are a partial-withdrawal (advance) category, usually requiring 7 years of service.",
      detectedCategory: "education advance",
    },
  },
  {
    match: /house|home|construction|renovat|property/i,
    result: {
      formGuess: "31",
      reasoning: "Housing is a partial-withdrawal (advance) category, usually requiring 5 years of service.",
      detectedCategory: "housing advance",
    },
  },
];

const INTAKE_GENERIC_FALLBACK: IntakeClassification = {
  formGuess: "unclear",
  reasoning:
    "Couldn't confidently match this description in the offline fallback. With a live OpenAI key, this would be classified directly instead of pattern-matched — try mentioning whether you've left your job, or the specific reason for a partial withdrawal.",
  detectedCategory: null,
};

function fallbackClassifyIntake(text: string): IntakeClassification {
  for (const rule of INTAKE_FALLBACK_RULES) {
    if (rule.match.test(text)) return rule.result;
  }
  return INTAKE_GENERIC_FALLBACK;
}

export async function classifyIntake(
  text: string
): Promise<IntakeClassification & { source: "openai" | "fallback" }> {
  if (!client) {
    return { ...fallbackClassifyIntake(text), source: "fallback" };
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are ClaimReady's intake classifier for Indian EPFO (Provident Fund) claims. " +
            "Given a citizen's free-text description of their situation, decide which claim form applies: " +
            "'19' (final settlement, after leaving a job for good), '10C' (EPS pension withdrawal), " +
            "'31' (partial/advance withdrawal for medical, education, marriage, housing, etc.), or 'unclear' " +
            "if there isn't enough information. Keep reasoning to one plain-language sentence, no jargon.",
        },
        { role: "user", content: text },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "intake_classification",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              formGuess: { type: "string", enum: ["19", "10C", "31", "unclear"] },
              reasoning: { type: "string" },
              detectedCategory: { type: ["string", "null"] },
            },
            required: ["formGuess", "reasoning", "detectedCategory"],
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from model");
    const parsed = JSON.parse(content) as IntakeClassification;
    return { ...parsed, detectedCategory: normalizeNullableString(parsed.detectedCategory), source: "openai" };
  } catch (err) {
    console.error("OpenAI intake classification failed, using fallback:", err);
    return { ...fallbackClassifyIntake(text), source: "fallback" };
  }
}

// --- Grievance letter drafting (EPFiGMS) ---
export interface GrievanceLetterResult {
  subject: string;
  body: string;
}

function grievanceFallback(rawText: string, plainReason: string): GrievanceLetterResult {
  return {
    subject: "Grievance regarding PF claim rejection — [Claim ID]",
    body:
      `To,\n` +
      `The Regional Provident Fund Commissioner\n` +
      `[Your EPFO Regional Office]\n\n` +
      `Subject: Grievance regarding rejection of PF claim — UAN [Your UAN], Claim ID [Claim ID]\n\n` +
      `Respected Sir/Madam,\n\n` +
      `I am writing to raise a grievance regarding my Provident Fund claim, which was rejected or ` +
      `returned with the stated reason: "${rawText}".\n\n` +
      `${plainReason}\n\n` +
      `I request that my claim be reviewed and reprocessed, or that specific guidance be provided on ` +
      `the exact correction required, given the reason cited above. I have attached supporting ` +
      `documents relevant to this matter and would appreciate a response within the standard ` +
      `grievance redressal timeline.\n\n` +
      `Thank you for your attention to this matter.\n\n` +
      `Yours faithfully,\n` +
      `[Your Name]\n` +
      `UAN: [Your UAN]\n` +
      `Registered Mobile: [Your Mobile Number]\n` +
      `Date: [Date]`,
  };
}

export async function draftGrievanceLetter(
  rawText: string,
  plainReason: string,
  language: Language
): Promise<GrievanceLetterResult & { source: "openai" | "fallback" }> {
  if (!client) {
    return { ...grievanceFallback(rawText, plainReason), source: "fallback" };
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You draft formal EPFiGMS grievance letters for Indian EPFO Provident Fund claim issues. " +
            "Address it to 'The Regional Provident Fund Commissioner'. Use bracketed placeholders for " +
            "personal details you don't have: [Your Name], [Your UAN], [Claim ID], [Your EPFO Regional " +
            "Office], [Your Mobile Number], [Date]. Reference the specific rejection reason given. Be " +
            "concise, formal, and factual — do not invent facts about the person's situation beyond " +
            `what's given. Respond in ${LANGUAGE_NAMES[language]}, in the structured JSON schema provided.`,
        },
        {
          role: "user",
          content: `Rejection reason: "${rawText}"\n\nPlain-language explanation: ${plainReason}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "grievance_letter",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
            },
            required: ["subject", "body"],
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from model");
    const parsed = JSON.parse(content) as GrievanceLetterResult;
    return { ...parsed, source: "openai" };
  } catch (err) {
    console.error("OpenAI grievance drafting failed, using fallback:", err);
    return { ...grievanceFallback(rawText, plainReason), source: "fallback" };
  }
}

export interface ExtractedDocFields {
  documentType: "uan_card" | "passbook" | "bank_statement" | "unknown";
  name: string | null;
  uan: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  confidence: number;
}

const MOCK_EXTRACTION: ExtractedDocFields = {
  documentType: "uan_card",
  name: "Ramesh Kumar Sinha",
  uan: "100200300401",
  accountNumber: null,
  ifsc: null,
  confidence: 0.5,
};

export async function extractDocumentFields(
  imageDataUrl: string
): Promise<ExtractedDocFields & { source: "openai" | "fallback" }> {
  if (!client) {
    return { ...MOCK_EXTRACTION, source: "fallback" };
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract fields from an uploaded Indian EPFO-related document image (UAN card, PF passbook, or bank statement/cheque). " +
            "Return null for any field not visible or not confidently readable. " +
            "documentType must be one of: uan_card, passbook, bank_statement, unknown.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the fields from this document." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "doc_extraction",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              documentType: { type: "string", enum: ["uan_card", "passbook", "bank_statement", "unknown"] },
              name: { type: ["string", "null"] },
              uan: { type: ["string", "null"] },
              accountNumber: { type: ["string", "null"] },
              ifsc: { type: ["string", "null"] },
              confidence: { type: "number" },
            },
            required: ["documentType", "name", "uan", "accountNumber", "ifsc", "confidence"],
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from model");
    const parsed = JSON.parse(content) as ExtractedDocFields;
    return {
      ...parsed,
      name: normalizeNullableString(parsed.name),
      uan: normalizeNullableString(parsed.uan),
      accountNumber: normalizeNullableString(parsed.accountNumber),
      ifsc: normalizeNullableString(parsed.ifsc),
      source: "openai",
    };
  } catch (err) {
    console.error("OpenAI extraction failed, using fallback:", err);
    return { ...MOCK_EXTRACTION, source: "fallback" };
  }
}
