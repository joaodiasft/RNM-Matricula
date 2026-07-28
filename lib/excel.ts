import { and, eq, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  enrollmentCourses,
  enrollments,
  guardians,
  referrals,
  students,
} from "./db/schema";
import { getClassByCode, SUBJECT_LABELS } from "./courses";
import { calcAge, isoToBrDate, type EnrollmentDraft } from "./validation";

const REFERRAL_SOURCE_LABELS: Record<string, string> = {
  indicacao: "Indicação de amigo/aluno",
  instagram: "Instagram",
  google: "Google",
  outro: "Outro",
};

const OBLIGATION_LABELS: Record<string, string> = {
  pendente: "Pendente",
  cumprida: "Cumprida",
  nao_cumprida: "Não cumprida",
};

const STATUS_LABELS: Record<string, string> = {
  concluida: "Concluída",
  abandonada: "Abandonada",
  em_andamento: "Em andamento",
  alerta_duplicidade: "Alerta de duplicidade",
};
import {
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "./pricing";

/** Gera planilha compatível com Excel sem exceljs (instável em Workers). */
export async function buildEnrollmentsWorkbook(opts?: {
  from?: Date;
  to?: Date;
  onlyCompleted?: boolean;
  enrollmentId?: string;
}) {
  const db = getDb();

  const conditions = [];
  if (opts?.enrollmentId) {
    conditions.push(eq(enrollments.id, opts.enrollmentId));
  } else {
    if (opts?.onlyCompleted !== false) {
      conditions.push(eq(enrollments.status, "concluida"));
    }
    if (opts?.from) {
      conditions.push(gte(enrollments.completedAt, opts.from));
    }
    if (opts?.to) {
      conditions.push(lte(enrollments.completedAt, opts.to));
    }
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

  const headers = [
    "Data/Hora da matrícula",
    "Nome completo do aluno",
    "Data de nascimento",
    "Idade",
    "Faixa etária",
    "E-mail",
    "Telefone/WhatsApp",
    "Série atual",
    "Onde estuda",
    "CPF",
    "RG",
    "Endereço",
    "Como conheceu",
    "Observações",
    "Contrato já assinado",
    "Nome do pai / telefone",
    "Nome da mãe / telefone",
    "Curso(s) e turma(s)",
    "Modalidade",
    "Situação da obrigação",
    "Código de indicação gerado",
    "Código de indicação usado",
    "Plano de pagamento",
    "Valor mensal",
    "Valor total do plano",
    "Taxa de matrícula",
    "Forma de pagamento",
    "Rematrícula automática",
    "Situação",
  ];

  const lines: string[] = [headers.map(csvEscape).join(";")];

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

    const draft: EnrollmentDraft = e.draftData
      ? (JSON.parse(e.draftData) as EnrollmentDraft)
      : {};

    const [generatedRef] = await db
      .select({ code: referrals.code })
      .from(referrals)
      .where(eq(referrals.referrerEnrollmentId, e.id))
      .limit(1);

    const age = s?.birthDate ? calcAge(s.birthDate) : null;
    const ageBand = age == null ? "" : age < 18 ? "Menor de idade" : "Maior de idade";
    const statusLabel = STATUS_LABELS[e.status] ?? e.status;
    const feeNumber = e.enrollmentFee != null ? Number(e.enrollmentFee) : null;
    const feeText =
      feeNumber == null ? "" : feeNumber > 0 ? String(e.enrollmentFee) : "isenta";

    const cells = [
      e.completedAt
        ? new Date(e.completedAt).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        : "",
      s?.fullName ?? "",
      s?.birthDate ? isoToBrDate(s.birthDate) : "",
      age ?? "",
      ageBand,
      s?.email ?? "",
      s?.phone ?? "",
      s?.grade ?? "",
      s?.school ?? "",
      s?.cpf ?? "",
      s?.rg ?? "",
      s?.address ?? "",
      s?.referralSource
        ? (REFERRAL_SOURCE_LABELS[s.referralSource] ?? s.referralSource)
        : "",
      draft.observations ?? "",
      draft.contractSigned ? "Sim" : "Não",
      [g?.fatherName, g?.fatherPhone].filter(Boolean).join(" / "),
      [g?.motherName, g?.motherPhone].filter(Boolean).join(" / "),
      coursesText,
      e.modality
        ? (MODALITY_LABELS[e.modality as Modality] ?? e.modality)
        : "",
      e.obligationStatus
        ? (OBLIGATION_LABELS[e.obligationStatus] ?? e.obligationStatus)
        : "",
      generatedRef?.code ?? "",
      e.referralCodeUsed ?? "",
      e.plan ? (PLAN_LABELS[e.plan as Plan] ?? e.plan) : "",
      e.monthlyValue ?? "",
      e.planTotal ?? "",
      feeText,
      e.paymentMethod
        ? (PAYMENT_LABELS[e.paymentMethod as PaymentMethod] ?? e.paymentMethod)
        : "",
      e.autoRenew ? "Sim" : "Não",
      statusLabel,
    ];

    lines.push(cells.map(csvEscape).join(";"));
  }

  // BOM UTF-8 para o Excel abrir acentos corretamente
  const csv = `\uFEFF${lines.join("\r\n")}`;
  const buffer = new TextEncoder().encode(csv);

  return {
    buffer,
    rowCount: rows.length,
    contentType: "text/csv; charset=utf-8",
    extension: "csv" as const,
  };
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
