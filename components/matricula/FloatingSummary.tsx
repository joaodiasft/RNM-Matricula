"use client";

import { useMemo, useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  calculatePricing,
  formatBRL,
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type Plan,
  type PaymentMethod,
} from "@/lib/pricing";
import { getClassByCode, SUBJECT_LABELS } from "@/lib/courses";

export function FloatingSummary({ draft }: { draft: EnrollmentDraft }) {
  const [open, setOpen] = useState(false);

  const courses = draft.courses ?? [];
  const hasContent = courses.length > 0 || Boolean(draft.modality);
  const pricing = useMemo(() => {
    const subjects = (draft.courses ?? []).map((c) => c.subject);
    if (!draft.modality) return null;
    if (draft.plan && draft.paymentMethod) {
      return calculatePricing({
        modality: draft.modality as Modality,
        plan: draft.plan as Plan,
        paymentMethod: draft.paymentMethod as PaymentMethod,
        subjects,
      });
    }
    return calculatePricing({
      modality: draft.modality as Modality,
      plan: (draft.plan as Plan) || "mensal",
      paymentMethod: (draft.paymentMethod as PaymentMethod) || "pix",
      subjects,
    });
  }, [draft.modality, draft.plan, draft.paymentMethod, draft.courses]);

  const provisional = Boolean(draft.modality) && !(draft.plan && draft.paymentMethod);
  const filledBits = [
    draft.fullName,
    courses.length,
    draft.modality,
    draft.plan,
    draft.paymentMethod,
  ].filter(Boolean).length;

  if (!hasContent) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir resumo da matrícula"
        className="brand-gradient fixed bottom-5 right-4 z-40 inline-flex min-h-[52px] items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-105 active:scale-[0.97] sm:bottom-6 sm:right-6"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 5h6M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h3" />
          </svg>
          {filledBits > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-brand">
              {filledBits}
            </span>
          )}
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/75">
            Resumo
          </span>
          <span className="block">
            {pricing ? formatBRL(pricing.planTotal) : "Em andamento"}
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#15151a]/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resumo-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="animate-rise max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[24px] bg-white shadow-[var(--shadow-lg)] sm:rounded-[24px]">
            <div className="hero-gradient relative overflow-hidden px-5 pb-5 pt-5 text-white">
              <div className="brand-gradient absolute inset-x-0 top-0 h-1" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff7ac1]">
                    Sua matrícula
                  </p>
                  <h3
                    id="resumo-title"
                    className="font-display mt-1 text-2xl font-extrabold text-white"
                  >
                    Resumo ao vivo
                  </h3>
                  {draft.fullName && (
                    <p className="mt-1 text-sm text-white/70">{draft.fullName}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Fechar resumo"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              {pricing && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-white/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">
                      {draft.plan === "mensal" || !draft.plan
                        ? "Mensalidade"
                        : "Valor do plano"}
                    </p>
                    <p className="mt-0.5 font-display text-xl font-bold tabular-nums">
                      {formatBRL(
                        draft.plan && draft.plan !== "mensal"
                          ? pricing.planTotal
                          : pricing.monthlyValue
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-white/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">
                      Taxa matrícula
                    </p>
                    <p className="mt-0.5 font-display text-xl font-bold tabular-nums">
                      {formatBRL(pricing.enrollmentFee)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5 px-5 py-5">
              {courses.length > 0 && (
                <section>
                  <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                    Turmas
                  </h4>
                  <ul className="space-y-2">
                    {courses.map((c) => {
                      const info = getClassByCode(c.classCode);
                      return (
                        <li
                          key={c.classCode}
                          className="flex gap-3 rounded-2xl border border-line bg-brand-tint/80 px-3.5 py-3"
                        >
                          <span className="brand-gradient mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white">
                            {c.classCode}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">
                              {SUBJECT_LABELS[c.subject]}
                            </p>
                            {info && (
                              <p className="mt-0.5 text-sm text-muted">
                                {info.day} · {info.schedule}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <section className="grid gap-2">
                {draft.modality && (
                  <Row
                    label="Modalidade"
                    value={MODALITY_LABELS[draft.modality as Modality]}
                  />
                )}
                {draft.plan && (
                  <Row label="Plano" value={PLAN_LABELS[draft.plan as Plan]} />
                )}
                {draft.paymentMethod && (
                  <Row
                    label="Pagamento"
                    value={PAYMENT_LABELS[draft.paymentMethod as PaymentMethod]}
                  />
                )}
                {draft.plan === "mensal" && draft.autoRenew !== undefined && (
                  <Row
                    label="Rematrícula"
                    value={draft.autoRenew ? "Automática" : "Manual"}
                  />
                )}
              </section>

              {pricing && (
                <section className="rounded-2xl border border-brand/15 bg-brand-soft/50 p-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-deep">
                    Valores
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {pricing.calculationLabel}
                  </p>
                  {provisional && (
                    <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
                      Valores provisórios — finalize plano e pagamento para o
                      total definitivo.
                    </p>
                  )}
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Mensalidade base</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatBRL(pricing.monthlyValue)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Taxa de matrícula</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatBRL(pricing.enrollmentFee)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-brand/15 pt-2">
                      <dt className="font-bold text-ink">Total do plano</dt>
                      <dd className="font-display text-lg font-extrabold tabular-nums text-brand">
                        {formatBRL(pricing.planTotal)}
                      </dd>
                    </div>
                  </dl>
                </section>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="brand-gradient flex min-h-[48px] w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-[var(--shadow-brand)]"
              >
                Continuar preenchendo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg-subtle px-3.5 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
