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

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

const METHODS: PaymentMethod[] = ["dinheiro", "cartao", "pix"];

export function StepPayment({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [cardFee, setCardFee] = useState(3.5);
  const subjects = (draft.courses ?? []).map((c) => c.subject) as Subject[];

  useEffect(() => {
    fetch("/api/settings/card-fee")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.percent === "number") setCardFee(d.percent);
      })
      .catch(() => {});
  }, []);

  const submit = () => {
    if (!draft.paymentMethod) {
      setError("Escolha a forma de pagamento");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div>
      <StepTitle
        title="Forma de pagamento"
        subtitle="Apenas informativo — não há cobrança online neste momento."
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
                })
              : null;

          return (
            <button
              key={method}
              type="button"
              onClick={() => onChange({ paymentMethod: method })}
              className={[
                "w-full rounded-xl border px-4 py-4 text-left transition",
                selected
                  ? "border-brand bg-brand-soft ring-2 ring-brand/30"
                  : "border-line bg-bg",
              ].join(" ")}
            >
              <p className="font-semibold text-fg">{PAYMENT_LABELS[method]}</p>
              {method === "dinheiro" && (
                <p className="mt-1 text-sm text-muted">
                  5% de desconto adicional sobre o valor do plano
                  {pricing && selected
                    ? ` → ${formatBRL(pricing.planTotal)}`
                    : ""}
                </p>
              )}
              {method === "cartao" && (
                <p className="mt-1 text-sm text-muted">
                  Sujeito à taxa da maquininha (~{cardFee}%) no momento do
                  pagamento.
                </p>
              )}
              {method === "pix" && (
                <p className="mt-1 text-sm text-muted">
                  Dados enviados pelo WhatsApp da empresa após receber o pedido
                  de matrícula.
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
