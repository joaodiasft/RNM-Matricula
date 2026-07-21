"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import {
  maskCpf,
  maskDate,
  maskPhone,
  studentStepSchema,
} from "@/lib/validation";
import { GRADES } from "@/lib/courses";
import { COMPANY } from "@/lib/company";
import { Field, inputClass, NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  age: number | null;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
};

export function StepStudent({ draft, age, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

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
            className="mt-1"
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
          hint={age != null ? `Idade: ${age} anos` : "Formato DD/MM/AAAA"}
        >
          <input
            className={inputClass(!!errors.birthDateBr)}
            value={draft.birthDateBr ?? ""}
            onChange={(e) => onChange({ birthDateBr: maskDate(e.target.value) })}
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
          />
        </Field>

        <Field label="E-mail *" error={errors.email}>
          <input
            type="email"
            className={inputClass(!!errors.email)}
            value={draft.email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })}
            autoComplete="email"
          />
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
            onChange={(e) => onChange({ grade: e.target.value, courses: [] })}
          >
            <option value="">Selecione…</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Onde estuda *" error={errors.school}>
          <input
            className={inputClass(!!errors.school)}
            value={draft.school ?? ""}
            onChange={(e) => onChange({ school: e.target.value })}
          />
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
          label="Código de indicação (opcional)"
          hint="Tem um código de quem te indicou?"
        >
          <input
            className={inputClass()}
            value={draft.referralCodeInput ?? ""}
            onChange={(e) =>
              onChange({ referralCodeInput: e.target.value.toUpperCase() })
            }
            placeholder="EX: JOAO-RNM-482"
          />
        </Field>
      </div>

      <NavButtons onNext={submit} />
    </div>
  );
}
