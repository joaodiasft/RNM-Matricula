import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { adminSettings, auditLogs } from "@/lib/db/schema";
import { getCardFeePercent } from "@/lib/enrollment-service";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const percent = await getCardFeePercent();
  return NextResponse.json({ cardFeePercent: percent });
}

export async function PUT(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { cardFeePercent?: number };
  if (body.cardFeePercent == null || Number.isNaN(body.cardFeePercent)) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  const db = getDb();
  const key = "card_machine_fee_percent";
  const [existing] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, key))
    .limit(1);

  if (existing) {
    await db
      .update(adminSettings)
      .set({
        value: String(body.cardFeePercent),
        updatedAt: new Date(),
      })
      .where(eq(adminSettings.id, existing.id));
  } else {
    await db.insert(adminSettings).values({
      key,
      value: String(body.cardFeePercent),
    });
  }

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "update_settings",
    meta: JSON.stringify({ cardFeePercent: body.cardFeePercent }),
  });

  return NextResponse.json({ ok: true, cardFeePercent: body.cardFeePercent });
}
