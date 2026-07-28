"use client";

import { useEffect, useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  isValidCpf,
  maskCpf,
  maskPhone,
  onlyDigits,
} from "@/lib/validation";
import {
  calculatePricing,
  formatBRL,
  PAYMENT_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "@/lib/pricing";
import type { Subject } from "@/lib/courses";
import { Field, inputClass, NavButtons, StepTitle } from "../ui";
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cardFee, setCardFee] = useState(3.5);
  const toast = useToast();
  const subjects = (draft.courses ?? []).map((c) => c.subject) as Subject[];
  const isBolsa = draft.scholarshipValid === true;
  const cashDiscountApplies = draft.modality === "desconto_parcial" && !isBolsa;
  const needsInvoice = draft.needsInvoice === true;

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

  const toggleInvoice = (checked: boolean) => {
    if (!checked) {
      onChange({ needsInvoice: false });
      setFieldErrors({});
      return;
    }

    // Prefere dados do responsável (mãe ou pai); senão, deixa em branco
    // para o usuário preencher quem deve constar na NF.
    const guardianName =
      draft.motherName?.trim() || draft.fatherName?.trim() || "";
    const guardianPhone =
      draft.motherPhone?.trim() || draft.fatherPhone?.trim() || "";

    onChange({
      needsInvoice: true,
      invoiceName: draft.invoiceName?.trim() || guardianName,
      invoiceCpf: draft.invoiceCpf?.trim() || "",
      invoiceAddress: draft.invoiceAddress?.trim() || draft.address || "",
      invoicePhone: draft.invoicePhone?.trim() || guardianPhone,
      invoiceNotes: draft.invoiceNotes || "",
    });
  };

  const submit = () => {
    if (isBolsa) {
      onChange({ paymentMethod: "isento", waivedFee: true, needsInvoice: false });
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

    if (needsInvoice) {
      const nextErrors: Record<string, string> = {};
      if (!draft.invoiceName?.trim()) nextErrors.invoiceName = "Informe o nome";
      if (!draft.invoiceCpf?.trim()) {
        nextErrors.invoiceCpf = "Informe o CPF";
      } else if (!isValidCpf(draft.invoiceCpf)) {
        nextErrors.invoiceCpf = "CPF inválido";
      }
      if (!draft.invoiceAddress?.trim()) {
        nextErrors.invoiceAddress = "Informe o endereço";
      }
      const phoneDigits = onlyDigits(draft.invoicePhone || "");
      if (phoneDigits.length < 10) {
        nextErrors.invoicePhone = "Informe um telefone válido";
      }
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setError("Preencha os dados do responsável para a nota fiscal");
        toast.push({
          title: "Nota fiscal",
          message:
            "Complete os dados do responsável que deve constar na nota fiscal.",
          tone: "warning",
        });
        return;
      }
    }

    setFieldErrors({});
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
                          : draft.modality === "apmf"
                            ? " (Modalidade 4)"
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

      <div className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)]">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={needsInvoice}
            onChange={(e) => toggleInvoice(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--brand)]"
          />
          <span>
            <span className="block font-bold text-ink">
              Precisa de nota fiscal
            </span>
            <span className="mt-1 block text-sm text-ink-soft">
              Marque se quiser NF. Os dados abaixo são do{" "}
              <strong>responsável</strong> (quem deve constar na nota), não do
              aluno.
            </span>
          </span>
        </label>

        {needsInvoice && (
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
              Dados do responsável para nota fiscal
            </p>
            <Field
              label="Nome do responsável"
              error={fieldErrors.invoiceName}
            >
              <input
                className={inputClass(!!fieldErrors.invoiceName)}
                value={draft.invoiceName ?? ""}
                onChange={(e) => {
                  onChange({ invoiceName: e.target.value });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.invoiceName;
                    return next;
                  });
                }}
                placeholder="Nome completo do responsável"
                autoComplete="name"
              />
            </Field>
            <Field label="CPF do responsável" error={fieldErrors.invoiceCpf}>
              <input
                className={`${inputClass(!!fieldErrors.invoiceCpf)} data`}
                value={draft.invoiceCpf ?? ""}
                onChange={(e) => {
                  onChange({ invoiceCpf: maskCpf(e.target.value) });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.invoiceCpf;
                    return next;
                  });
                }}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
              />
            </Field>
            <Field
              label="Endereço do responsável"
              error={fieldErrors.invoiceAddress}
            >
              <input
                className={inputClass(!!fieldErrors.invoiceAddress)}
                value={draft.invoiceAddress ?? ""}
                onChange={(e) => {
                  onChange({ invoiceAddress: e.target.value });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.invoiceAddress;
                    return next;
                  });
                }}
                placeholder="Rua, número, bairro, cidade"
                autoComplete="street-address"
              />
            </Field>
            <Field
              label="Telefone do responsável"
              error={fieldErrors.invoicePhone}
            >
              <input
                className={`${inputClass(!!fieldErrors.invoicePhone)} data`}
                value={draft.invoicePhone ?? ""}
                onChange={(e) => {
                  onChange({ invoicePhone: maskPhone(e.target.value) });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.invoicePhone;
                    return next;
                  });
                }}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>
            <Field
              label="Observação (opcional)"
              hint="Algo que deseja colocar na nota ou avisar a secretaria."
            >
              <textarea
                className={inputClass()}
                rows={3}
                value={draft.invoiceNotes ?? ""}
                onChange={(e) => onChange({ invoiceNotes: e.target.value })}
                placeholder="Ex.: emitir no nome da mãe, e-mail para envio da NF, etc."
              />
            </Field>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
