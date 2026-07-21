"use client";

import type { EnrollmentDraft } from "@/lib/validation";
import { NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepAutoRenew({ draft, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <StepTitle
        title="Rematrícula automática"
        subtitle="Podemos renovar automaticamente com a mesma turma e forma de pagamento escolhidas."
      />

      <div className="mb-5 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm leading-relaxed">
        A modalidade escolhida vale até o fim do curso. Só é possível alterar na
        secretaria.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange({ autoRenew: true })}
          className={[
            "rounded-xl border px-4 py-5 text-left font-semibold transition",
            draft.autoRenew === true
              ? "border-brand bg-brand-soft ring-2 ring-brand/30"
              : "border-line bg-bg",
          ].join(" ")}
        >
          Sim, ativar
        </button>
        <button
          type="button"
          onClick={() => onChange({ autoRenew: false })}
          className={[
            "rounded-xl border px-4 py-5 text-left font-semibold transition",
            draft.autoRenew === false
              ? "border-brand bg-brand-soft ring-2 ring-brand/30"
              : "border-line bg-bg",
          ].join(" ")}
        >
          Não, obrigado
        </button>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={draft.autoRenew === undefined}
      />
    </div>
  );
}
