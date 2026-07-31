/**
 * Export CSV de matrículas — formato pensado para Excel (BR).
 * Separador `;`, UTF-8 com BOM, datas e valores em pt-BR.
 */

import { and, eq, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  enrollmentCourses,
  enrollments,
  guardians,
  referrals,
  students,
} from "./db/schema";
import { getClassByCode, SUBJECT_LABELS, type Subject } from "./courses";
import { calcAge, isoToBrDate, type EnrollmentDraft } from "./validation";
import {
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "./pricing";
import {
  SCHOLARSHIP_KIND_LABELS,
  parseScholarshipKind,
} from "./scholarship";
import { monthLabel } from "./billing";

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

const PAY_STATUS_LABELS: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
  isento: "Isento",
};

function fmtDateTime(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMoney(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtYesNo(v: boolean | null | undefined): string {
  if (v == null) return "";
  return v ? "Sim" : "Não";
}

function fmtInstagram(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const h = String(raw).trim().replace(/^@/, "");
  return h ? `@${h}` : "";
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Cabeçalhos na ordem de leitura da secretaria. */
const HEADERS = [
  "Nº matrícula",
  "Data/hora da conclusão",
  "Situação",
  "Nome completo do aluno",
  "Data de nascimento",
  "Idade",
  "Faixa etária",
  "E-mail",
  "Telefone/WhatsApp",
  "Instagram",
  "Série atual",
  "Onde estuda",
  "CPF",
  "RG",
  "Endereço",
  "Como conheceu",
  "Observações",
  "Contrato já assinado",
  "Nome do pai",
  "Telefone do pai",
  "Nome da mãe",
  "Telefone da mãe",
  "Cursos e turmas",
  "Turma Redação",
  "Turma Exatas",
  "Turma Matemática",
  "Modalidade",
  "Ciência dos compromissos",
  "Assinatura dos compromissos",
  "Segue Instagram do curso",
  "Situação da obrigação",
  "Prazo da obrigação",
  "Plano de pagamento",
  "Valor mensal",
  "Valor total do plano",
  "Taxa de matrícula",
  "Forma de pagamento",
  "Rematrícula automática",
  "Tipo de bolsa",
  "Código de bolsa usado",
  "Código de indicação gerado",
  "Código de indicação usado",
  "Pagamento — situação",
  "Pagamento — mês de referência",
  "Pagamento — forma",
  "Pagamento — pago em",
] as const;

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

  // Ordena concluídas pela data de conclusão (mais recentes primeiro).
  rows.sort((a, b) => {
    const ta = a.enrollment.completedAt
      ? new Date(a.enrollment.completedAt).getTime()
      : 0;
    const tb = b.enrollment.completedAt
      ? new Date(b.enrollment.completedAt).getTime()
      : 0;
    return tb - ta;
  });

  const lines: string[] = [HEADERS.map(csvEscape).join(";")];

  for (const row of rows) {
    const e = row.enrollment;
    const s = row.student;
    const g = row.guardian;

    const courses = await db
      .select()
      .from(enrollmentCourses)
      .where(eq(enrollmentCourses.enrollmentId, e.id));

    const bySubject: Partial<Record<Subject, string>> = {};
    const coursesText = courses
      .map((c) => {
        const subject = c.subject as Subject;
        const info = getClassByCode(c.classCode);
        const label = SUBJECT_LABELS[subject] ?? c.subject;
        const wait = c.onWaitlist ? " [lista de espera]" : "";
        const detail = info ? ` (${info.day} ${info.schedule})` : "";
        const cell = `${c.classCode}${detail}${wait}`;
        bySubject[subject] = cell;
        return `${label} ${cell}`;
      })
      .join(" · ");

    const draft: EnrollmentDraft = e.draftData
      ? (JSON.parse(e.draftData) as EnrollmentDraft)
      : {};

    const [generatedRef] = await db
      .select({ code: referrals.code })
      .from(referrals)
      .where(eq(referrals.referrerEnrollmentId, e.id))
      .limit(1);

    const age = s?.birthDate ? calcAge(s.birthDate) : null;
    const ageBand =
      age == null ? "" : age < 18 ? "Menor de idade" : "Maior de idade";

    const feeNumber = e.enrollmentFee != null ? Number(e.enrollmentFee) : null;
    const feeText =
      feeNumber == null
        ? ""
        : feeNumber <= 0
          ? "Isenta"
          : fmtMoney(e.enrollmentFee);

    const bolsaKind =
      draft.scholarshipValid && draft.scholarshipKind
        ? parseScholarshipKind(draft.scholarshipKind)
        : draft.scholarshipValid
          ? ("full" as const)
          : null;

    const cells = [
      e.enrollmentNumber ?? "",
      fmtDateTime(e.completedAt),
      STATUS_LABELS[e.status] ?? e.status,
      s?.fullName ?? draft.fullName ?? "",
      s?.birthDate ? isoToBrDate(s.birthDate) : draft.birthDateBr ?? "",
      age ?? "",
      ageBand,
      s?.email ?? draft.email ?? "",
      s?.phone ?? draft.phone ?? "",
      fmtInstagram(draft.instagram),
      s?.grade ?? draft.grade ?? "",
      s?.school ?? draft.school ?? "",
      s?.cpf ?? draft.cpf ?? "",
      s?.rg ?? draft.rg ?? "",
      s?.address ?? draft.address ?? "",
      s?.referralSource
        ? (REFERRAL_SOURCE_LABELS[s.referralSource] ?? s.referralSource)
        : draft.referralSource
          ? (REFERRAL_SOURCE_LABELS[draft.referralSource] ?? draft.referralSource)
          : "",
      draft.observations ?? "",
      fmtYesNo(draft.contractSigned === true),
      g?.fatherName ?? draft.fatherName ?? "",
      g?.fatherPhone ?? draft.fatherPhone ?? "",
      g?.motherName ?? draft.motherName ?? "",
      g?.motherPhone ?? draft.motherPhone ?? "",
      coursesText,
      bySubject.redacao ?? "",
      bySubject.exatas ?? "",
      bySubject.matematica ?? "",
      e.modality
        ? (MODALITY_LABELS[e.modality as Modality] ?? e.modality)
        : "",
      fmtYesNo(draft.modalityDutyAck === true),
      draft.modalityDutySignature ?? "",
      fmtYesNo(draft.modalityDutyFollowedIg === true),
      e.obligationStatus
        ? (OBLIGATION_LABELS[e.obligationStatus] ?? e.obligationStatus)
        : "",
      e.obligationDeadline
        ? isoToBrDate(String(e.obligationDeadline).slice(0, 10))
        : "",
      e.plan ? (PLAN_LABELS[e.plan as Plan] ?? e.plan) : "",
      fmtMoney(e.monthlyValue),
      fmtMoney(e.planTotal),
      feeText,
      e.paymentMethod
        ? (PAYMENT_LABELS[e.paymentMethod as PaymentMethod] ?? e.paymentMethod)
        : "",
      fmtYesNo(e.autoRenew === true),
      bolsaKind ? SCHOLARSHIP_KIND_LABELS[bolsaKind] : "",
      draft.scholarshipCode ?? "",
      generatedRef?.code ?? "",
      e.referralCodeUsed ?? "",
      e.paymentStatus
        ? (PAY_STATUS_LABELS[e.paymentStatus] ?? e.paymentStatus)
        : "",
      e.paymentMonth ? monthLabel(e.paymentMonth) : "",
      e.paymentForm ?? "",
      e.paymentPaidOn
        ? isoToBrDate(String(e.paymentPaidOn).slice(0, 10))
        : "",
    ];

    lines.push(cells.map(csvEscape).join(";"));
  }

  const csv = `\uFEFF${lines.join("\r\n")}`;
  const buffer = new TextEncoder().encode(csv);

  return {
    buffer,
    rowCount: rows.length,
    contentType: "text/csv; charset=utf-8",
    extension: "csv" as const,
  };
}
