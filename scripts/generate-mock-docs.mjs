// One-off generator for synthetic demo documents used to test the guided-claim
// upload/extraction flow. Not part of the app runtime — run manually:
//   node scripts/generate-mock-docs.mjs
// Every image is watermarked as a specimen; no real government or bank
// branding is used anywhere, per the project's compliance rules.

import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "mock-documents");
mkdirSync(OUT_DIR, { recursive: true });

const WIDTH = 900;
const HEIGHT = 560;

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function watermark() {
  const lines = [];
  for (let y = -100; y < HEIGHT + 100; y += 110) {
    lines.push(
      `<text x="${WIDTH / 2}" y="${y}" font-family="Arial, sans-serif" font-size="26" fill="#dc2626" fill-opacity="0.14" text-anchor="middle" transform="rotate(-24 ${WIDTH / 2} ${y})">SPECIMEN — SYNTHETIC DATA — NOT A REAL DOCUMENT</text>`
    );
  }
  return lines.join("\n");
}

function field(label, value, x, y) {
  return `
    <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="13" fill="#64748b" letter-spacing="0.5">${escapeXml(label.toUpperCase())}</text>
    <text x="${x}" y="${y + 24}" font-family="Arial, sans-serif" font-size="22" fill="#0f172a" font-weight="600">${escapeXml(value)}</text>
  `;
}

function baseHeader(title, subtitle) {
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" />
    <rect x="0" y="0" width="${WIDTH}" height="90" fill="#1d4ed8" />
    <text x="36" y="40" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" font-weight="700">${escapeXml(title)}</text>
    <text x="36" y="66" font-family="Arial, sans-serif" font-size="14" fill="#dbeafe">${escapeXml(subtitle)}</text>
    <rect x="0" y="${HEIGHT - 46}" width="${WIDTH}" height="46" fill="#f1f5f9" />
    <text x="36" y="${HEIGHT - 18}" font-family="Arial, sans-serif" font-size="12" fill="#475569">
      Fictional document created for the ClaimReady hackathon prototype. No real person, bank, or government record.
    </text>
  `;
}

function uanCardSvg({ name, uan, dob, mobile }) {
  return `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${baseHeader("EPFO-style UAN Card", "Universal Account Number — member identification (mock format)")}
    <rect x="36" y="118" width="${WIDTH - 72}" height="${HEIGHT - 118 - 62}" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
    ${field("Name", name, 70, 175)}
    ${field("UAN", uan, 70, 245)}
    ${field("Date of birth", dob, 70, 315)}
    ${field("Registered mobile", mobile, 70, 385)}
    ${watermark()}
  </svg>`;
}

function passbookSvg({ name, accountNumber, ifsc, bankName, branch }) {
  return `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${baseHeader("PF Passbook — First Page", "Bank account details on file (mock format)")}
    <rect x="36" y="118" width="${WIDTH - 72}" height="${HEIGHT - 118 - 62}" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
    ${field("Account holder name", name, 70, 175)}
    ${field("Bank account number", accountNumber, 70, 245)}
    ${field("IFSC code", ifsc, 70, 315)}
    ${field("Bank & branch", `${bankName}, ${branch}`, 70, 385)}
    ${watermark()}
  </svg>`;
}

const PEOPLE = [
  {
    slug: "ramesh-sinha",
    name: "Ramesh Kumar Sinha",
    uan: "100200300401",
    dob: "12-04-1985",
    mobile: "9800XXXX21",
    accountNumber: "34521987001",
    ifsc: "SBIN0001234",
    bankName: "State Bank of India (mock)",
    branch: "Koramangala Branch",
  },
  {
    slug: "arjun-mehta",
    name: "Arjun Mehta",
    uan: "100200300405",
    dob: "25-09-1991",
    mobile: "9911XXXX05",
    accountNumber: "88901234567",
    ifsc: "ICIC0001122",
    bankName: "ICICI Bank (mock)",
    branch: "Indiranagar Branch",
  },
];

async function main() {
  for (const person of PEOPLE) {
    const uanSvg = uanCardSvg(person);
    const passbookSvg_ = passbookSvg(person);

    await sharp(Buffer.from(uanSvg)).png().toFile(path.join(OUT_DIR, `uan-card-${person.slug}.png`));
    await sharp(Buffer.from(passbookSvg_)).png().toFile(path.join(OUT_DIR, `passbook-${person.slug}.png`));
    console.log(`Generated documents for ${person.name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
