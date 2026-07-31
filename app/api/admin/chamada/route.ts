import { and, asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  enrollmentCourses,
  enrollments,
  students,
} from "@/lib/db/schema";
import {
  classAttendance,
  ensureAttendanceSchema,
  scheduleDateToIso,
  type AttendanceStatus,
} from "@/lib/attendance";
import { CLASSES, SUBJECT_LABELS, getClassByCode } from "@/lib/courses";
import { getClassDates, getClassModules } from "@/lib/class-schedule";

const VALID: AttendanceStatus[] = ["presente", "falta", "justificada"];

/** Lista turmas + datas + alunos da turma/data, ou salva a chamada. */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureAttendanceSchema();
  const db = getDb();
  const url = new URL(req.url);
  const classCode = (url.searchParams.get("classCode") || "").trim().toUpperCase();
  const lessonDate = (url.searchParams.get("date") || "").trim();

  // Meta: turmas com quantidade de matriculados concluídos
  if (!classCode) {
    const counts = await db
      .select({
        classCode: enrollmentCourses.classCode,
        n: sql<number>`count(distinct ${enrollments.id})::int`,
      })
      .from(enrollmentCourses)
      .innerJoin(enrollments, eq(enrollmentCourses.enrollmentId, enrollments.id))
      .where(
        and(
          eq(enrollments.status, "concluida"),
          sql`coalesce(${enrollmentCourses.onWaitlist}, false) = false`
        )
      )
      .groupBy(enrollmentCourses.classCode);

    const byCode = new Map(counts.map((c) => [c.classCode, c.n]));
    const turmas = CLASSES.map((c) => ({
      code: c.code,
      subject: c.subject,
      subjectLabel: SUBJECT_LABELS[c.subject],
      label: c.label,
      day: c.day,
      schedule: c.schedule,
      enrolled: byCode.get(c.code) || 0,
      modules: getClassModules(c.code).map((m) => ({
        index: m.index,
        label: m.label,
        dates: m.dates.map((d) => ({
          label: d,
          iso: scheduleDateToIso(d),
        })),
      })),
    }));

    return NextResponse.json({ turmas });
  }

  const info = getClassByCode(classCode);
  if (!info) {
    return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
  }

  const dates = getClassDates(classCode).map((d) => ({
    label: d,
    iso: scheduleDateToIso(d),
  }));

  if (!lessonDate) {
    return NextResponse.json({
      class: {
        code: info.code,
        subject: info.subject,
        subjectLabel: SUBJECT_LABELS[info.subject],
        label: info.label,
        day: info.day,
        schedule: info.schedule,
      },
      dates,
      modules: getClassModules(classCode),
      students: [],
    });
  }

  const enrolled = await db
    .select({
      enrollmentId: enrollments.id,
      enrollmentNumber: enrollments.enrollmentNumber,
      studentId: students.id,
      fullName: students.fullName,
      phone: students.phone,
      grade: students.grade,
    })
    .from(enrollmentCourses)
    .innerJoin(enrollments, eq(enrollmentCourses.enrollmentId, enrollments.id))
    .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(
        and(
          eq(enrollmentCourses.classCode, classCode),
          eq(enrollments.status, "concluida"),
          sql`coalesce(${enrollmentCourses.onWaitlist}, false) = false`
        )
      )
    .orderBy(asc(students.fullName));

  const marks = await db
    .select()
    .from(classAttendance)
    .where(
      and(
        eq(classAttendance.classCode, classCode),
        eq(classAttendance.lessonDate, lessonDate)
      )
    );

  const byStudent = new Map(marks.map((m) => [m.studentId, m]));

  const studentsOut = enrolled.map((s) => {
    const mark = s.studentId ? byStudent.get(s.studentId) : undefined;
    return {
      studentId: s.studentId,
      enrollmentId: s.enrollmentId,
      enrollmentNumber: s.enrollmentNumber,
      fullName: s.fullName || "— sem nome —",
      phone: s.phone,
      grade: s.grade,
      status: (mark?.status as AttendanceStatus) || "presente",
      assignmentDone: mark?.assignmentDone === true,
      saved: Boolean(mark),
    };
  });

  // Frequência no módulo da data selecionada
  const modules = getClassModules(classCode);
  const mod = modules.find((m) =>
    m.dates.some((d) => scheduleDateToIso(d) === lessonDate)
  );
  const modIsos = mod ? mod.dates.map((d) => scheduleDateToIso(d)) : [];
  const freqMap: Record<string, { presentes: number; total: number }> = {};

  if (modIsos.length && enrolled.length) {
    const allMarks = await db
      .select()
      .from(classAttendance)
      .where(eq(classAttendance.classCode, classCode));

    for (const s of enrolled) {
      if (!s.studentId) continue;
      let presentes = 0;
      let total = 0;
      for (const iso of modIsos) {
        const m = allMarks.find((x) => {
          const d =
            typeof x.lessonDate === "string"
              ? x.lessonDate.slice(0, 10)
              : String(x.lessonDate).slice(0, 10);
          return x.studentId === s.studentId && d === iso;
        });
        if (!m) continue;
        total += 1;
        if (m.status === "presente") presentes += 1;
      }
      freqMap[s.studentId] = { presentes, total };
    }
  }

  return NextResponse.json({
    class: {
      code: info.code,
      subject: info.subject,
      subjectLabel: SUBJECT_LABELS[info.subject],
      label: info.label,
      day: info.day,
      schedule: info.schedule,
    },
    lessonDate,
    dates,
    module: mod
      ? { index: mod.index, label: mod.label, dates: mod.dates }
      : null,
    students: studentsOut.map((s) => ({
      ...s,
      frequency: s.studentId ? freqMap[s.studentId] ?? null : null,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureAttendanceSchema();
  const body = (await req.json().catch(() => null)) as {
    classCode?: string;
    lessonDate?: string;
    registros?: {
      studentId: string;
      enrollmentId?: string | null;
      status: AttendanceStatus;
      assignmentDone?: boolean;
    }[];
  } | null;

  const classCode = (body?.classCode || "").trim().toUpperCase();
  const lessonDate = (body?.lessonDate || "").trim();
  if (!classCode || !lessonDate || !Array.isArray(body?.registros)) {
    return NextResponse.json(
      { error: "classCode, lessonDate e registros são obrigatórios" },
      { status: 400 }
    );
  }
  if (!getClassByCode(classCode)) {
    return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
  }

  const db = getDb();
  let count = 0;
  const now = new Date();

  for (const r of body!.registros!) {
    if (!r.studentId || !VALID.includes(r.status)) continue;
    await db
      .insert(classAttendance)
      .values({
        classCode,
        lessonDate,
        studentId: r.studentId,
        enrollmentId: r.enrollmentId || null,
        status: r.status,
        assignmentDone: Boolean(r.assignmentDone),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          classAttendance.classCode,
          classAttendance.lessonDate,
          classAttendance.studentId,
        ],
        set: {
          status: r.status,
          assignmentDone: Boolean(r.assignmentDone),
          enrollmentId: r.enrollmentId || null,
          updatedAt: now,
        },
      });
    count++;
  }

  return NextResponse.json({ ok: true, count });
}
