/**
 * Tipos de código promocional de bolsa.
 * - full: 100% (isenta mensalidade e taxa)
 * - half: 50% do valor cheio (Modalidade 3), taxa normal
 * - redacao_100: redação fixa em R$ 100/mês; demais matérias na modalidade; taxa normal
 */

export type ScholarshipKind = "full" | "half" | "redacao_100";

export const SCHOLARSHIP_KINDS: ScholarshipKind[] = [
  "full",
  "half",
  "redacao_100",
];

export const SCHOLARSHIP_KIND_LABELS: Record<ScholarshipKind, string> = {
  full: "Bolsa 100%",
  half: "Bolsa 50%",
  redacao_100: "Bolsa redação R$ 100",
};

export const SCHOLARSHIP_KIND_HINTS: Record<ScholarshipKind, string> = {
  full: "Isenta mensalidade e taxa de matrícula.",
  half: "Metade do valor cheio (Modalidade 3) em todas as matérias. Taxa normal.",
  redacao_100:
    "Redação fica em R$ 100/mês; outras matérias no preço da modalidade. Taxa normal.",
};

export function parseScholarshipKind(value: unknown): ScholarshipKind {
  if (value === "half" || value === "redacao_100" || value === "full") {
    return value;
  }
  // Códigos antigos sem coluna kind = bolsa integral.
  return "full";
}

export function isScholarshipKind(value: unknown): value is ScholarshipKind {
  return value === "full" || value === "half" || value === "redacao_100";
}

/** Bolsa 100% — pula pagamento e zera tudo. */
export function isFullScholarship(
  kind: ScholarshipKind | null | undefined
): boolean {
  return kind === "full";
}

export function scholarshipBannerText(kind: ScholarshipKind): string {
  switch (kind) {
    case "full":
      return "Bolsa 100% — mensalidade e taxa isentas.";
    case "half":
      return "Bolsa 50% — metade do valor cheio (Modalidade 3). Taxa de matrícula normal.";
    case "redacao_100":
      return "Bolsa redação — R$ 100/mês na redação; demais cursos no preço da modalidade. Taxa normal.";
  }
}

/** Resolve o tipo a partir do rascunho (códigos antigos sem kind = full). */
export function draftScholarshipKind(draft: {
  scholarshipValid?: boolean;
  scholarshipKind?: ScholarshipKind | string | null;
}): ScholarshipKind | null {
  if (!draft.scholarshipValid) return null;
  return parseScholarshipKind(draft.scholarshipKind ?? "full");
}
