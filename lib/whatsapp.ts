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

  const lines = [
    `Olá! Acabei de concluir minha matrícula na ${COMPANY.name}. Segue meu resumo:`,
    "",
    `👤 Aluno: ${data.fullName}`,
    `📚 Curso: ${coursesText}`,
    `💳 Modalidade: ${MODALITY_LABELS[data.modality]} · Plano: ${PLAN_LABELS[data.plan]}`,
    `💵 Forma de pagamento: ${PAYMENT_LABELS[data.paymentMethod]}`,
    `💰 Valor do plano: ${formatBRL(data.planTotal)}`,
  ];

  if (data.enrollmentFee != null) {
    lines.push(`🧾 Taxa de matrícula: ${formatBRL(data.enrollmentFee)}`);
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
