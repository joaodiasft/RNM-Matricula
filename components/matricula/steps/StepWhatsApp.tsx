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
  referralCode?: string | null;
};

export function StepWhatsApp({
  studentName,
  whatsappUrl,
  draft,
  referralCode,
}: Props) {
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
    <div className="rounded-[20px] border border-line/60 bg-bg-elevated p-6 shadow-[var(--shadow)] sm:p-8">
      <StepTitle
        title="Matrícula recebida!"
        subtitle={`Obrigado, ${studentName}. Agora envie o registro oficial pelo WhatsApp da equipe.`}
      />

      <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] p-6 text-white">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#e91e8c]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e91e8c]">
          {COMPANY.name}
        </p>
        <h3 className="font-display mt-2 text-2xl font-bold">{studentName}</h3>
        <div className="mt-4 space-y-2 text-sm text-[#d8d8de]">
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
          {referralCode && (
            <p className="mt-2 rounded-lg bg-[#e91e8c]/20 px-3 py-2 text-sm text-white">
              Código de indicação: <strong>{referralCode}</strong>
            </p>
          )}
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#25D366] px-5 py-4 text-center text-sm font-bold text-white transition hover:brightness-95 active:scale-[0.99]"
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
