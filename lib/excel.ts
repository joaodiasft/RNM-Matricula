import { and, eq, gte, lte, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { getDb } from "./db";
import {
  enrollmentCourses,
  enrollments,
  guardians,
  students,
} from "./db/schema";
import { getClassByCode, SUBJECT_LABELS } from "./courses";
import { calcAge, isoToBrDate } from "./validation";
import {
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "./pricing";

export async function buildEnrollmentsWorkbook(opts?: {
  from?: Date;
  to?: Date;
  onlyCompleted?: boolean;
}) {
  const db = getDb();

  const conditions = [];
  if (opts?.onlyCompleted !== false) {
    conditions.push(eq(enrollments.status, "concluida"));
  }
  if (opts?.from) {
    conditions.push(gte(enrollments.completedAt, opts.from));
  }
  if (opts?.to) {
    conditions.push(lte(enrollments.completedAt, opts.to));
  }

  const rows = await db
    .select({
      enrollment: enrollments,
      student: students,
      guardian: guardians,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.studentId, students.id))
    .leftJoin(guardians, eq(guardians.studentId, students.id))
    .where(conditions.length ? and(...conditions) : undefined);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Redação Nota Mil";
  const sheet = workbook.addWorksheet("Matrículas");

  sheet.columns = [
    { header: "Data/Hora da matrícula", key: "completedAt", width: 22 },
    { header: "Nome completo do aluno", key: "fullName", width: 28 },
    { header: "Data de nascimento", key: "birthDate", width: 16 },
    { header: "Idade", key: "age", width: 8 },
    { header: "E-mail", key: "email", width: 28 },
    { header: "Telefone/WhatsApp", key: "phone", width: 18 },
    { header: "Série atual", key: "grade", width: 14 },
    { header: "Onde estuda", key: "school", width: 24 },
    { header: "CPF", key: "cpf", width: 16 },
    { header: "RG", key: "rg", width: 14 },
    { header: "Endereço", key: "address", width: 30 },
    { header: "Nome do pai / telefone", key: "father", width: 28 },
    { header: "Nome da mãe / telefone", key: "mother", width: 28 },
    { header: "Curso(s) e turma(s)", key: "courses", width: 40 },
    { header: "Modalidade", key: "modality", width: 22 },
    { header: "Plano de pagamento", key: "plan", width: 18 },
    { header: "Valor mensal", key: "monthly", width: 12 },
    { header: "Valor total do plano", key: "planTotal", width: 16 },
    { header: "Forma de pagamento", key: "payment", width: 18 },
    { header: "Rematrícula automática", key: "autoRenew", width: 14 },
    { header: "Status", key: "status", width: 14 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    const e = row.enrollment;
    const s = row.student;
    const g = row.guardian;

    const courses = await db
      .select()
      .from(enrollmentCourses)
      .where(eq(enrollmentCourses.enrollmentId, e.id));

    const coursesText = courses
      .map((c) => {
        const info = getClassByCode(c.classCode);
        const label =
          SUBJECT_LABELS[c.subject as keyof typeof SUBJECT_LABELS] ?? c.subject;
        return `${label} ${c.classCode}${info ? ` (${info.day} ${info.schedule})` : ""}`;
      })
      .join("; ");

    const age = s?.birthDate ? calcAge(s.birthDate) : null;

    sheet.addRow({
      completedAt: e.completedAt
        ? new Date(e.completedAt).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        : "",
      fullName: s?.fullName ?? "",
      birthDate: s?.birthDate ? isoToBrDate(s.birthDate) : "",
      age: age ?? "",
      email: s?.email ?? "",
      phone: s?.phone ?? "",
      grade: s?.grade ?? "",
      school: s?.school ?? "",
      cpf: s?.cpf ?? "",
      rg: s?.rg ?? "",
      address: s?.address ?? "",
      father: [g?.fatherName, g?.fatherPhone].filter(Boolean).join(" / "),
      mother: [g?.motherName, g?.motherPhone].filter(Boolean).join(" / "),
      courses: coursesText,
      modality: e.modality
        ? MODALITY_LABELS[e.modality as Modality] ?? e.modality
        : "",
      plan: e.plan ? PLAN_LABELS[e.plan as Plan] ?? e.plan : "",
      monthly: e.monthlyValue ?? "",
      planTotal: e.planTotal ?? "",
      payment: e.paymentMethod
        ? PAYMENT_LABELS[e.paymentMethod as PaymentMethod] ?? e.paymentMethod
        : "",
      autoRenew: e.autoRenew ? "Sim" : "Não",
      status:
        e.status === "concluida"
          ? "Concluída"
          : e.status === "abandonada"
            ? "Abandonada"
            : "Em andamento",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(buffer),
    rowCount: rows.length,
  };
}

export async function countEnrollmentsSince(since: Date) {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(
      and(eq(enrollments.status, "concluida"), gte(enrollments.completedAt, since))
    );
  return result[0]?.count ?? 0;
}
