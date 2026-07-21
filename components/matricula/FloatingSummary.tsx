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
        className="fixed bottom-5 right-4 z-40 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg sm:right-6"
      >
        Resumo
        {pricing ? ` · ${formatBRL(pricing.planTotal)}` : ""}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-bg-elevated p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl">Seu resumo</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-fg"
              >
                Fechar
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {courses.map((c) => {
                const info = getClassByCode(c.classCode);
                return (
                  <li key={c.classCode} className="rounded-xl bg-brand-soft/50 px-3 py-2">
                    <strong>{SUBJECT_LABELS[c.subject]}</strong> · Turma {c.classCode}
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
