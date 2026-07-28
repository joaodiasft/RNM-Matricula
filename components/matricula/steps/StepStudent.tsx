"use client";

import { useEffect, useRef, useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  maskCpf,
  maskDate,
  maskPhone,
  studentStepSchema,
} from "@/lib/validation";
import {
  CONCLUDED_GRADE,
  CONCLUDED_SCHOOL,
  GRADES,
  isConcludedGrade,
} from "@/lib/courses";
import { APMF_SCHOOL_NAME, isApmfSchool } from "@/lib/pricing";
import { COMPANY } from "@/lib/company";
import { Field, inputClass, NavButtons, StepTitle } from "../ui";
import { AgeBadge } from "../AgeBadge";

type Props = {
  draft: EnrollmentDraft;
  age: number | null;
  token: string;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StepStudent({ draft, age, token, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpNotice, setOtpNotice] = useState(false);
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeInput, setCodeInput] = useState(
    () => draft.scholarshipCode || draft.referralCodeInput || ""
  );
  const lastOtpEmail = useRef<string | null>(null);
  const otpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const concluded = isConcludedGrade(draft.grade ?? "");

  /** Um único campo: bolsa (silencioso) ou indicação — ambos uso único. */
  const resolveCode = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    setCodeInput(code);
    if (!code) {
      onChange({
        referralCodeInput: "",
        scholarshipCode: "",
        scholarshipValid: false,
        paymentMethod: undefined,
      });
      return;
    }

    setCodeChecking(true);
    try {
      const res = await fetch(
        `/api/codes/validate?code=${encodeURIComponent(code)}`
      );
      const data = await res.json();

      if (!res.ok || !data.valid) {
        onChange({
          referralCodeInput: "",
          scholarshipCode: "",
          scholarshipValid: false,
        });
        setErrors({
          codeInput: data.error || "Código inválido ou já utilizado",
        });
        return;
      }

      if (data.type === "scholarship") {
        onChange({
          scholarshipCode: code,
          scholarshipValid: true,
          waivedFee: true,
          paymentMethod: "isento",
          referralCodeInput: "",
        });
      } else {
        onChange({
          referralCodeInput: code,
          scholarshipCode: "",
          scholarshipValid: false,
          ...(draft.paymentMethod === "isento"
            ? { paymentMethod: undefined }
            : {}),
        });
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next.codeInput;
        return next;
      });
    } catch {
      onChange({
        referralCodeInput: code,
        scholarshipCode: "",
        scholarshipValid: false,
      });
    } finally {
      setCodeChecking(false);
    }
  };

  // Verificação de e-mail antecipada: assim que o e-mail tem formato válido,
  // dispara o código em segundo plano (sem travar o preenchimento).
  useEffect(() => {
    const email = (draft.email ?? "").trim();
    if (!token || !EMAIL_RE.test(email)) return;
    if (email === lastOtpEmail.current) return;

    if (otpTimer.current) clearTimeout(otpTimer.current);
    otpTimer.current = setTimeout(async () => {
      try {
        // Garante que o e-mail está persistido antes de pedir o código.
        await fetch(`/api/enrollment/${token}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: { email } }),
        });
        const res = await fetch(`/api/enrollment/${token}/otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send" }),
        });
        if (res.ok) {
          lastOtpEmail.current = email;
          setOtpNotice(true);
        }
      } catch {
        /* silencioso — o Passo 9 reenvia e trata erros/fallback */
      }
    }, 1500);

    return () => {
      if (otpTimer.current) clearTimeout(otpTimer.current);
    };
  }, [draft.email, token]);

  const changeGrade = (grade: string) => {
    if (isConcludedGrade(grade)) {
      onChange({ grade, school: CONCLUDED_SCHOOL, courses: [] });
    } else {
      // Se estava travado como "concluído", limpa o campo escola.
      const school =
        draft.school === CONCLUDED_SCHOOL ? "" : draft.school;
      onChange({ grade, school, courses: [] });
    }
  };

  const submit = () => {
    const result = studentStepSchema.safeParse({
      fullName: draft.fullName ?? "",
      birthDateBr: draft.birthDateBr ?? "",
      email: draft.email ?? "",
      phone: draft.phone ?? "",
      grade: draft.grade ?? "",
      school: draft.school ?? "",
      cpf: draft.cpf ?? "",
      rg: draft.rg ?? "",
      address: draft.address ?? "",
      lgpdConsent: draft.lgpdConsent === true ? true : undefined,
    });

    if (!result.success) {
      const map: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!map[key]) map[key] = issue.message;
      }
      setErrors(map);
      return;
    }
    setErrors({});
    onNext();
  };

  return (
    <div>
      <StepTitle
        title="Dados do aluno"
        subtitle="Informações básicas para a matrícula. Campos com * são obrigatórios."
      />

      <div className="mb-5 rounded-xl bg-brand-soft/60 p-4 text-sm leading-relaxed text-fg">
        <label className="flex cursor-pointer gap-3">
          <input
            type="checkbox"
            checked={draft.lgpdConsent === true}
            onChange={(e) => onChange({ lgpdConsent: e.target.checked })}
            className="mt-1 accent-[var(--brand)]"
          />
          <span>
            Autorizo o uso dos meus dados (e do aluno) pela {COMPANY.name} para
            fins de matrícula, contato e cobrança, conforme a LGPD. *
          </span>
        </label>
        {errors.lgpdConsent && (
          <p className="mt-2 text-xs text-danger">{errors.lgpdConsent}</p>
        )}
      </div>

      <div className="space-y-4">
        <Field label="Nome completo *" error={errors.fullName}>
          <input
            className={inputClass(!!errors.fullName)}
            value={draft.fullName ?? ""}
            onChange={(e) => onChange({ fullName: e.target.value })}
            autoComplete="name"
          />
        </Field>

        <Field
          label="Data de nascimento *"
          error={errors.birthDateBr}
          hint={age == null ? "Formato DD/MM/AAAA" : undefined}
        >
          <input
            className={inputClass(!!errors.birthDateBr)}
            value={draft.birthDateBr ?? ""}
            onChange={(e) => onChange({ birthDateBr: maskDate(e.target.value) })}
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
          />
          {age != null && (
            <span className="mt-2 block animate-rise">
              <AgeBadge age={age} />
            </span>
          )}
        </Field>

        <Field label="E-mail *" error={errors.email}>
          <input
            type="email"
            className={inputClass(!!errors.email)}
            value={draft.email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })}
            autoComplete="email"
          />
          {otpNotice && !errors.email && (
            <span
              className="mt-2 flex items-start gap-2 rounded-xl bg-gold-soft px-3 py-2 text-xs font-medium leading-relaxed text-gold-deep"
              role="status"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              Enviamos um código de confirmação pro seu e-mail — você vai usá-lo
              no fim da matrícula.
            </span>
          )}
        </Field>

        <Field label="Telefone / WhatsApp *" error={errors.phone}>
          <input
            className={inputClass(!!errors.phone)}
            value={draft.phone ?? ""}
            onChange={(e) => onChange({ phone: maskPhone(e.target.value) })}
            inputMode="tel"
            placeholder="(62) 99999-9999"
          />
        </Field>

        <Field label="Série atual *" error={errors.grade}>
          <select
            className={inputClass(!!errors.grade)}
            value={draft.grade ?? ""}
            onChange={(e) => changeGrade(e.target.value)}
          >
            <option value="">Selecione…</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
            <option value={CONCLUDED_GRADE}>{CONCLUDED_GRADE}</option>
          </select>
        </Field>

        <Field
          label="Onde estuda *"
          error={errors.school}
          hint={
            concluded
              ? "Preenchido automaticamente — você já concluiu o Ensino Médio."
              : "Se for do Colégio Estadual Militar Ayrton Senna, use o atalho abaixo para liberar a Modalidade 4 (APMF)."
          }
        >
          <input
            className={inputClass(!!errors.school)}
            value={draft.school ?? ""}
            onChange={(e) => {
              const school = e.target.value;
              onChange({
                school,
                ...(draft.modality === "apmf" && !isApmfSchool(school)
                  ? { modality: undefined }
                  : {}),
              });
            }}
            disabled={concluded}
            aria-disabled={concluded}
            list="school-suggestions"
            placeholder="Nome da escola"
          />
          <datalist id="school-suggestions">
            <option value={APMF_SCHOOL_NAME} />
          </datalist>
          {!concluded && (
            <button
              type="button"
              className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                isApmfSchool(draft.school)
                  ? "border-brand bg-brand-soft font-semibold text-brand-deep"
                  : "border-line bg-white text-ink-soft hover:border-brand/40"
              }`}
              onClick={() =>
                onChange({
                  school: APMF_SCHOOL_NAME,
                })
              }
            >
              {isApmfSchool(draft.school) ? "✓ " : ""}
              Colégio Estadual Militar Ayrton Senna (APMF)
            </button>
          )}
        </Field>

        <Field label="CPF (opcional)" error={errors.cpf}>
          <input
            className={inputClass(!!errors.cpf)}
            value={draft.cpf ?? ""}
            onChange={(e) => onChange({ cpf: maskCpf(e.target.value) })}
            inputMode="numeric"
            placeholder="000.000.000-00"
          />
        </Field>

        <Field label="RG (opcional)">
          <input
            className={inputClass()}
            value={draft.rg ?? ""}
            onChange={(e) => onChange({ rg: e.target.value })}
          />
        </Field>

        <Field label="Endereço (opcional)">
          <textarea
            className={inputClass()}
            rows={2}
            value={draft.address ?? ""}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </Field>

        <Field label="Como conheceu a Redação Nota Mil? (opcional)">
          <select
            className={inputClass()}
            value={draft.referralSource ?? ""}
            onChange={(e) => onChange({ referralSource: e.target.value })}
          >
            <option value="">Selecione…</option>
            <option value="indicacao">Indicação de amigo/aluno</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
            <option value="outro">Outro</option>
          </select>
        </Field>

        <Field
          label="Código (opcional)"
          hint="Se alguém te passou um código, digite aqui. Cada código é de uso único."
          error={errors.codeInput}
        >
          <div className="flex gap-2">
            <input
              className={`${inputClass(!!errors.codeInput)} data uppercase`}
              value={codeInput}
              onChange={(e) => {
                const v = e.target.value.toUpperCase();
                setCodeInput(v);
                onChange({
                  referralCodeInput: "",
                  scholarshipCode: "",
                  scholarshipValid: false,
                });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.codeInput;
                  return next;
                });
              }}
              onBlur={() => {
                if (codeInput.trim()) void resolveCode(codeInput);
              }}
              placeholder="Digite o código"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="shrink-0 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink-soft transition hover:border-brand/40"
              onClick={() => void resolveCode(codeInput)}
              disabled={codeChecking || !codeInput.trim()}
            >
              {codeChecking ? "…" : "Aplicar"}
            </button>
          </div>
          {draft.scholarshipValid && (
            <p className="mt-2 text-xs font-medium text-success">
              Bolsa integral 100% — mensalidade e taxa isentas.
            </p>
          )}
          {!draft.scholarshipValid &&
            Boolean(draft.referralCodeInput?.trim()) && (
              <p className="mt-2 text-xs font-medium text-brand">
                Código de indicação registrado.
              </p>
            )}
        </Field>

        <Field label="Observações (opcional)">
          <textarea
            className={inputClass()}
            rows={2}
            value={draft.observations ?? ""}
            onChange={(e) => onChange({ observations: e.target.value })}
            placeholder="Algo que a secretaria precisa saber?"
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-bg-subtle px-4 py-3.5 text-sm font-medium text-ink transition hover:border-line-strong">
          <input
            type="checkbox"
            checked={draft.contractSigned === true}
            onChange={(e) => onChange({ contractSigned: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
          />
          <span>
            Já assinei o contrato
            <span className="mt-0.5 block text-xs font-normal text-muted">
              Marque se o contrato já foi assinado fisicamente na secretaria.
            </span>
          </span>
        </label>
      </div>

      <NavButtons onNext={submit} />
    </div>
  );
}
