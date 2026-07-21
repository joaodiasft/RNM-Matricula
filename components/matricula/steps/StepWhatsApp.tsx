"use client";

import type { EnrollmentDraft } from "@/lib/validation";
import {
  calculatePricing,
  formatBRL,
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "@/lib/pricing";
import { getClassByCode, SUBJECT_LABELS, type Subject } from "@/lib/courses";
import { COMPANY } from "@/lib/company";

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
          paymentMethod: draft.paymentMethod as PaymentMethod,
          subjects,
        })
      : null;

  return (
    <div className="card animate-rise overflow-hidden p-0">
      <div className="px-6 pb-2 pt-8 text-center sm:px-8">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success ring-8 ring-success-soft/50">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <h2 className="font-display text-2xl font-extrabold text-ink sm:text-[1.75rem]">
          Matrícula recebida!
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Obrigado, <strong className="text-ink-soft">{studentName}</strong>.
          Envie o registro oficial pelo WhatsApp para a equipe confirmar.
        </p>
      </div>

      <div className="mx-5 mb-5 mt-5 overflow-hidden rounded-2xl sm:mx-7">
        <div className="hero-gradient relative px-5 py-5 text-white">
          <div className="brand-gradient absolute inset-x-0 top-0 h-1.5" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff7ac1]">
            {COMPANY.name}
          </p>
          <h3 className="font-display mt-2 text-2xl font-bold">{studentName}</h3>

          <ul className="mt-4 space-y-2.5 text-sm text-white/80">
            {(draft.courses ?? []).map((c) => {
              const info = getClassByCode(c.classCode);
              return (
                <li key={c.classCode} className="flex gap-2">
                  <span className="mt-0.5 font-bold text-[#ff7ac1]">{c.classCode}</span>
                  <span>
                    {SUBJECT_LABELS[c.subject]}
                    {info ? ` · ${info.day} ${info.schedule}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {draft.modality && (
              <Meta
                label="Modalidade"
                value={MODALITY_LABELS[draft.modality as Modality]}
              />
            )}
            {draft.plan && (
              <Meta label="Plano" value={PLAN_LABELS[draft.plan as Plan]} />
            )}
            {draft.paymentMethod && (
              <Meta
                label="Pagamento"
                value={PAYMENT_LABELS[draft.paymentMethod as PaymentMethod]}
              />
            )}
            {pricing && (
              <Meta label="Valor do plano" value={formatBRL(pricing.planTotal)} />
            )}
            {pricing && (
              <Meta
                label="Taxa de matrícula"
                value={formatBRL(pricing.enrollmentFee)}
              />
            )}
            {draft.plan === "mensal" && (
              <Meta
                label="Rematrícula"
                value={draft.autoRenew ? "Automática" : "Manual"}
              />
            )}
          </div>

          {referralCode && (
            <p className="mt-4 rounded-xl bg-brand/25 px-3.5 py-2.5 text-sm ring-1 ring-brand/40">
              Seu código de indicação:{" "}
              <strong className="tracking-wide">{referralCode}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-8 sm:px-8">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-4 text-center text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(37,211,102,0.55)] transition hover:brightness-[0.97] active:scale-[0.99]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.6 15.06L2 22l5.06-1.33A10 10 0 1 0 12 2zm0 18.2a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3 .79.8-2.93-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
          </svg>
          Enviar registro no WhatsApp
        </a>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          O WhatsApp abre com a mensagem pronta — é só confirmar e enviar para{" "}
          {COMPANY.phone}.
        </p>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
