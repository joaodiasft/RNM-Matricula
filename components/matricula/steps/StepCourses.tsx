"use client";

import { useEffect, useMemo, useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { coursesStepSchema } from "@/lib/validation";
import {
  getAvailableClasses,
  SUBJECT_LABELS,
  type Subject,
} from "@/lib/courses";
import { NavButtons, StepTitle } from "../ui";
import { useToast } from "@/components/ui/Toast";

type ClassAvail = {
  code: string;
  seatsLeft: number;
  full: boolean;
};

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepCourses({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, ClassAvail>>(
    {}
  );
  const toast = useToast();

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, ClassAvail> = {};
        for (const c of d.classes || []) {
          map[c.code] = {
            code: c.code,
            seatsLeft: c.seatsLeft,
            full: c.full,
          };
        }
        setAvailability(map);
      })
      .catch(() => {});
  }, []);

  const available = useMemo(
    () => getAvailableClasses(draft.grade || ""),
    [draft.grade]
  );

  const selected = draft.courses ?? [];
  const waitlistCodes = draft.waitlistCodes ?? [];

  const toggle = (subject: Subject, classCode: string) => {
    const withoutSubject = selected.filter((c) => c.subject !== subject);
    const already = selected.find(
      (c) => c.subject === subject && c.classCode === classCode
    );
    const full = availability[classCode]?.full;

    if (already) {
      onChange({
        courses: withoutSubject,
        waitlistCodes: waitlistCodes.filter((c) => c !== classCode),
        courseInfoAck: false,
      });
    } else {
      const nextWaitlist = full
        ? [
            ...waitlistCodes.filter((c) => {
              const prev = selected.find((s) => s.subject === subject);
              return prev ? c !== prev.classCode : true;
            }),
            classCode,
          ]
        : waitlistCodes.filter((c) => {
            const prev = selected.find((s) => s.subject === subject);
            return prev ? c !== prev.classCode : true;
          });
      onChange({
        courses: [...withoutSubject, { subject, classCode }],
        waitlistCodes: nextWaitlist,
        courseInfoAck: false,
      });
    }
  };

  const submit = () => {
    const result = coursesStepSchema.safeParse({ courses: selected });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Selecione uma turma");
      toast.push({
        title: "Selecione a turma",
        message: "Escolha pelo menos uma turma para continuar.",
        tone: "warning",
      });
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
        subtitle="Turmas filtradas pela sua série. Uma turma por matéria — se lotar, entre na lista de espera."
      />

      {!draft.grade && (
        <p className="mb-3 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          Volte e informe a série do aluno para ver as turmas disponíveis.
        </p>
      )}

      <div className="space-y-7">
        {subjects.map((subject) => (
          <section key={subject}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
                  Matéria
                </p>
                <h3 className="font-display text-xl font-bold text-ink">
                  {SUBJECT_LABELS[subject]}
                </h3>
              </div>
              <p className="text-xs text-muted">
                {bySubject(subject).length} horário
                {bySubject(subject).length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="grid gap-3">
              {bySubject(subject).map((c) => {
                const isOn = selected.some((s) => s.classCode === c.code);
                const avail = availability[c.code];
                const full = avail?.full ?? false;
                const seatsLeft = avail?.seatsLeft;
                const suggested =
                  c.grades?.includes(draft.grade || "") ||
                  (c.level === "medio" &&
                    ["1ª série EM", "2ª série EM", "3ª série EM"].includes(
                      draft.grade || ""
                    ));

                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggle(subject, c.code)}
                    className={[
                      "rounded-2xl border px-4 py-4 text-left transition",
                      isOn
                        ? "border-brand bg-brand-soft/80 ring-2 ring-brand/25"
                        : suggested
                          ? "border-brand/40 bg-white hover:border-brand/60"
                          : "border-line bg-white hover:border-brand/35",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-8 items-center rounded-xl bg-ink px-2.5 text-xs font-extrabold text-white">
                            {c.code}
                          </span>
                          {suggested && (
                            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                              sugerida
                            </span>
                          )}
                          {full && (
                            <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-danger">
                              lotada
                            </span>
                          )}
                        </div>
                        <p className="mt-2.5 font-display text-lg font-bold text-ink">
                          {c.day}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-ink-soft">
                          {c.schedule}
                        </p>
                        {c.label && (
                          <p className="mt-1 text-sm text-muted">{c.label}</p>
                        )}
                        {seatsLeft != null && (
                          <p
                            className={`mt-2 text-xs font-bold ${full ? "text-danger" : "text-brand"}`}
                          >
                            {full
                              ? "Entrar na lista de espera"
                              : `${seatsLeft} vaga${seatsLeft === 1 ? "" : "s"} restante${seatsLeft === 1 ? "" : "s"}`}
                          </p>
                        )}
                      </div>
                      <span
                        className={[
                          "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                          isOn
                            ? "border-brand bg-brand"
                            : "border-line bg-transparent",
                        ].join(" ")}
                      >
                        {isOn && (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </span>
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
