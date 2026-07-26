"use client";

import { useEffect, useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  calculatePricing,
  formatBRL,
  PAYMENT_LABELS,
  type Modality,
  type PaymentMethod,
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

const METHODS: Exclude<PaymentMethod, "isento">[] = [
  "dinheiro",
  "cartao",
  "pix",
];

const HINTS: Record<Exclude<PaymentMethod, "isento">, string> = {
  dinheiro: "Pagamento presencial em dinheiro.",
  cartao: "Crédito ou débito na maquininha da escola.",
  pix: "Chave Pix enviada pela secretaria após a matrícula.",
};

export function StepPayment({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [cardFee, setCardFee] = useState(3.5);
  const toast = useToast();
  const subjects = (draft.courses ?? []).map((c) => c.subject) as Subject[];
  const isBolsa = draft.scholarshipValid === true;
  const cashDiscountApplies = draft.modality === "desconto_parcial" && !isBolsa;

  useEffect(() => {
    if (!isBolsa) return;
    if (draft.paymentMethod !== "isento" || !draft.waivedFee) {
      onChange({ paymentMethod: "isento", waivedFee: true });
    }
  }, [isBolsa, draft.paymentMethod, draft.waivedFee, onChange]);

  useEffect(() => {
    fetch("/api/settings/card-fee")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.percent === "number") setCardFee(d.percent);
      })
      .catch(() => {});
  }, []);

  const submit = () => {
    if (isBolsa) {
      onChange({ paymentMethod: "isento", waivedFee: true });
      setError(null);
      onNext();
      return;
    }
    if (!draft.paymentMethod || draft.paymentMethod === "isento") {
      setError("Escolha a forma de pagamento");
      toast.push({
        title: "Forma de pagamento",
        message: "Selecione dinheiro, cartão ou Pix.",
        tone: "warning",
      });
      return;
    }
    setError(null);
    onNext();
  };

  if (isBolsa) {
    return (
      <div>
        <StepTitle
          title="Pagamento"
          subtitle="Bolsa integral aplicada — não há valores a pagar."
        />
        <div className="rounded-2xl border border-success/30 bg-success-soft px-4 py-5 text-sm text-ink">
          <p className="font-display text-lg font-bold text-ink">
            Isento — bolsa 100%
          </p>
          <p className="mt-2 text-ink-soft">
            Mensalidade e taxa de matrícula ficam zeradas. Nenhuma forma de
            pagamento é necessária.
          </p>
        </div>
        <NavButtons onBack={onBack} onNext={submit} nextLabel="Continuar" />
      </div>
    );
  }

  return (
    <div>
      <StepTitle
        title="Forma de pagamento"
        subtitle="Só para organização — a cobrança não é feita neste site."
      />

      <div className="space-y-3">
        {METHODS.map((method) => {
          const selected = draft.paymentMethod === method;
          const pricing =
            draft.modality && draft.plan
              ? calculatePricing({
                  modality: draft.modality as Modality,
                  plan: draft.plan as Plan,
                  paymentMethod: method,
                  subjects,
                  cardFeePercent: cardFee,
                  waivedFee: draft.waivedFee,
                  scholarship: false,
                })
              : null;

          return (
            <button
              key={method}
              type="button"
              onClick={() => onChange({ paymentMethod: method })}
              className={[
                "w-full rounded-2xl border px-4 py-4 text-left transition",
                selected
                  ? "border-brand bg-brand-soft/80 ring-2 ring-brand/25"
                  : "border-line bg-white hover:border-brand/35",
              ].join(" ")}
            >
              <p className="font-display text-lg font-bold text-ink">
                {PAYMENT_LABELS[method]}
              </p>
              <p className="mt-1 text-sm text-muted">{HINTS[method]}</p>

              {method === "dinheiro" && (
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {cashDiscountApplies ? (
                    <>
                      <strong className="text-success">5% de desconto</strong>{" "}
                      no valor do plano (válido só na Modalidade 2 — desconto
                      parcial)
                      {pricing && selected
                        ? ` → ${formatBRL(pricing.planTotal)}`
                        : ""}
                      .
                    </>
                  ) : (
                    <>
                      Sem desconto extra em dinheiro nesta modalidade
                      {draft.modality === "normal"
                        ? " (Modalidade 3)"
                        : draft.modality === "desconto"
                          ? " (Modalidade 1)"
                          : ""}
                      . O valor do plano permanece o calculado.
                    </>
                  )}
                </p>
              )}
              {method === "cartao" && (
                <p className="mt-2 text-sm text-muted">
                  Taxa da maquininha (~{cardFee}%) pode ser cobrada no ato do
                  pagamento.
                </p>
              )}
              {method === "pix" && pricing && selected && (
                <p className="mt-2 text-sm font-semibold text-ink">
                  Total do plano: {formatBRL(pricing.planTotal)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
