// Builds the SVG markup for synthetic demo documents (UAN card, PF passbook
// first page). Rendered to PNG on request by /api/mock-documents/[uan]/[type]
// — every citizen in the mock database gets real, downloadable documents
// generated from their own record, not a fixed set of pre-made images.

const WIDTH = 900;
const HEIGHT = 560;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function watermark(): string {
  const lines: string[] = [];
  for (let y = -100; y < HEIGHT + 100; y += 110) {
    lines.push(
      `<text x="${WIDTH / 2}" y="${y}" font-family="Arial, sans-serif" font-size="26" fill="#dc2626" fill-opacity="0.14" text-anchor="middle" transform="rotate(-24 ${WIDTH / 2} ${y})">SPECIMEN — SYNTHETIC DATA — NOT A REAL DOCUMENT</text>`
    );
  }
  return lines.join("\n");
}

function field(label: string, value: string, x: number, y: number): string {
  return `
    <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="13" fill="#64748b" letter-spacing="0.5">${escapeXml(label.toUpperCase())}</text>
    <text x="${x}" y="${y + 24}" font-family="Arial, sans-serif" font-size="22" fill="#0f172a" font-weight="600">${escapeXml(value)}</text>
  `;
}

function baseHeader(title: string, subtitle: string): string {
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" />
    <rect x="0" y="0" width="${WIDTH}" height="90" fill="#1d4ed8" />
    <text x="36" y="40" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" font-weight="700">${escapeXml(title)}</text>
    <text x="36" y="66" font-family="Arial, sans-serif" font-size="14" fill="#dbeafe">${escapeXml(subtitle)}</text>
    <rect x="0" y="${HEIGHT - 46}" width="${WIDTH}" height="46" fill="#f1f5f9" />
    <text x="36" y="${HEIGHT - 18}" font-family="Arial, sans-serif" font-size="12" fill="#475569">
      Fictional document generated for the ClaimReady hackathon prototype. No real person, bank, or government record.
    </text>
  `;
}

export function buildUanCardSvg(params: { name: string; uan: string; dob: string; mobile: string }): string {
  const { name, uan, dob, mobile } = params;
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

export function buildPassbookSvg(params: {
  name: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
}): string {
  const { name, accountNumber, ifsc, bankName, branch } = params;
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

export const DOC_IMAGE_WIDTH = WIDTH;
export const DOC_IMAGE_HEIGHT = HEIGHT;
