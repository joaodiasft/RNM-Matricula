"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  calculatePricing,
  formatBRL,
  PLAN_HINTS,
  PLAN_LABELS,
  PLAN_MONTHS,
  type Modality,
  type Plan,
} from "@/lib/pricing";
import type { Subject } from "@/lib/courses";
import { NavButtons, StepTitle } from "../ui";
import { useToast } from "@/components/ui/Toast";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

const PLANS: Plan[] = ["mensal", "trimestral", "total"];

export function StepPlan({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const subjects = (draft.courses ?? []).map((c) => c.subject) as Subject[];
  const modality = draft.modality as Modality | undefined;
  const isBolsa = draft.scholarshipValid === true;

  const submit = () => {
    if (!draft.plan) {
      setError("Escolha um plano de pagamento");
      toast.push({
        title: "Escolha o plano",
        message: "Selecione mensal, trimestral ou curso completo.",
        tone: "danger",
      });
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div>
      <StepTitle
        title="Plano de pagamento"
        subtitle="Veja o cálculo completo de cada opção antes de escolher."
      />

      {!modality && (
        <p className="mb-3 text-sm text-danger">Escolha a modalidade antes.</p>
      )}

      <div className="space-y-3">
        {PLANS.map((plan) => {
          if (!modality) return null;
          const pricing = calculatePricing({
            modality,
            plan,
            paymentMethod: "pix",
            subjects,
            waivedFee: draft.waivedFee,
            scholarship: isBolsa,
          });
          const months = PLAN_MONTHS[plan];
          const selected = draft.plan === plan;

          return (
            <button
              key={plan}
              type="button"
              onClick={() =>
                onChange({
                  plan,
                  ...(plan !== "mensal" ? { autoRenew: false } : {}),
                })
              }
              className={[
                "w-full rounded-2xl border px-4 py-4 text-left transition",
                selected
                  ? "border-brand bg-brand-soft/80 ring-2 ring-brand/25"
                  : "border-line bg-white hover:border-brand/35",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-ink">
                    {PLAN_LABELS[plan]}
                  </p>
                  <p className="mt-1 text-sm text-muted">{PLAN_HINTS[plan]}</p>
                </div>
                <span
                  className={[
                    "mt-1 h-5 w-5 shrink-0 rounded-full border-2",
                    selected
                      ? "border-brand bg-brand"
                      : "border-line bg-transparent",
                  ].join(" ")}
                />
              </div>

              <div className="mt-3 rounded-xl bg-bg-subtle px-3.5 py-3 text-sm">
                {isBolsa ? (
                  <p className="font-semibold text-success">
                    Sem cobrança neste plano (condição especial)
                  </p>
                ) : (
                  <>
                    <p className="font-semibold text-ink">
                      {months === 1
                        ? `${formatBRL(pricing.monthlyValue)} por mês`
                        : `${formatBRL(pricing.monthlyValue)} × ${months} = ${formatBRL(pricing.planSubtotal)}`}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      + taxa de matrícula {formatBRL(pricing.enrollmentFee)}
                      {pricing.feeWaived ? " (isenta)" : ""}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-brand">
                      Total referência: {formatBRL(pricing.grandTotal)}
                    </p>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
