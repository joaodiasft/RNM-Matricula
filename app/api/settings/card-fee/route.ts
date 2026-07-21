import { NextResponse } from "next/server";
import { getCardFeePercent } from "@/lib/enrollment-service";

export async function GET() {
  try {
    const percent = await getCardFeePercent();
    return NextResponse.json({ percent });
  } catch {
    return NextResponse.json({
      percent: Number(process.env.DEFAULT_CARD_FEE_PERCENT || 3.5),
    });
  }
}
