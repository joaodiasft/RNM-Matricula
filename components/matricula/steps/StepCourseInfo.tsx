"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { SUBJECT_INFO, SUBJECT_LABELS, type Subject } from "@/lib/courses";
import { NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

const ICONS: Record<Subject, string> = {
  redacao: "✏️",
  exatas: "📐",
  matematica: "🧮",
};

export function StepCourseInfo({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const subjects = Array.from(
    new Set((draft.courses ?? []).map((c) => c.subject))
  ) as Subject[];

  const submit = () => {
    if (!draft.courseInfoAck) {
      setError('Marque "Li e estou ciente das informações acima"');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div>
      <StepTitle
        title="Informações do curso"
        subtitle="Leia com atenção as regras de cada matéria escolhida."
      />

      <div className="space-y-4">
        {subjects.map((s) => (
          <div
            key={s}
            className="rounded-xl border border-line bg-bg px-4 py-4"
          >
            <p className="font-semibold text-fg">
              {ICONS[s]} {SUBJECT_LABELS[s]}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {SUBJECT_INFO[s]}
            </p>
          </div>
        ))}
      </div>

      <label className="mt-6 flex cursor-pointer gap-3 rounded-xl bg-brand-soft/50 p-4 text-sm">
        <input
          type="checkbox"
          checked={draft.courseInfoAck === true}
          onChange={(e) => onChange({ courseInfoAck: e.target.checked })}
          className="mt-0.5"
        />
        <span>Li e estou ciente das informações acima</span>
      </label>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
