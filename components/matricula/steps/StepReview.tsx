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
import { COMPANY } from "@/lib/company";
import { Field, inputClass, NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  token: string;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onBack: () => void;
  onCompleted: (payload: {
    whatsappUrl: string;
    studentName: string;
    referralCode?: string | null;
  }) => void;
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
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneFallback, setPhoneFallback] = useState(false);
  const [phoneTail, setPhoneTail] = useState("");
  const [otpHint, setOtpHint] = useState<string | null>(null);
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

  const waHelp = `https://wa.me/${COMPANY.phoneDigits}?text=${encodeURIComponent(
    `Olá! Preciso de ajuda com a verificação de e-mail da matrícula (${draft.email || "sem e-mail"}).`
  )}`;

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
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
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

  const sendOtp = async () => {
    setOtpLoading(true);
    setError(null);
    setOtpHint(null);
    try {
      const res = await fetch(`/api/enrollment/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao enviar código");
        if (data.allowPhoneFallback) setPhoneFallback(true);
      } else {
        setOtpSent(true);
        setPhoneFallback(false);
        setOtpHint(
          `Código enviado para ${data.sentTo || draft.email}. Confira também a pasta de spam.`
        );
      }
    } catch {
      setError("Erro de conexão ao enviar código");
      setPhoneFallback(true);
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setOtpLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/enrollment/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Código inválido");
      } else {
        setEmailVerified(true);
        setOtpHint(null);
      }
    } catch {
      setError("Erro ao verificar código");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyPhone = async () => {
    setOtpLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/enrollment/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-phone", phoneTail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não confere");
      } else {
        setEmailVerified(true);
        setOtpHint(null);
      }
    } catch {
      setError("Erro ao verificar telefone");
    } finally {
      setOtpLoading(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!emailVerified) {
      setError("Verifique seu e-mail (ou telefone) antes de concluir.");
      return;
    }
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
        referralCode: data.referralCode,
      });
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div>
      <StepTitle
        title="Verificação e revisão"
        subtitle="Confirme sua identidade e revise o resumo completo antes de concluir."
      />

      {/* OTP */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
        <div className="border-b border-line bg-brand-tint/70 px-4 py-3.5">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-xl text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            Verificação de e-mail
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Enviaremos um código de 6 dígitos para{" "}
            <span className="font-semibold text-ink-soft">{draft.email}</span>
          </p>
        </div>

        <div className="p-4">
          {!emailVerified ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={sendOtp}
                disabled={otpLoading || !draft.email}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-brand bg-brand-soft/40 px-5 text-sm font-bold text-brand transition hover:bg-brand-soft disabled:opacity-50"
              >
                {otpLoading && !otpSent
                  ? "Enviando…"
                  : otpSent
                    ? "Reenviar código"
                    : "Enviar código agora"}
              </button>

              {otpHint && (
                <p className="rounded-xl bg-success-soft px-3 py-2.5 text-xs font-medium text-success" role="status">
                  {otpHint}
                </p>
              )}

              {otpSent && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className={`${inputClass()} text-center text-lg font-bold tracking-[0.4em]`}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    aria-label="Código de 6 dígitos"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="brand-gradient shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-105 disabled:opacity-50 disabled:shadow-none"
                  >
                    Verificar
                  </button>
                </div>
              )}

              {(phoneFallback || otpSent) && (
                <div className="rounded-2xl border border-dashed border-line-strong bg-bg-subtle p-3.5">
                  <button
                    type="button"
                    className="text-left text-xs font-semibold text-brand underline-offset-2 hover:underline"
                    onClick={() => setPhoneFallback((v) => !v)}
                  >
                    {phoneFallback
                      ? "Verificação alternativa por telefone"
                      : "Não recebeu o e-mail? Verificar pelo telefone"}
                  </button>
                  {phoneFallback && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs leading-relaxed text-muted">
                        Digite os <strong>4 últimos dígitos</strong> do WhatsApp
                        cadastrado ({draft.phone || "—"}).
                      </p>
                      <div className="flex gap-2">
                        <input
                          className={`${inputClass()} max-w-[140px] text-center text-lg font-bold tracking-[0.35em]`}
                          value={phoneTail}
                          onChange={(e) =>
                            setPhoneTail(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="0000"
                          inputMode="numeric"
                          maxLength={4}
                          aria-label="Últimos 4 dígitos do telefone"
                        />
                        <button
                          type="button"
                          onClick={verifyPhone}
                          disabled={otpLoading || phoneTail.length !== 4}
                          className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                      </div>
                      <a
                        href={waHelp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-xs font-semibold text-[#128C7E] hover:underline"
                      >
                        Ou falar com a secretaria no WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm font-bold text-success">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Identidade verificada — pode concluir a matrícula
            </p>
          )}
        </div>
      </div>

      {/* Resumo completo */}
      <div className="overflow-hidden rounded-2xl border border-line shadow-[var(--shadow-xs)]">
        <div className="hero-gradient px-4 py-4 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff7ac1]">
            Conferência final
          </p>
          <h3 className="font-display mt-1 text-xl font-extrabold">
            {draft.fullName || "Aluno"}
          </h3>
          {(draft.email || draft.phone) && (
            <p className="mt-1 text-sm text-white/65">
              {[draft.email, draft.phone].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="space-y-4 bg-white p-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Turmas
            </p>
            <ul className="space-y-2">
              {(draft.courses ?? []).map((c) => {
                const info = getClassByCode(c.classCode);
                return (
                  <li
                    key={c.classCode}
                    className="flex gap-3 rounded-xl bg-brand-tint px-3 py-2.5 text-sm"
                  >
                    <span className="font-bold text-brand">{c.classCode}</span>
                    <span>
                      <strong>{SUBJECT_LABELS[c.subject]}</strong>
                      {info ? (
                        <span className="block text-muted">
                          {info.day} · {info.schedule}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {draft.modality && (
              <SummaryTile
                label="Modalidade"
                value={MODALITY_LABELS[draft.modality as Modality]}
              />
            )}
            {draft.plan && (
              <SummaryTile
                label="Plano"
                value={
                  PLAN_LABELS[draft.plan as Plan] +
                  (pricing ? ` — ${pricing.calculationLabel}` : "")
                }
              />
            )}
            {draft.paymentMethod && (
              <SummaryTile
                label="Pagamento"
                value={PAYMENT_LABELS[draft.paymentMethod as PaymentMethod]}
              />
            )}
            {draft.plan === "mensal" && (
              <SummaryTile
                label="Rematrícula"
                value={
                  draft.autoRenew
                    ? "Automática"
                    : draft.autoRenew === false
                      ? "Manual"
                      : "—"
                }
              />
            )}
          </dl>

          {pricing && (
            <div className="rounded-2xl border border-brand/20 bg-brand-soft/60 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep">
                    Investimento
                  </p>
                  <p className="mt-1 text-xs text-muted">{pricing.calculationLabel}</p>
                </div>
                <p className="font-display text-2xl font-extrabold tabular-nums text-brand">
                  {formatBRL(pricing.planTotal)}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink-soft ring-1 ring-line">
                  Mensal {formatBRL(pricing.monthlyValue)}
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink-soft ring-1 ring-line">
                  Taxa {formatBRL(pricing.enrollmentFee)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
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
      {error && (
        <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}

      <NavButtons
        onBack={onBack}
        onNext={submit}
        nextLabel="Confirmar e Fazer Matrícula"
        loading={loading}
        nextDisabled={!emailVerified}
      />
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-subtle px-3.5 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 font-semibold leading-snug text-ink">{value}</dd>
    </div>
  );
}
