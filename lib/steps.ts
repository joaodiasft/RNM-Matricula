export const STEP_NAMES = [
  "Dados do aluno",
  "Responsáveis",
  "Turmas",
  "Informações do curso",
  "Modalidade e valores",
  "Plano de pagamento",
  "Forma de pagamento",
  "Rematrícula",
  "Avisos finais",
  "Revisão",
] as const;

type StepOpts = {
  age?: number | null;
  plan?: string | null;
};

/** Índices lógicos 1–10 (passo 2 e 8 podem ser pulados) */
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

  let all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (age !== null && age >= 18) {
    all = all.filter((s) => s !== 2);
  }
  // Rematrícula automática só faz sentido no plano mensal
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
  const nameIdx = step - 1;
  return {
    current: idx + 1,
    total: visible.length,
    label: STEP_NAMES[nameIdx] ?? `Passo ${step}`,
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
