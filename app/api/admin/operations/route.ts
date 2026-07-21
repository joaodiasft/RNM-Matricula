import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  enrollments,
  referrals,
  students,
} from "@/lib/db/schema";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "obligations";
  const db = getDb();

  if (view === "referrals") {
    const rows = await db.select().from(referrals);
    return NextResponse.json({ referrals: rows });
  }

  if (view === "duplicates") {
    const rows = await db
      .select({
        enrollment: enrollments,
        student: students,
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .where(eq(enrollments.status, "alerta_duplicidade"));
    return NextResponse.json({ items: rows });
  }

  // obligations
  const rows = await db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .where(
      and(
        eq(enrollments.status, "concluida"),
        inArray(enrollments.modality, ["desconto", "desconto_parcial"])
      )
    );

  return NextResponse.json({ items: rows });
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    enrollmentId?: string;
    obligationStatus?: string;
    obligationDivulged?: boolean;
    obligationBroughtStudent?: boolean;
    resolveDuplicate?: "keep" | "discard";
  };

  if (!body.enrollmentId) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  const db = getDb();

  if (body.resolveDuplicate === "keep") {
    await db
      .update(enrollments)
      .set({ status: "concluida" })
      .where(eq(enrollments.id, body.enrollmentId));
  } else if (body.resolveDuplicate === "discard") {
    await db
      .update(enrollments)
      .set({ status: "abandonada" })
      .where(eq(enrollments.id, body.enrollmentId));
  } else {
    await db
      .update(enrollments)
      .set({
        obligationStatus: body.obligationStatus,
        obligationDivulged: body.obligationDivulged,
        obligationBroughtStudent: body.obligationBroughtStudent,
      })
      .where(eq(enrollments.id, body.enrollmentId));
  }

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "update_obligation_or_duplicate",
    entityType: "enrollment",
    entityId: body.enrollmentId,
    meta: JSON.stringify(body),
  });

  return NextResponse.json({ ok: true });
}
