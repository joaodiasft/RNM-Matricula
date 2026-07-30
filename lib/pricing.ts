import type { Subject } from "./courses";
import {
  isFullScholarship,
  type ScholarshipKind,
} from "./scholarship";

export type Modality =
  | "desconto"
  | "desconto_parcial"
  | "normal"
  | "apmf";
export type Plan = "mensal" | "trimestral" | "total";
export type PaymentMethod = "dinheiro" | "cartao" | "pix" | "isento";

export type { ScholarshipKind };

/** Nome canônico do colégio elegível à Modalidade 4. */
export const APMF_SCHOOL_NAME =
  "Colégio Estadual Militar Ayrton Senna";

/**
 * Detecta o Colégio Estadual Militar Ayrton Senna no campo "Onde estuda",
 * tolerando erros comuns de digitação (estadual/estaual, Ayrton/Aryton, etc.).
 */
export function isApmfSchool(school: string | null | undefined): boolean {
  const n = (school || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!n) return false;
  const hasColegio = /\bcolegio\b/.test(n) || /\bcem\b/.test(n);
  const hasEstadual = /\bestadual\b/.test(n) || /\bestaual\b/.test(n);
  const hasMilitar = /\bmilitar\b/.test(n);
  const hasAyrton = /\bayrton\b/.test(n) || /\baryton\b/.test(n);
  const hasSenna = /\bsenna\b/.test(n);
  if (hasAyrton && hasSenna && (hasColegio || hasMilitar || hasEstadual)) {
    return true;
  }
  if (hasColegio && hasEstadual && hasMilitar && hasSenna) return true;
  return false;
}

export const MODALITY_LABELS: Record<Modality, string> = {
  desconto: "Modalidade 1 — Com desconto",
  desconto_parcial: "Modalidade 2 — Desconto parcial",
  normal: "Modalidade 3 — Normal",
  apmf: "Modalidade 4 — Ayrton Senna (APMF)",
};

export const MODALITY_SHORT: Record<Modality, string> = {
  desconto: "Maior desconto",
  desconto_parcial: "Desconto parcial",
  normal: "Sem compromisso de divulgação",
  apmf: "Ayrton Senna · APMF",
};

export const MODALITY_OBLIGATIONS: Record<Modality, string> = {
  desconto:
    "Ajudar na divulgação (foto no dia de aula e repostar marcações no Instagram) e trazer 1 aluno novo até o final do mês (vale também para o próximo módulo — ele precisa se matricular).",
  desconto_parcial:
    "Ajudar na divulgação: foto no dia de aula dentro da sala e repostar quando o curso marcar você no Instagram.",
  normal: "Sem obrigações de divulgação — só assistir às aulas.",
  apmf:
    "Desconto somente com apresentação da contribuição da APMF. Também ajudar na divulgação (foto no dia de aula e repostar marcações no Instagram).",
};

export const PLAN_LABELS: Record<Plan, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral (ago–out)",
  total: "Curso completo (ago–nov)",
};

export const PLAN_HINTS: Record<Plan, string> = {
  mensal: "Pague mês a mês. Ideal para acompanhar o orçamento.",
  trimestral: "Três mensalidades de uma vez (agosto a outubro).",
  total: "Quatro mensalidades de uma vez (agosto a novembro).",
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
  isento: "Isento — bolsa integral (100%)",
};

/** Valor mensal por modalidade e matéria */
const MONTHLY: Record<Modality, Record<Subject, number>> = {
  desconto: { redacao: 150, exatas: 150, matematica: 150 },
  desconto_parcial: { redacao: 200, exatas: 200, matematica: 200 },
  normal: { redacao: 250, exatas: 300, matematica: 250 },
  apmf: { redacao: 150, exatas: 150, matematica: 150 },
};

/** Valores de referência (modalidade normal) para exibir o desconto */
export const NORMAL_MONTHLY: Record<Subject, number> = {
  redacao: 250,
  exatas: 300,
  matematica: 250,
};

