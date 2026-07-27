import { COMPANY } from "./company";
import { getClassByCode, SUBJECT_LABELS } from "./courses";
import {
  formatBRL,
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "./pricing";

export type WhatsAppPayload = {
  fullName: string;
  phone: string;
  email: string;
  courses: { subject: string; classCode: string }[];
  modality: Modality;
  plan: Plan;
  paymentMethod: PaymentMethod;
  planTotal: number;
  enrollmentFee?: number;
  scholarship?: boolean;
  invoice?: {
    name: string;
    cpf: string;
    address: string;
    phone: string;
    notes?: string;
  } | null;
};

export function buildWhatsAppMessage(data: WhatsAppPayload): string {
  const coursesText = data.courses
    .map((c) => {
      const info = getClassByCode(c.classCode);
      const subject =
        SUBJECT_LABELS[c.subject as keyof typeof SUBJECT_LABELS] ?? c.subject;
      return `${subject} — Turma ${c.classCode}${info ? ` (${info.day} ${info.schedule})` : ""}`;
    })
    .join("\n📚 Curso: ");

  const isBolsa = data.scholarship === true || data.paymentMethod === "isento";

  const lines = [
    `Olá! Acabei de concluir minha matrícula na ${COMPANY.name}. Segue meu resumo:`,
    "",
    `👤 Aluno: ${data.fullName}`,
    `📚 Curso: ${coursesText}`,
    `💳 Modalidade: ${MODALITY_LABELS[data.modality]} · Plano: ${PLAN_LABELS[data.plan]}`,
    isBolsa
      ? `💵 Pagamento: Isento — bolsa integral (100%)`
      : `💵 Forma de pagamento: ${PAYMENT_LABELS[data.paymentMethod]}`,
    isBolsa
      ? `💰 Valor do plano: R$ 0,00`
      : `💰 Valor do plano: ${formatBRL(data.planTotal)}`,
  ];

  if (isBolsa) {
    lines.push(`🧾 Taxa de matrícula: isenta`);
  } else if (data.enrollmentFee != null) {
    lines.push(`🧾 Taxa de matrícula: ${formatBRL(data.enrollmentFee)}`);
  }

  if (data.invoice) {
    lines.push(
      "",
      `📄 Nota fiscal (responsável): SIM`,
      `   Nome: ${data.invoice.name}`,
      `   CPF: ${data.invoice.cpf}`,
      `   Endereço: ${data.invoice.address}`,
      `   Telefone: ${data.invoice.phone}`
    );
    if (data.invoice.notes?.trim()) {
      lines.push(`   Obs.: ${data.invoice.notes.trim()}`);
    }
  }

  lines.push(
    `📱 Telefone/WhatsApp: ${data.phone}`,
    `✉️ E-mail: ${data.email}`,
    "",
    "Este é o registro da minha matrícula. Obrigado(a)!"
  );

  return lines.join("\n");
}

export function buildWhatsAppUrl(data: WhatsAppPayload): string {
  const text = encodeURIComponent(buildWhatsAppMessage(data));
  return `https://wa.me/${COMPANY.phoneDigits}?text=${text}`;
}

export function paymentLabel(method: PaymentMethod): string {
  return PAYMENT_LABELS[method];
}
