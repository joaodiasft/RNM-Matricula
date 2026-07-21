import type { Subject } from "./courses";

export type Modality = "desconto" | "desconto_parcial" | "normal";
export type Plan = "mensal" | "trimestral" | "total";
export type PaymentMethod = "dinheiro" | "cartao" | "pix";

export const MODALITY_LABELS: Record<Modality, string> = {
  desconto: "1 — Com desconto",
  desconto_parcial: "2 — Desconto parcial",
  normal: "3 — Normal",
};

export const MODALITY_OBLIGATIONS: Record<Modality, string> = {
  desconto:
    "Ajudar a divulgar o curso (WhatsApp e Instagram) + trazer pelo menos 1 aluno novo",
  desconto_parcial: "Ajudar a divulgar o curso (WhatsApp e Instagram)",
  normal: "Nenhuma — só assistir às aulas",
};

export const PLAN_LABELS: Record<Plan, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral (Ago–Out)",
  total: "Total (Ago–Nov)",
};

export const PLAN_MONTHS: Record<Plan, number> = {
  mensal: 1,
  trimestral: 3,
  total: 4,
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro à vista",
  cartao: "Cartão (crédito ou débito)",
  pix: "Pix",
};

/** Valor mensal por modalidade e matéria */
const MONTHLY: Record<Modality, Record<Subject, number>> = {
  desconto: { redacao: 150, exatas: 150, matematica: 150 },
  desconto_parcial: { redacao: 200, exatas: 200, matematica: 200 },
  normal: { redacao: 250, exatas: 300, matematica: 250 },
};

export function getMonthlyValue(modality: Modality, subjects: Subject[]): number {
  return subjects.reduce((sum, s) => sum + MONTHLY[modality][s], 0);
}

export function getEnrollmentFee(courseCount: number): number {
  if (courseCount <= 0) return 0;
  if (courseCount === 1) return 100;
  return 50;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export type PricingBreakdown = {
  monthlyValue: number;
  months: number;
  planSubtotal: number;
  cashDiscount: number;
  planTotal: number;
  enrollmentFee: number;
  grandTotal: number;
  calculationLabel: string;
  cardFeeNote?: string;
};

export function calculatePricing(input: {
  modality: Modality;
  plan: Plan;
  paymentMethod: PaymentMethod;
  subjects: Subject[];
  cardFeePercent?: number;
}): PricingBreakdown {
  const monthlyValue = getMonthlyValue(input.modality, input.subjects);
  const months = PLAN_MONTHS[input.plan];
  const planSubtotal = monthlyValue * months;

  let cashDiscount = 0;
  let planTotal = planSubtotal;

  if (input.paymentMethod === "dinheiro") {
    cashDiscount = Math.round(planSubtotal * 0.05 * 100) / 100;
    planTotal = planSubtotal - cashDiscount;
  }

  const enrollmentFee = getEnrollmentFee(input.subjects.length);
  const grandTotal = planTotal + enrollmentFee;

  const calculationLabel =
    months === 1
      ? `${formatBRL(monthlyValue)} / mês`
      : `${formatBRL(monthlyValue)} × ${months} meses = ${formatBRL(planSubtotal)}`;

  const cardFeeNote =
    input.paymentMethod === "cartao" && input.cardFeePercent != null
      ? `Sujeito à taxa da maquininha (~${input.cardFeePercent}%) no momento do pagamento.`
      : undefined;

  return {
    monthlyValue,
    months,
    planSubtotal,
    cashDiscount,
    planTotal,
    enrollmentFee,
    grandTotal,
    calculationLabel,
    cardFeeNote,
  };
}

export function getSubjectMonthly(modality: Modality, subject: Subject): number {
  return MONTHLY[modality][subject];
}
