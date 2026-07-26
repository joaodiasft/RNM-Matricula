"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { SUBJECT_INFO, SUBJECT_LABELS, type Subject } from "@/lib/courses";
import { NavButtons, StepTitle } from "../ui";
import { useToast } from "@/components/ui/Toast";
import { ClassGroupsPanel } from "../ClassGroupsPanel";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

const META: Record<
  Subject,
  { badge: string; duration: string; color: string }
> = {
  redacao: {
    badge: "Redação",
    duration: "1h30 por aula",
    color: "from-[#ff008e]/15 to-transparent",
  },
  exatas: {
    badge: "Exatas",
    duration: "1h por aula",
    color: "from-[#ff008e]/10 to-transparent",
  },
  matematica: {
    badge: "Matemática",
    duration: "1h por aula",
    color: "from-[#ff008e]/10 to-transparent",
  },
};

export function StepCourseInfo({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const subjects = Array.from(
    new Set((draft.courses ?? []).map((c) => c.subject))
  ) as Subject[];

  const submit = () => {
    if (!draft.courseInfoAck) {
      setError("Confirme que leu as informações para continuar");
      toast.push({
        title: "Falta confirmar",
        message: "Marque que está ciente das informações do curso.",
        tone: "warning",
      });
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div>
      <StepTitle
        title="Informações do curso"
        subtitle="Regras e combinados de cada matéria que você escolheu — leia com calma."
      />

      <div className="space-y-4">
        {subjects.map((s) => (
          <article
            key={s}
            className={`overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]`}
          >
            <div
              className={`border-b border-line bg-gradient-to-r ${META[s].color} px-5 py-4`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
                {META[s].badge}
              </p>
              <h3 className="font-display mt-1 text-xl font-bold text-ink">
                {SUBJECT_LABELS[s]}
              </h3>
              <p className="mt-1 text-sm font-medium text-muted">
                {META[s].duration}
              </p>
            </div>
            <ul className="space-y-3 px-5 py-4">
              {SUBJECT_INFO[s].map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-5">
        <ClassGroupsPanel
          classCodes={(draft.courses ?? []).map((c) => c.classCode)}
        />
      </div>

      <label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border border-brand/20 bg-brand-soft/60 p-4 text-sm transition hover:border-brand/40">
        <input
          type="checkbox"
          checked={draft.courseInfoAck === true}
          onChange={(e) => onChange({ courseInfoAck: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
        />
        <span className="font-medium text-ink">
          Li e estou ciente das informações do curso e dos grupos de avisos.
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
