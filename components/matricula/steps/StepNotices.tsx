"use client";

import { useState, type ReactNode } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepNotices({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!draft.noticePayment || !draft.noticeAbsence || !draft.noticeModality) {
      setError("Marque todos os avisos para continuar");
      return;
    }
    setError(null);
    onNext();
  };

  const Item = ({
    checked,
    onToggle,
    children,
  }: {
    checked?: boolean;
    onToggle: (v: boolean) => void;
    children: ReactNode;
  }) => (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-line bg-bg p-4 text-sm leading-relaxed">
      <input
        type="checkbox"
        checked={checked === true}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1"
      />
      <span>
        {children}
        <span className="mt-2 block font-semibold text-brand">
          Estou ciente
        </span>
      </span>
    </label>
  );

  return (
    <div>
      <StepTitle
        title="Avisos finais"
        subtitle="Leia e confirme cada ponto antes de revisar a matrícula."
      />

      <div className="space-y-3">
        <Item
          checked={draft.noticePayment}
          onToggle={(v) => onChange({ noticePayment: v })}
        >
          Pagamento vence todo dia 5 do mês. Se não conseguir pagar em dia, é só
          avisar a secretaria — vamos te ajudar a organizar.
        </Item>
        <Item
          checked={draft.noticeAbsence}
          onToggle={(v) => onChange({ noticeAbsence: v })}
        >
          Faltas na Redação → falar com a secretaria para agendar a reposição.
        </Item>
        <Item
          checked={draft.noticeModality}
          onToggle={(v) => onChange({ noticeModality: v })}
        >
          A modalidade escolhida vale até o fim do curso e só pode ser alterada
          na secretaria.
        </Item>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
