"use client";

import { useEffect, useRef, useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { maskPhone } from "@/lib/validation";
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
import { Field, inputClass, NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  token: string;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onBack: () => void;
  onCompleted: (payload: { whatsappUrl: string; studentName: string }) => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      remove: (id: string) => void;
    };
  }
}

export function StepReview({
  draft,
  token,
  onChange,
  onBack,
  onCompleted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

  useEffect(() => {
    if (!siteKey || !widgetRef.current) return;

    const scriptId = "cf-turnstile";
    const render = () => {
      if (!widgetRef.current || !window.turnstile) return;
      if (widgetId.current) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
      }
      widgetId.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (t) => setTurnstileToken(t),
        "expired-callback": () => setTurnstileToken(null),
      });
    };

    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = render;
      document.body.appendChild(s);
    } else {
      render();
    }
  }, [siteKey]);

  useEffect(() => {
    if (!draft.confirmEmail && draft.email) {
      onChange({ confirmEmail: draft.email });
    }
    if (!draft.confirmPhone && draft.phone) {
      onChange({ confirmPhone: draft.phone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setError(null);
    if (!draft.declarationName?.trim()) {
      setError("Digite seu nome para registrar a declaração digital.");
      return;
    }
    if (siteKey && !turnstileToken) {
      setError("Complete a verificação anti-robô.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/enrollment/${token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declarationName: draft.declarationName,
          confirmEmail: draft.confirmEmail,
          confirmPhone: draft.confirmPhone,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao concluir");
        setLoading(false);
        return;
      }
      onCompleted({
        whatsappUrl: data.whatsappUrl,
        studentName: data.studentName || draft.fullName || "Aluno",
      });
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div>
      <StepTitle
        title="Revisão final"
        subtitle="Confira tudo e confirme e-mail e telefone antes de enviar."
      />

      <div className="space-y-2 rounded-xl bg-brand-soft/40 p-4 text-sm">
        <p>
          <strong>Aluno:</strong> {draft.fullName}
        </p>
        <p>
          <strong>Série:</strong> {draft.grade} · {draft.school}
        </p>
        {(draft.courses ?? []).map((c) => {
          const info = getClassByCode(c.classCode);
          return (
            <p key={c.classCode}>
              <strong>{SUBJECT_LABELS[c.subject]}:</strong> Turma {c.classCode}
              {info ? ` · ${info.day} ${info.schedule}` : ""}
            </p>
          );
        })}
        {draft.modality && (
          <p>
            <strong>Modalidade:</strong>{" "}
            {MODALITY_LABELS[draft.modality as Modality]}
          </p>
        )}
        {draft.plan && (
          <p>
            <strong>Plano:</strong> {PLAN_LABELS[draft.plan as Plan]}
            {pricing ? ` — ${pricing.calculationLabel}` : ""}
          </p>
        )}
        {draft.paymentMethod && (
          <p>
            <strong>Pagamento:</strong>{" "}
            {PAYMENT_LABELS[draft.paymentMethod as PaymentMethod]}
          </p>
        )}
        {pricing && (
          <>
            <p>
              <strong>Valor do plano:</strong> {formatBRL(pricing.planTotal)}
            </p>
            <p>
              <strong>Taxa de matrícula:</strong>{" "}
              {formatBRL(pricing.enrollmentFee)}
            </p>
          </>
        )}
        <p>
          <strong>Rematrícula automática:</strong>{" "}
          {draft.autoRenew ? "Sim" : "Não"}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Confirme o e-mail">
          <input
            className={inputClass()}
            type="email"
            value={draft.confirmEmail ?? ""}
            onChange={(e) => onChange({ confirmEmail: e.target.value })}
          />
        </Field>
        <Field label="Confirme o telefone">
          <input
            className={inputClass()}
            value={draft.confirmPhone ?? ""}
            onChange={(e) =>
              onChange({ confirmPhone: maskPhone(e.target.value) })
            }
            inputMode="tel"
          />
        </Field>
        <Field
          label="Declaração digital — digite seu nome completo"
          hint="Registramos nome, data/hora e IP como prova de ciência."
        >
          <input
            className={inputClass()}
            value={draft.declarationName ?? ""}
            onChange={(e) => onChange({ declarationName: e.target.value })}
          />
        </Field>
      </div>

      {siteKey && <div ref={widgetRef} className="mt-5" />}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <NavButtons
        onBack={onBack}
        onNext={submit}
        nextLabel="Confirmar e Fazer Matrícula"
        loading={loading}
      />
    </div>
  );
}
