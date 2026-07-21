"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  calculatePricing,
  formatBRL,
  MODALITY_LABELS,
  type Modality,
  type Plan,
  type PaymentMethod,
} from "@/lib/pricing";
import { getClassByCode, SUBJECT_LABELS } from "@/lib/courses";

export function FloatingSummary({ draft }: { draft: EnrollmentDraft }) {
  const [open, setOpen] = useState(false);

  const courses = draft.courses ?? [];
  if (!courses.length && !draft.modality) return null;

  const subjects = courses.map((c) => c.subject);
  const pricing =
    draft.modality && draft.plan && draft.paymentMethod
      ? calculatePricing({
          modality: draft.modality as Modality,
          plan: draft.plan as Plan,
          paymentMethod: draft.paymentMethod as PaymentMethod,
          subjects,
        })
      : draft.modality
        ? calculatePricing({
            modality: draft.modality as Modality,
            plan: "mensal",
            paymentMethod: "pix",
            subjects,
          })
        : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir resumo da matrícula"
        className="brand-gradient fixed bottom-5 right-4 z-40 inline-flex min-h-[48px] items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-105 active:scale-[0.97] sm:right-6"
      >
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
        Resumo
        {pricing ? ` · ${formatBRL(pricing.planTotal)}` : ""}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resumo-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-bg-elevated p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 id="resumo-title" className="font-display text-xl font-bold">
                Seu resumo
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded-lg px-3 text-sm font-semibold text-muted hover:text-fg"
              >
                Fechar
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {courses.map((c) => {
                const info = getClassByCode(c.classCode);
                return (
                  <li
                    key={c.classCode}
                    className="rounded-xl bg-brand-soft/70 px-3 py-2.5"
                  >
                    <strong>{SUBJECT_LABELS[c.subject]}</strong> · Turma{" "}
                    {c.classCode}
                    {info && (
                      <span className="block text-muted">
                        {info.day} · {info.schedule}
                      </span>
                    )}
                  </li>
                );
              })}
              {draft.modality && (
                <li>
                  Modalidade:{" "}
                  <strong>{MODALITY_LABELS[draft.modality as Modality]}</strong>
                </li>
              )}
              {pricing && (
                <>
                  <li>Mensalidade: {formatBRL(pricing.monthlyValue)}</li>
                  <li>{pricing.calculationLabel}</li>
                  <li>Taxa de matrícula: {formatBRL(pricing.enrollmentFee)}</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
