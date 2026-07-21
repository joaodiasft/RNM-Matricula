"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  calculatePricing,
  formatBRL,
  PLAN_LABELS,
  PLAN_MONTHS,
  type Modality,
  type Plan,
} from "@/lib/pricing";
import type { Subject } from "@/lib/courses";
import { NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

const PLANS: Plan[] = ["mensal", "trimestral", "total"];

export function StepPlan({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const subjects = (draft.courses ?? []).map((c) => c.subject) as Subject[];
  const modality = draft.modality as Modality | undefined;

  const submit = () => {
    if (!draft.plan) {
      setError("Escolha um plano de pagamento");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div>
      <StepTitle
        title="Plano de pagamento"
        subtitle="Veja o cálculo completo — não só o total."
      />

      {!modality && (
        <p className="text-sm text-danger">Escolha a modalidade antes.</p>
      )}

      <div className="space-y-3">
        {PLANS.map((plan) => {
          if (!modality) return null;
          const pricing = calculatePricing({
            modality,
            plan,
            paymentMethod: "pix",
            subjects,
          });
          const months = PLAN_MONTHS[plan];
          const selected = draft.plan === plan;

          return (
            <button
              key={plan}
              type="button"
              onClick={() => onChange({ plan })}
              className={[
                "w-full rounded-xl border px-4 py-4 text-left transition",
                selected
                  ? "border-brand bg-brand-soft ring-2 ring-brand/30"
                  : "border-line bg-bg",
              ].join(" ")}
            >
              <p className="font-semibold text-fg">{PLAN_LABELS[plan]}</p>
              <p className="mt-2 text-sm text-muted">
                {months === 1
                  ? `${formatBRL(pricing.monthlyValue)} por mês`
                  : `${formatBRL(pricing.monthlyValue)} × ${months} meses = ${formatBRL(pricing.planSubtotal)}`}
              </p>
              <p className="mt-1 text-xs text-muted">
                + taxa de matrícula {formatBRL(pricing.enrollmentFee)}
              </p>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
