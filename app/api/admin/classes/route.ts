import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { auditLogs, classes, waitlist } from "@/lib/db/schema";
import { ensureClassesSeeded } from "@/lib/enrollment-service";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureClassesSeeded();
  const db = getDb();
  const rows = await db.select().from(classes);
  const waiting = await db.select().from(waitlist);

  return NextResponse.json({
    classes: rows.map((c) => ({
      ...c,
      seatsLeft: Math.max(0, c.maxSeats - c.seatsTaken),
      waitlistCount: waiting.filter((w) => w.classCode === c.code).length,
    })),
    waitlist: waiting,
  });
}

export async function PUT(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { code?: string; maxSeats?: number };
  if (!body.code || body.maxSeats == null || body.maxSeats < 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(classes)
    .set({ maxSeats: body.maxSeats, updatedAt: new Date() })
    .where(eq(classes.code, body.code));

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "update_class_seats",
    entityType: "class",
    entityId: body.code,
    meta: JSON.stringify({ maxSeats: body.maxSeats }),
  });

  return NextResponse.json({ ok: true });
}
