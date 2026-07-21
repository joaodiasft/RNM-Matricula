"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  formatBRL,
  getSubjectMonthly,
  MODALITY_LABELS,
  MODALITY_OBLIGATIONS,
  type Modality,
} from "@/lib/pricing";
import { SUBJECT_LABELS, type Subject } from "@/lib/courses";
import { NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

const MODALITIES: Modality[] = ["desconto", "desconto_parcial", "normal"];

export function StepModality({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const subjects = Array.from(
    new Set((draft.courses ?? []).map((c) => c.subject))
  ) as Subject[];

  const submit = () => {
    if (!draft.modality) {
      setError("Escolha uma modalidade");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div>
      <StepTitle
        title="Modalidade e valores"
        subtitle="Escolha com calma. Depois de confirmar a modalidade, alterações só na secretaria."
      />

      <div className="mb-5 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm leading-relaxed text-fg">
        <strong>Atenção:</strong> depois de escolher a modalidade não é possível
        voltar atrás pelo site. Pense bem antes de confirmar — para alterar
        depois, é só na secretaria.
      </div>

      <div className="space-y-3">
        {MODALITIES.map((m) => {
          const selected = draft.modality === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ modality: m })}
              className={[
                "w-full rounded-xl border px-4 py-4 text-left transition",
                selected
                  ? "border-brand bg-brand-soft ring-2 ring-brand/30"
                  : "border-line bg-bg",
              ].join(" ")}
            >
              <p className="font-semibold text-fg">{MODALITY_LABELS[m]}</p>
              <p className="mt-1 text-sm text-muted">{MODALITY_OBLIGATIONS[m]}</p>

              {selected && (
                <div className="mt-3 space-y-1 border-t border-line/60 pt-3 text-sm">
                  {subjects.map((s) => (
                    <p key={s}>
                      {SUBJECT_LABELS[s]}:{" "}
                      <strong>{formatBRL(getSubjectMonthly(m, s))}</strong>
                      /mês
                    </p>
                  ))}
                  <p className="text-xs text-muted">
                    Taxa de matrícula:{" "}
                    {subjects.length === 1 ? "R$ 100" : "R$ 50"} (
                    {subjects.length} curso
                    {subjects.length > 1 ? "s" : ""})
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {draft.modality && draft.modality !== "normal" && (
        <p className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm text-fg">
          Se não cumprir as obrigações desta modalidade, o valor volta
          automaticamente para a Modalidade 3 (normal).
        </p>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
