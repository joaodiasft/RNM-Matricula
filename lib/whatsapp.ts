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
  courses: { subject: string; classCode: string }[];
  modality: Modality;
  plan: Plan;
  planTotal: number;
};

export function buildWhatsAppMessage(data: WhatsAppPayload): string {
  const coursesText = data.courses
    .map((c) => {
      const info = getClassByCode(c.classCode);
      const subject = SUBJECT_LABELS[c.subject as keyof typeof SUBJECT_LABELS] ?? c.subject;
      return `${subject} — Turma ${c.classCode}${info ? ` (${info.day} ${info.schedule})` : ""}`;
    })
    .join("\n📚 Curso: ");

  return [
    `Olá! Acabei de concluir minha matrícula na ${COMPANY.name}. Segue meu resumo:`,
    "",
    `👤 Aluno: ${data.fullName}`,
    `📚 Curso: ${coursesText}`,
    `💳 Modalidade: ${MODALITY_LABELS[data.modality]} · Plano: ${PLAN_LABELS[data.plan]}`,
    `💰 Valor: ${formatBRL(data.planTotal)}`,
    `📱 Contato: ${data.phone}`,
    "",
    "Este é o registro da minha matrícula. Obrigado(a)!",
  ].join("\n");
}

export function buildWhatsAppUrl(data: WhatsAppPayload): string {
  const text = encodeURIComponent(buildWhatsAppMessage(data));
  return `https://wa.me/${COMPANY.phoneDigits}?text=${text}`;
}

export function paymentLabel(method: PaymentMethod): string {
  return PAYMENT_LABELS[method];
}
