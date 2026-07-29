"use client";

import { useState } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { MODALITY_LABELS, type Modality } from "@/lib/pricing";
import { Field, inputClass, NavButtons, StepTitle } from "../ui";
import { useToast } from "@/components/ui/Toast";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

function dutyContent(modality: Modality | undefined) {
  if (modality === "desconto") {
    return {
      title: "Compromissos da Modalidade 1",
      intro:
        "Você escolheu a modalidade com maior desconto. Leia com atenção o que precisa fazer:",
      items: [
        {
          heading: "Ajudar na divulgação",
          body: "No dia de aula, ajude com uma foto dentro da sala. Quando o curso marcar você no Instagram, você deve repostar a marcação.",
        },
        {
          heading: "Trazer um aluno novo",
          body: "Você tem até o final do mês para trazer um novo aluno. Isso também vale para o próximo módulo — mas a pessoa precisa fazer a matrícula de fato.",
        },
      ],
    };
  }
  if (modality === "desconto_parcial" || modality === "apmf") {
    const label =
      modality === "apmf" ? "Modalidade 4" : "Modalidade 2";
    return {
      title: `Compromissos da ${label}`,
      intro:
        modality === "apmf"
          ? "Nesta modalidade o desconto depende da contribuição da APMF e da divulgação. Leia com atenção:"
          : "Você escolheu a modalidade com divulgação. Leia com atenção o que precisa fazer:",
      items: [
        {
          heading: "Ajudar na divulgação",
          body: "No dia de aula, ajude com uma foto dentro da sala. Quando o curso marcar você no Instagram, você deve repostar a marcação.",
        },
        ...(modality === "apmf"
          ? [
              {
                heading: "Contribuição da APMF",
                body: "O desconto só vale com a apresentação da contribuição da APMF. Sem isso, o valor volta para a Modalidade 3 (normal).",
              },
            ]
          : []),
      ],
    };
  }
  return {
    title: "Compromissos da modalidade",
    intro: "Confirme que está ciente das obrigações da modalidade escolhida.",
    items: [] as { heading: string; body: string }[],
  };
}

export function StepModalityDuty({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const modality = draft.modality as Modality | undefined;
  const content = dutyContent(modality);

  const submit = () => {
    if (!draft.modalityDutyAck) {
      setError("Marque que leu e está ciente para continuar");
      toast.push({
        title: "Confirmação necessária",
        message: "Marque a ciência e assine digitalmente para seguir.",
        tone: "danger",
      });
      return;
    }
    const sig = (draft.modalityDutySignature ?? "").trim();
    if (sig.length < 3) {
      setError("Digite seu nome completo como assinatura digital");
      toast.push({
        title: "Assinatura digital",
        message: "Digite seu nome completo para confirmar que está ciente.",
        tone: "danger",
      });
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div>
      <StepTitle
        title={content.title}
        subtitle={
          modality
            ? MODALITY_LABELS[modality]
            : "Avisos importantes da modalidade"
        }
      />

      <div className="mb-5 rounded-2xl border border-warning/40 bg-warning-soft px-4 py-4 text-sm leading-relaxed text-ink">
        <p className="font-bold text-ink">Aviso importante</p>
        <p className="mt-1.5 text-ink-soft">{content.intro}</p>
      </div>

      <ul className="space-y-3">
        {content.items.map((item) => (
          <li
            key={item.heading}
            className="rounded-2xl border border-line bg-white px-4 py-3.5 shadow-[var(--shadow-xs)]"
          >
            <p className="text-sm font-bold text-ink">{item.heading}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {item.body}
            </p>
          </li>
        ))}
      </ul>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-bg-subtle px-4 py-3.5 text-sm font-medium text-ink transition hover:border-line-strong">
        <input
          type="checkbox"
          checked={draft.modalityDutyAck === true}
          onChange={(e) => onChange({ modalityDutyAck: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
        />
        <span>
          Li e estou ciente das obrigações acima. *
        </span>
      </label>

      <div className="mt-4">
        <Field
          label="Assinatura digital — digite seu nome completo *"
          hint="Registramos este nome junto com a matrícula como prova de ciência."
          error={
            error && !draft.modalityDutyAck
              ? undefined
              : error?.includes("nome")
                ? error
                : undefined
          }
        >
          <input
            className={inputClass(Boolean(error?.includes("nome")))}
            value={draft.modalityDutySignature ?? ""}
            onChange={(e) =>
              onChange({ modalityDutySignature: e.target.value })
            }
            autoComplete="name"
            placeholder="Seu nome completo"
          />
        </Field>
      </div>

      {error && (
        <p
          className="mt-3 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm font-semibold text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
