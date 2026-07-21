import { NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  enrollmentCourses,
  enrollments,
  students,
} from "@/lib/db/schema";
import { getAdminSession } from "@/lib/auth";
import { countEnrollmentsSince } from "@/lib/enrollment-stats";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const course = url.searchParams.get("course") || "";
  const turma = url.searchParams.get("turma") || "";
  const modality = url.searchParams.get("modality") || "";
  const q = url.searchParams.get("q") || "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  try {
    const db = getDb();
    const conditions = [];

    if (status) conditions.push(eq(enrollments.status, status));
    if (modality) conditions.push(eq(enrollments.modality, modality));
    if (from) conditions.push(gte(enrollments.createdAt, new Date(from)));
    if (to) {
      conditions.push(
        sql`${enrollments.createdAt} <= ${new Date(to + "T23:59:59")}`
      );
    }
    if (q) {
      conditions.push(
        or(
          ilike(students.fullName, `%${q}%`),
          ilike(students.email, `%${q}%`),
          ilike(students.phone, `%${q}%`),
          ilike(students.cpf, `%${q}%`)
        )
      );
    }

    const rows = await db
      .select({
        enrollment: enrollments,
        student: students,
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(enrollments.createdAt))
      .limit(300);

    const withCourses = await Promise.all(
      rows.map(async (row) => {
        const courses = await db
          .select()
          .from(enrollmentCourses)
          .where(eq(enrollmentCourses.enrollmentId, row.enrollment.id));
        return { ...row, courses };
      })
    );

    let filtered = withCourses;
    if (course) {
      filtered = filtered.filter((row) =>
        row.courses.some(
          (c) => c.subject === course || c.classCode === course
        )
      );
    }
    if (turma) {
      filtered = filtered.filter((row) =>
        row.courses.some((c) => c.classCode === turma)
      );
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [todayCount, weekCount, statusCounts] = await Promise.all([
      countEnrollmentsSince(startOfDay),
      countEnrollmentsSince(startOfWeek),
      db
        .select({
          status: enrollments.status,
          count: sql<number>`count(*)::int`,
        })
        .from(enrollments)
        .groupBy(enrollments.status),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[row.status] = row.count;
    }

    await db.insert(auditLogs).values({
      adminUserId: session.userId,
      action: "list_enrollments",
      entityType: "enrollment",
      meta: JSON.stringify({ status, course, turma, modality, q, from, to }),
    });

    return NextResponse.json({
      items: filtered,
      stats: {
        today: todayCount,
        week: weekCount,
        total: filtered.length,
        concluida: byStatus.concluida || 0,
        em_andamento: byStatus.em_andamento || 0,
        abandonada: byStatus.abandonada || 0,
        alerta_duplicidade: byStatus.alerta_duplicidade || 0,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao listar" }, { status: 500 });
  }
}