export function getMonthlyValue(modality: Modality, subjects: Subject[]): number {
  return subjects.reduce((sum, s) => sum + MONTHLY[modality][s], 0);
}

/** Mensalidade de uma matéria já aplicando o tipo de bolsa (se houver). */
export function getSubjectMonthlyWithScholarship(
  modality: Modality,
  subject: Subject,
  kind?: ScholarshipKind | null
): number {
  if (isFullScholarship(kind)) return 0;
  if (kind === "half") {
    return Math.round(NORMAL_MONTHLY[subject] * 0.5 * 100) / 100;
  }
  if (kind === "redacao_100" && subject === "redacao") return 100;
  return MONTHLY[modality][subject];
}

/** Soma mensal com bolsa parcial (half / redacao_100). */
export function getMonthlyValueWithScholarship(
  modality: Modality,
  subjects: Subject[],
  kind?: ScholarshipKind | null
): number {
  if (isFullScholarship(kind)) return 0;
  return subjects.reduce(
    (sum, s) => sum + getSubjectMonthlyWithScholarship(modality, s, kind),
    0
  );
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
  feeWaived: boolean;
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
  waivedFee?: boolean;
  /**
   * @deprecated Prefira `scholarshipKind`. `true` equivale a bolsa 100%.
   */
  scholarship?: boolean;
  /** Tipo de bolsa aplicada (null = sem bolsa). */
  scholarshipKind?: ScholarshipKind | null;
}): PricingBreakdown {
  const kind: ScholarshipKind | null =
    input.scholarshipKind ??
    (input.scholarship ? "full" : null);

  const months = PLAN_MONTHS[input.plan];

  // Bolsa 100% / isento: zera plano e taxa
  if (isFullScholarship(kind) || input.paymentMethod === "isento") {
    return {
      monthlyValue: 0,
      months,
      planSubtotal: 0,
      cashDiscount: 0,
      planTotal: 0,
      enrollmentFee: 0,
      feeWaived: true,
      grandTotal: 0,
      calculationLabel: "Bolsa 100% — sem cobrança de mensalidade ou taxa",
      cardFeeNote: undefined,
    };
  }

  const monthlyValue = getMonthlyValueWithScholarship(
    input.modality,
    input.subjects,
    kind
  );
  const planSubtotal = monthlyValue * months;

  let cashDiscount = 0;
  let planTotal = planSubtotal;

  // 5% à vista (dinheiro) SOMENTE na modalidade desconto parcial
  if (
    input.paymentMethod === "dinheiro" &&
    input.modality === "desconto_parcial"
  ) {
    cashDiscount = Math.round(planSubtotal * 0.05 * 100) / 100;
    planTotal = planSubtotal - cashDiscount;
  }

  const enrollmentFee = input.waivedFee
    ? 0
    : getEnrollmentFee(input.subjects.length);
  const grandTotal = planTotal + enrollmentFee;

  let calculationLabel =
    months === 1
      ? `${formatBRL(monthlyValue)} / mês`
      : `${formatBRL(monthlyValue)} × ${months} meses = ${formatBRL(planSubtotal)}`;

  if (kind === "half") {
    calculationLabel = `Bolsa 50% (valor cheio) · ${calculationLabel}`;
  } else if (kind === "redacao_100") {
    calculationLabel = `Bolsa redação R$ 100 · ${calculationLabel}`;
  }

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
    feeWaived: Boolean(input.waivedFee),
    grandTotal,
    calculationLabel,
    cardFeeNote,
  };
}

export function getSubjectMonthly(modality: Modality, subject: Subject): number {
  return MONTHLY[modality][subject];
}

/** Economia da modalidade 4 em relação ao valor normal (cheio). */
export function getApmfDiscount(subject: Subject): number {
  return NORMAL_MONTHLY[subject] - MONTHLY.apmf[subject];
}
