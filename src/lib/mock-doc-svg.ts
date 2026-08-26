// Builds synthetic demo documents (UAN card, PF passbook first page) as SVG,
// rendered to PNG on request by /api/mock-documents/[uan]/[type] — every
// citizen in the mock database gets real, downloadable documents generated
// from their own record, not a fixed set of pre-made images.
//
// Uses satori (the engine behind @vercel/og) instead of hand-written SVG
// <text> + a system font. Vercel's serverless Linux runtime has no fonts
// installed, so a plain SVG <text font-family="Arial"> — and even an
// embedded @font-face data: URI, tested against this build's librsvg —
// both render as empty boxes. Satori shapes text into vector paths itself
// from a font buffer we supply directly, so the result has zero dependency
// on what fonts (if any) the host has. Confirmed against production.

import satori from "satori";
import { INTER_BOLD_WOFF_BASE64, INTER_REGULAR_WOFF_BASE64 } from "./doc-font-data";

const WIDTH = 900;
const HEIGHT = 560;

const FONTS = [
  { name: "DocFont", data: Buffer.from(INTER_REGULAR_WOFF_BASE64, "base64"), weight: 400 as const, style: "normal" as const },
  { name: "DocFont", data: Buffer.from(INTER_BOLD_WOFF_BASE64, "base64"), weight: 700 as const, style: "normal" as const },
];

type Node = { type: string; props: Record<string, unknown> };

function el(type: string, style: Record<string, unknown>, children?: Node[] | string): Node {
  return { type, props: { style: { display: "flex", ...style }, children } };
}

function abs(top: number, left: number, extra: Record<string, unknown> = {}) {
  return { position: "absolute" as const, top, left, ...extra };
}

function watermarkNodes(): Node[] {
  const nodes: Node[] = [];
  for (let y = -40; y < HEIGHT + 40; y += 110) {
    nodes.push(
      el(
        "div",
        abs(y, 0, {
          width: WIDTH,
          justifyContent: "center",
          color: "#dc2626",
          opacity: 0.16,
          fontSize: 24,
          fontWeight: 400,
          transform: "rotate(-16deg)",
        }),
        "SPECIMEN — SYNTHETIC DATA — NOT A REAL DOCUMENT"
      )
    );
  }
  return nodes;
}

function fieldNodes(label: string, value: string, top: number): Node[] {
  return [
    el("div", abs(top, 70, { fontSize: 13, fontWeight: 400, color: "#64748b", letterSpacing: 1 }), label.toUpperCase()),
    el("div", abs(top + 20, 70, { fontSize: 22, fontWeight: 700, color: "#0f172a" }), value),
  ];
}

function baseChildren(title: string, subtitle: string): Node[] {
  return [
    el("div", abs(0, 0, { width: WIDTH, height: 90, backgroundColor: "#1d4ed8" })),
    el("div", abs(28, 36, { fontSize: 24, fontWeight: 700, color: "#ffffff" }), title),
    el("div", abs(58, 36, { fontSize: 14, fontWeight: 400, color: "#dbeafe" }), subtitle),
    el(
      "div",
      abs(118, 36, {
        width: WIDTH - 72,
        height: HEIGHT - 118 - 62,
        borderRadius: 12,
        backgroundColor: "#f8fafc",
        border: "1.5px solid #e2e8f0",
      })
    ),
    el("div", abs(HEIGHT - 46, 0, { width: WIDTH, height: 46, backgroundColor: "#f1f5f9" })),
    el(
      "div",
      abs(HEIGHT - 28, 36, { width: WIDTH - 72, fontSize: 12, fontWeight: 400, color: "#475569" }),
      "Fictional document generated for the ClaimReady hackathon prototype. No real person, bank, or government record."
    ),
  ];
}

async function render(children: Node[]): Promise<string> {
  const root = el("div", { position: "relative", width: WIDTH, height: HEIGHT, backgroundColor: "#ffffff", fontFamily: "DocFont" }, children);
  return satori(root as unknown as Parameters<typeof satori>[0], { width: WIDTH, height: HEIGHT, fonts: FONTS });
}

export async function buildUanCardSvg(params: { name: string; uan: string; dob: string; mobile: string }): Promise<string> {
  const { name, uan, dob, mobile } = params;
  const children = [
    ...baseChildren("EPFO-style UAN Card", "Universal Account Number — member identification (mock format)"),
    ...fieldNodes("Name", name, 155),
    ...fieldNodes("UAN", uan, 225),
    ...fieldNodes("Date of birth", dob, 295),
    ...fieldNodes("Registered mobile", mobile, 365),
    ...watermarkNodes(),
  ];
  return render(children);
}

export async function buildPassbookSvg(params: {
  name: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
}): Promise<string> {
  const { name, accountNumber, ifsc, bankName, branch } = params;
  const children = [
    ...baseChildren("PF Passbook — First Page", "Bank account details on file (mock format)"),
    ...fieldNodes("Account holder name", name, 155),
    ...fieldNodes("Bank account number", accountNumber, 225),
    ...fieldNodes("IFSC code", ifsc, 295),
    ...fieldNodes("Bank & branch", `${bankName}, ${branch}`, 365),
    ...watermarkNodes(),
  ];
  return render(children);
}

export const DOC_IMAGE_WIDTH = WIDTH;
export const DOC_IMAGE_HEIGHT = HEIGHT;
