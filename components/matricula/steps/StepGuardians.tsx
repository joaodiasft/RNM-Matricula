"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { guardiansStepSchema, maskPhone } from "@/lib/validation";
import { Field, inputClass, NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepGuardians({ draft, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const result = guardiansStepSchema.safeParse({
      fatherName: draft.fatherName ?? "",
      fatherPhone: draft.fatherPhone ?? "",
      motherName: draft.motherName ?? "",
      motherPhone: draft.motherPhone ?? "",
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
        title="Dados dos responsáveis"
        subtitle="Como o aluno é menor de 18 anos, precisamos de pelo menos um responsável (pai ou mãe) com nome e telefone."
      />

      <div className="space-y-5">
        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-brand">Pai / responsável 1</p>
          <div className="space-y-3">
            <Field label="Nome" error={errors.fatherName}>
              <input
                className={inputClass(!!errors.fatherName)}
                value={draft.fatherName ?? ""}
                onChange={(e) => onChange({ fatherName: e.target.value })}
              />
            </Field>
            <Field label="Telefone" error={errors.fatherPhone}>
              <input
                className={inputClass(!!errors.fatherPhone)}
                value={draft.fatherPhone ?? ""}
                onChange={(e) =>
                  onChange({ fatherPhone: maskPhone(e.target.value) })
                }
                inputMode="tel"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-semibold text-brand">Mãe / responsável 2</p>
          <div className="space-y-3">
            <Field label="Nome">
              <input
                className={inputClass()}
                value={draft.motherName ?? ""}
                onChange={(e) => onChange({ motherName: e.target.value })}
              />
            </Field>
            <Field label="Telefone" error={errors.motherPhone}>
              <input
                className={inputClass(!!errors.motherPhone)}
                value={draft.motherPhone ?? ""}
                onChange={(e) =>
                  onChange({ motherPhone: maskPhone(e.target.value) })
                }
                inputMode="tel"
              />
            </Field>
          </div>
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
