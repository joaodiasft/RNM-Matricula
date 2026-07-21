import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  enrollmentCourses,
  enrollments,
  guardians,
  referrals,
  students,
} from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_STATUS = new Set([
  "em_andamento",
  "concluida",
  "abandonada",
  "alerta_duplicidade",
]);

const ALLOWED_OBLIGATION = new Set([
  "pendente",
  "cumprida",
  "nao_cumprida",
  "parcial",
]);

export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const [guardian] = row.student
    ? await db
        .select()
        .from(guardians)
        .where(eq(guardians.studentId, row.student.id))
        .limit(1)
    : [null];

  const courses = await db
    .select()
    .from(enrollmentCourses)
    .where(eq(enrollmentCourses.enrollmentId, id));

  const referralRows = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerEnrollmentId, id));

  let draft: Record<string, unknown> | null = null;
  if (row.enrollment.draftData) {
    try {
      draft = JSON.parse(row.enrollment.draftData) as Record<string, unknown>;
    } catch {
      draft = null;
    }
  }

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "view_enrollment",
    entityType: "enrollment",
    entityId: id,
  });

  return NextResponse.json({
    ...row,
    guardian: guardian ?? null,
    courses,
    referrals: referralRows,
    draft,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    status?: string;
    modality?: string | null;
    plan?: string | null;
    paymentMethod?: string | null;
    autoRenew?: boolean;
    obligationStatus?: string | null;
    obligationDeadline?: string | null;
    obligationDivulged?: boolean | null;
    obligationBroughtStudent?: boolean | null;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (body.status && !ALLOWED_STATUS.has(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  if (
    body.obligationStatus &&
    !ALLOWED_OBLIGATION.has(body.obligationStatus)
  ) {
    return NextResponse.json(
      { error: "Status de obrigação inválido" },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {
    lastActivityAt: new Date(),
  };

  if (body.status !== undefined) {
    patch.status = body.status;
    if (body.status === "concluida" && !existing.completedAt) {
      patch.completedAt = new Date();
    }
  }
  if (body.modality !== undefined) patch.modality = body.modality;
  if (body.plan !== undefined) patch.plan = body.plan;
  if (body.paymentMethod !== undefined) patch.paymentMethod = body.paymentMethod;
  if (body.autoRenew !== undefined) patch.autoRenew = body.autoRenew;
  if (body.obligationStatus !== undefined) {
    patch.obligationStatus = body.obligationStatus;
  }
  if (body.obligationDeadline !== undefined) {
    patch.obligationDeadline = body.obligationDeadline || null;
  }
  if (body.obligationDivulged !== undefined) {
    patch.obligationDivulged = body.obligationDivulged;
  }
  if (body.obligationBroughtStudent !== undefined) {
    patch.obligationBroughtStudent = body.obligationBroughtStudent;
  }

  const [updated] = await db
    .update(enrollments)
    .set(patch)
    .where(eq(enrollments.id, id))
    .returning();

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "update_enrollment",
    entityType: "enrollment",
    entityId: id,
    meta: JSON.stringify(body),
  });

  return NextResponse.json({ ok: true, enrollment: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (row.studentId) {
    await db.delete(students).where(eq(students.id, row.studentId));
  } else {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  await db.insert(auditLogs).values({
    adminUserId: session.userId,
    action: "lgpd_delete",
    entityType: "enrollment",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
