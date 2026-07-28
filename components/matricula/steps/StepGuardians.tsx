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

  const fatherFilled = Boolean(draft.fatherName?.trim());
  const motherFilled = Boolean(draft.motherName?.trim());
  // Seleção efetiva: usa a escolha do usuário ou, na ausência, o 1º preenchido.
  const principal =
    draft.principalGuardian ??
    (fatherFilled ? "pai" : motherFilled ? "mae" : undefined);

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
    // Garante um responsável principal salvo (padrão = 1º preenchido).
    const effective =
      draft.principalGuardian ?? (fatherFilled ? "pai" : "mae");
    if (draft.principalGuardian !== effective) {
      onChange({ principalGuardian: effective });
    }
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

        <div className="rounded-xl border border-brand/25 bg-brand-tint p-4">
          <p className="text-sm font-semibold text-brand">
            Responsável principal
          </p>
          <p className="mb-3 mt-0.5 text-xs text-muted">
            É quem vai receber o acesso de responsável do sistema.
          </p>
          <div className="space-y-2">
            <label
              className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition ${
                principal === "pai"
                  ? "border-brand bg-white font-semibold text-ink"
                  : "border-line bg-white/60 text-ink-soft"
              } ${!fatherFilled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="principalGuardian"
                className="h-4 w-4 accent-[var(--brand)]"
                checked={principal === "pai"}
                disabled={!fatherFilled}
                onChange={() => onChange({ principalGuardian: "pai" })}
              />
              <span>
                Pai / responsável 1
                {draft.fatherName?.trim() ? ` — ${draft.fatherName.trim()}` : ""}
              </span>
            </label>
            <label
              className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition ${
                principal === "mae"
                  ? "border-brand bg-white font-semibold text-ink"
                  : "border-line bg-white/60 text-ink-soft"
              } ${!motherFilled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="principalGuardian"
                className="h-4 w-4 accent-[var(--brand)]"
                checked={principal === "mae"}
                disabled={!motherFilled}
                onChange={() => onChange({ principalGuardian: "mae" })}
              />
              <span>
                Mãe / responsável 2
                {draft.motherName?.trim() ? ` — ${draft.motherName.trim()}` : ""}
              </span>
            </label>
          </div>
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
