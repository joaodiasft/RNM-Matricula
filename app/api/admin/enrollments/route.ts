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
import { ensureAccessSchema } from "@/lib/access";
import { countEnrollmentsSince } from "@/lib/enrollment-stats";
import {
  adminCreateEnrollment,
  type AdminEnrollInput,
} from "@/lib/enrollment-service";
import {
  MODALITY_LABELS,
  PLAN_LABELS,
  PAYMENT_LABELS,
  type Modality,
  type Plan,
  type PaymentMethod,
} from "@/lib/pricing";
import type { Subject } from "@/lib/courses";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
    // Garante colunas novas (payment_*, enrollment_number) antes do SELECT.
    // Sem isso a listagem inteira falha e as concluídas “somem” do painel.
    await ensureAccessSchema();
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

const VALID_SUBJECTS = new Set<Subject>(["redacao", "exatas", "matematica"]);

/** Matrícula presencial (secretaria cria uma matrícula já concluída). */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | (Partial<AdminEnrollInput> & { courses?: unknown })
    | null;
  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Valida enums de negócio antes de gravar.
  const modality = body.modality as Modality;
  const plan = body.plan as Plan;
  const paymentMethod = body.paymentMethod as PaymentMethod;
  if (!modality || !(modality in MODALITY_LABELS)) {
    return NextResponse.json({ error: "Modalidade inválida" }, { status: 400 });
  }
  if (!plan || !(plan in PLAN_LABELS)) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }
  if (!paymentMethod || !(paymentMethod in PAYMENT_LABELS)) {
    return NextResponse.json(
      { error: "Forma de pagamento inválida" },
      { status: 400 }
    );
  }

  const rawCourses = Array.isArray(body.courses) ? body.courses : [];
  const courses = rawCourses
    .map((c) => c as { subject?: string; classCode?: string })
    .filter(
      (c): c is { subject: Subject; classCode: string } =>
        typeof c.subject === "string" &&
        VALID_SUBJECTS.has(c.subject as Subject) &&
        typeof c.classCode === "string" &&
        c.classCode.length > 0
    );
  if (courses.length === 0) {
    return NextResponse.json(
      { error: "Selecione pelo menos uma turma." },
      { status: 400 }
    );
  }

  try {
    const result = await adminCreateEnrollment({
      fullName: String(body.fullName || ""),
      birthDateIso: body.birthDateIso || null,
      email: body.email || null,
      phone: String(body.phone || ""),
      grade: String(body.grade || ""),
      school: body.school || null,
      cpf: body.cpf || null,
      rg: body.rg || null,
      address: body.address || null,
      instagram: body.instagram || null,
      referralSource: body.referralSource || null,
      fatherName: body.fatherName || null,
      fatherPhone: body.fatherPhone || null,
      motherName: body.motherName || null,
      motherPhone: body.motherPhone || null,
      principalGuardian:
        body.principalGuardian === "mae" ? "mae" : "pai",
      courses,
      modality,
      plan,
      paymentMethod,
      autoRenew: Boolean(body.autoRenew),
      payment: body.payment || null,
      createdByName: session.email || null,
      sendConfirmationEmail: body.sendConfirmationEmail !== false,
    });

    const db = getDb();
    await db.insert(auditLogs).values({
      adminUserId: session.userId,
      action: "admin_create_enrollment",
      entityType: "enrollment",
      entityId: result.enrollmentId,
      meta: JSON.stringify({
        enrollmentNumber: result.enrollmentNumber,
        courses: courses.map((c) => c.classCode),
        modality,
        plan,
        paymentMethod,
      }),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const code = err instanceof Error ? err.message : "ERRO";
    const map: Record<string, string> = {
      NOME_OBRIGATORIO: "Informe o nome do aluno.",
      TELEFONE_OBRIGATORIO: "Informe o telefone do aluno.",
      SERIE_OBRIGATORIA: "Informe a série do aluno.",
      TURMA_OBRIGATORIA: "Selecione pelo menos uma turma.",
      TURMA_INVALIDA: "Turma inválida.",
      MATERIA_DUPLICADA: "Selecione só uma turma por matéria.",
      DADOS_INCOMPLETOS: "Preencha modalidade, plano e forma de pagamento.",
    };
    console.error(err);
    return NextResponse.json(
      { error: map[code] || "Não foi possível criar a matrícula." },
      { status: 400 }
    );
  }
}
