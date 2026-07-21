"use client";

import type { EnrollmentDraft } from "@/lib/validation";
import {
  calculatePricing,
  formatBRL,
  MODALITY_LABELS,
  PLAN_LABELS,
  type Modality,
  type Plan,
} from "@/lib/pricing";
import { getClassByCode, SUBJECT_LABELS, type Subject } from "@/lib/courses";
import { COMPANY } from "@/lib/company";
import { StepTitle } from "../ui";

type Props = {
  studentName: string;
  whatsappUrl: string;
  draft: EnrollmentDraft;
};

export function StepWhatsApp({ studentName, whatsappUrl, draft }: Props) {
  const subjects = (draft.courses ?? []).map((c) => c.subject) as Subject[];
  const pricing =
    draft.modality && draft.plan && draft.paymentMethod
      ? calculatePricing({
          modality: draft.modality as Modality,
          plan: draft.plan as Plan,
          paymentMethod: draft.paymentMethod,
          subjects,
        })
      : null;

  return (
    <div className="rounded-[var(--radius)] bg-bg-elevated p-6 shadow-[var(--shadow)] sm:p-8">
      <StepTitle
        title="Matrícula recebida!"
        subtitle={`Obrigado, ${studentName}. Agora envie o registro oficial pelo WhatsApp da equipe.`}
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep to-brand p-6 text-white">
        <p className="text-xs uppercase tracking-[0.2em] opacity-80">
          {COMPANY.name}
        </p>
        <h3 className="font-display mt-2 text-2xl">{studentName}</h3>
        <div className="mt-4 space-y-2 text-sm opacity-95">
          {(draft.courses ?? []).map((c) => {
            const info = getClassByCode(c.classCode);
            return (
              <p key={c.classCode}>
                {SUBJECT_LABELS[c.subject]} · Turma {c.classCode}
                {info ? ` · ${info.day} ${info.schedule}` : ""}
              </p>
            );
          })}
          {draft.modality && (
            <p>Modalidade: {MODALITY_LABELS[draft.modality as Modality]}</p>
          )}
          {draft.plan && <p>Plano: {PLAN_LABELS[draft.plan as Plan]}</p>}
          {pricing && <p>Valor: {formatBRL(pricing.planTotal)}</p>}
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#25D366] px-5 py-4 text-center text-sm font-bold text-white"
      >
        Enviar registro no WhatsApp
      </a>

      <p className="mt-4 text-center text-xs text-muted">
        O WhatsApp abre com a mensagem pronta — é só confirmar e enviar para{" "}
        {COMPANY.phone}.
      </p>
    </div>
  );
}
