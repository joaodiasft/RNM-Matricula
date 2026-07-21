import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  enrollmentCourses,
  enrollments,
  guardians,
  students,
} from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

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
  });
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
