"use client";

import { useMemo, useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { coursesStepSchema } from "@/lib/validation";
import {
  getAvailableClasses,
  SUBJECT_LABELS,
  type Subject,
} from "@/lib/courses";
import { NavButtons, StepTitle } from "../ui";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepCourses({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const available = useMemo(
    () => getAvailableClasses(draft.grade || ""),
    [draft.grade]
  );

  const selected = draft.courses ?? [];

  const toggle = (subject: Subject, classCode: string) => {
    const withoutSubject = selected.filter((c) => c.subject !== subject);
    const already = selected.find(
      (c) => c.subject === subject && c.classCode === classCode
    );
    if (already) {
      onChange({ courses: withoutSubject, courseInfoAck: false });
    } else {
      onChange({
        courses: [...withoutSubject, { subject, classCode }],
        courseInfoAck: false,
      });
    }
  };

  const submit = () => {
    const result = coursesStepSchema.safeParse({ courses: selected });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Selecione uma turma");
      return;
    }
    setError(null);
    onNext();
  };

  const bySubject = (subject: Subject) =>
    available.filter((c) => c.subject === subject);

  const subjects = (["redacao", "exatas", "matematica"] as Subject[]).filter(
    (s) => bySubject(s).length > 0
  );

  return (
    <div>
      <StepTitle
        title="Turma e horário"
        subtitle="Escolha uma turma por matéria. Só aparecem turmas compatíveis com a série informada."
      />

      {!draft.grade && (
        <p className="text-sm text-danger">
          Volte e informe a série do aluno para ver as turmas.
        </p>
      )}

      <div className="space-y-6">
        {subjects.map((subject) => (
          <section key={subject}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">
              {SUBJECT_LABELS[subject]}
            </h3>
            <div className="grid gap-3">
              {bySubject(subject).map((c) => {
                const isOn = selected.some((s) => s.classCode === c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggle(subject, c.code)}
                    className={[
                      "rounded-xl border px-4 py-3 text-left transition",
                      isOn
                        ? "border-brand bg-brand-soft ring-2 ring-brand/30"
                        : "border-line bg-bg hover:border-brand/40",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-fg">
                          Turma {c.code}
                        </p>
                        <p className="text-sm text-muted">{c.label}</p>
                        <p className="mt-1 text-sm text-fg">
                          {c.day} · {c.schedule}
                        </p>
                        <p className="text-xs text-muted">Duração: {c.duration}</p>
                      </div>
                      <span
                        className={[
                          "mt-1 h-5 w-5 shrink-0 rounded-full border-2",
                          isOn
                            ? "border-brand bg-brand"
                            : "border-line bg-transparent",
                        ].join(" ")}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
