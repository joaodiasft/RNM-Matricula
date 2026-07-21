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
  const q = url.searchParams.get("q") || "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  try {
    const db = getDb();
    const conditions = [];

    if (status) conditions.push(eq(enrollments.status, status));
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
          ilike(students.phone, `%${q}%`)
        )
      );
    }

    let rows = await db
      .select({
        enrollment: enrollments,
        student: students,
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(enrollments.createdAt))
      .limit(200);

    if (course) {
      const filtered = [];
      for (const row of rows) {
        const courses = await db
          .select()
          .from(enrollmentCourses)
          .where(eq(enrollmentCourses.enrollmentId, row.enrollment.id));
        if (courses.some((c) => c.subject === course || c.classCode === course)) {
          filtered.push({ ...row, courses });
        }
      }
      rows = filtered as typeof rows;
    }

    const withCourses = await Promise.all(
      rows.map(async (row) => {
        const courses = await db
          .select()
          .from(enrollmentCourses)
          .where(eq(enrollmentCourses.enrollmentId, row.enrollment.id));
        return { ...row, courses };
      })
    );

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [todayCount, weekCount] = await Promise.all([
      countEnrollmentsSince(startOfDay),
      countEnrollmentsSince(startOfWeek),
    ]);

    await db.insert(auditLogs).values({
      adminUserId: session.userId,
      action: "list_enrollments",
      entityType: "enrollment",
      meta: JSON.stringify({ status, course, q }),
    });

    return NextResponse.json({
      items: withCourses,
      stats: { today: todayCount, week: weekCount },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao listar" }, { status: 500 });
  }
}
