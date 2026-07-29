export const STEP_LABELS: Record<number, string> = {
  1: "Dados do aluno",
  2: "Responsáveis",
  3: "Turmas",
  4: "Informações do curso",
  5: "Modalidade e valores",
  11: "Compromissos da modalidade",
  6: "Plano de pagamento",
  7: "Forma de pagamento",
  8: "Rematrícula",
  9: "Avisos finais",
  10: "Revisão",
};

type StepOpts = {
  age?: number | null;
  plan?: string | null;
  /** Bolsa 100%: pula forma de pagamento */
  scholarship?: boolean;
  modality?: string | null;
};

export function needsModalityDutyStep(modality?: string | null): boolean {
  return (
    modality === "desconto" ||
    modality === "desconto_parcial" ||
    modality === "apmf"
  );
}

/** Índices lógicos (passos 2, 7, 8 e 11 podem ser pulados) */
export function getVisibleSteps(
  ageOrOpts: number | null | StepOpts,
  planArg?: string | null
): number[] {
  const age =
    typeof ageOrOpts === "object" && ageOrOpts !== null
      ? (ageOrOpts.age ?? null)
      : ageOrOpts;
  const plan =
    typeof ageOrOpts === "object" && ageOrOpts !== null
      ? (ageOrOpts.plan ?? null)
      : (planArg ?? null);
  const scholarship =
    typeof ageOrOpts === "object" && ageOrOpts !== null
      ? Boolean(ageOrOpts.scholarship)
      : false;
  const modality =
    typeof ageOrOpts === "object" && ageOrOpts !== null
      ? (ageOrOpts.modality ?? null)
      : null;

  // 11 = compromissos da modalidade (logo após a escolha da modalidade)
  let all = [1, 2, 3, 4, 5, 11, 6, 7, 8, 9, 10];
  if (age !== null && age >= 18) {
    all = all.filter((s) => s !== 2);
  }
  if (!needsModalityDutyStep(modality)) {
    all = all.filter((s) => s !== 11);
  }
  if (scholarship) {
    all = all.filter((s) => s !== 7);
  }
  if (plan !== "mensal") {
    all = all.filter((s) => s !== 8);
  }
  return all;
}

export function stepDisplayIndex(
  step: number,
  ageOrOpts: number | null | StepOpts,
  planArg?: string | null
): {
  current: number;
  total: number;
  label: string;
} {
  const visible = getVisibleSteps(ageOrOpts, planArg);
  const idx = Math.max(0, visible.indexOf(step));
  return {
    current: idx + 1,
    total: visible.length,
    label: STEP_LABELS[step] ?? `Passo ${step}`,
  };
}

export function nextStep(
  current: number,
  ageOrOpts: number | null | StepOpts,
  planArg?: string | null
): number | null {
  const visible = getVisibleSteps(ageOrOpts, planArg);
  const i = visible.indexOf(current);
  if (i < 0 || i >= visible.length - 1) return null;
  return visible[i + 1];
}

export function prevStep(
  current: number,
  ageOrOpts: number | null | StepOpts,
  planArg?: string | null
): number | null {
  const visible = getVisibleSteps(ageOrOpts, planArg);
  const i = visible.indexOf(current);
  if (i <= 0) return null;
  return visible[i - 1];
}
