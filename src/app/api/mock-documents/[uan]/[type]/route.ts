import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getCitizenByUan } from "@/lib/citizens";
import { buildPassbookSvg, buildUanCardSvg } from "@/lib/mock-doc-svg";
import { bankNameForIfsc, branchForUan } from "@/lib/bank-lookup";

// sharp needs native bindings — must run on the Node.js runtime, not Edge.
export const runtime = "nodejs";

function toDdMmYyyy(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uan: string; type: string }> }
) {
  const { uan, type: rawType } = await params;
  const type = rawType.replace(/\.png$/i, "");

  const citizen = getCitizenByUan(uan);
  if (!citizen) {
    return NextResponse.json({ error: "No mock citizen found for that UAN" }, { status: 404 });
  }
  if (type !== "uan-card" && type !== "passbook") {
    return NextResponse.json({ error: "type must be uan-card or passbook" }, { status: 400 });
  }

  const { record } = citizen;
  const svg =
    type === "uan-card"
      ? buildUanCardSvg({
          name: record.nameOnEpfo,
          uan: record.uan,
          dob: toDdMmYyyy(record.dob),
          mobile: record.mobile,
        })
      : buildPassbookSvg({
          name: record.nameOnBank,
          accountNumber: record.bankAccountNumber,
          ifsc: record.bankIfsc,
          bankName: bankNameForIfsc(record.bankIfsc),
          branch: branchForUan(record.uan),
        });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
