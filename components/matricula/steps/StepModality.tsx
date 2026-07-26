"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  formatBRL,
  getSubjectMonthly,
  MODALITY_LABELS,
  MODALITY_OBLIGATIONS,
  MODALITY_SHORT,
  type Modality,
} from "@/lib/pricing";
import { SUBJECT_LABELS, type Subject } from "@/lib/courses";
import { NavButtons, StepTitle } from "../ui";
import { useToast } from "@/components/ui/Toast";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

const MODALITIES: Modality[] = ["desconto", "desconto_parcial", "normal"];

const HIGHLIGHT: Record<Modality, string> = {
  desconto: "Menor mensalidade · com divulgação + indicação",
  desconto_parcial: "Mensalidade intermediária · só divulgação",
  normal: "Valor cheio · sem obrigações extras",
};

export function StepModality({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const subjects = Array.from(
    new Set((draft.courses ?? []).map((c) => c.subject))
  ) as Subject[];
  const isBolsa = draft.scholarshipValid === true;

  const submit = () => {
    if (!draft.modality) {
      setError("Escolha uma modalidade");
      toast.push({
        title: "Escolha a modalidade",
        message: "Selecione uma das três opções para ver os valores.",
        tone: "warning",
      });
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div>
      <StepTitle
        title="Modalidade e valores"
        subtitle="Escolha com calma: depois de confirmar a matrícula, mudança de modalidade só na secretaria."
      />

      <div className="mb-5 rounded-2xl border border-warning/35 bg-warning-soft px-4 py-3.5 text-sm leading-relaxed text-ink">
        <p className="font-bold text-ink">Importante</p>
        <p className="mt-1 text-ink-soft">
          A modalidade define o valor mensal e as obrigações de divulgação. Se
          não cumprir (nas modalidades com desconto), o valor volta para a
          Modalidade 3 (normal).
        </p>
      </div>

      {isBolsa && (
        <div className="mb-5 rounded-2xl border border-success/30 bg-success-soft px-4 py-3.5 text-sm text-ink">
          <p className="font-bold">Condição especial ativa</p>
          <p className="mt-1 text-ink-soft">
            Mensalidade e taxa ficam isentas nesta matrícula.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {MODALITIES.map((m) => {
          const selected = draft.modality === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ modality: m })}
              className={[
                "w-full rounded-2xl border px-4 py-4 text-left transition",
                selected
                  ? "border-brand bg-brand-soft/80 ring-2 ring-brand/25 shadow-[var(--shadow-sm)]"
                  : "border-line bg-white hover:border-brand/35",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                    {MODALITY_SHORT[m]}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-ink">
                    {MODALITY_LABELS[m]}
                  </p>
                </div>
                <span
                  className={[
                    "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected
                      ? "border-brand bg-brand"
                      : "border-line bg-transparent",
                  ].join(" ")}
                  aria-hidden
                >
                  {selected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {MODALITY_OBLIGATIONS[m]}
              </p>
              <p className="mt-2 text-xs font-semibold text-brand-deep">
                {HIGHLIGHT[m]}
              </p>

              {selected && (
                <div className="mt-3 space-y-1.5 border-t border-brand/15 pt-3 text-sm">
                  {subjects.map((s) => (
                    <div
                      key={s}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-ink-soft">{SUBJECT_LABELS[s]}</span>
                      <span className="font-bold tabular-nums text-ink">
                        {isBolsa
                          ? "Isento"
                          : `${formatBRL(getSubjectMonthly(m, s))}/mês`}
                      </span>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-muted">
                    Taxa de matrícula:{" "}
                    {draft.waivedFee || isBolsa ? (
                      <span className="font-semibold text-success">isenta</span>
                    ) : (
                      <>
                        {subjects.length === 1 ? "R$ 100" : "R$ 50"} (
                        {subjects.length} curso
                        {subjects.length > 1 ? "s" : ""})
                      </>
                    )}
                  </p>
                  {m === "desconto_parcial" && !isBolsa && (
                    <p className="rounded-xl bg-white/80 px-3 py-2 text-xs font-medium text-ink-soft">
                      Nesta modalidade, pagamento em{" "}
                      <strong>dinheiro à vista</strong> ganha 5% de desconto
                      extra no valor do plano.
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-bg-subtle px-4 py-3.5 text-sm font-medium text-ink transition hover:border-line-strong">
        <input
          type="checkbox"
          checked={draft.waivedFee === true}
          onChange={(e) => onChange({ waivedFee: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
          disabled={isBolsa}
        />
        <span>
          Já sou aluno(a) e já me matriculei em todos os módulos, incluindo o de
          férias
          {(draft.waivedFee || isBolsa) && (
            <span className="mt-1 block text-xs font-semibold text-success">
              Taxa de matrícula isenta.
            </span>
          )}
        </span>
      </label>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
