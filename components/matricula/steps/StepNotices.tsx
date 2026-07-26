"use client";

import { useState, type ReactNode } from "react";
import type { EnrollmentDraft } from "@/lib/validation";
import { COMPANY } from "@/lib/company";
import { NavButtons, StepTitle } from "../ui";
import { useToast } from "@/components/ui/Toast";

type Props = {
  draft: EnrollmentDraft;
  onChange: (p: Partial<EnrollmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

type NoticeKey =
  | "noticePayment"
  | "noticeAbsence"
  | "noticeModality"
  | "noticeGroups"
  | "noticePunctuality"
  | "noticeMaterials"
  | "noticeContractWhatsApp";

const BASE_NOTICES: {
  key: NoticeKey;
  title: string;
  body: string;
  bodyBolsa?: string;
}[] = [
  {
    key: "noticePayment",
    title: "Vencimento todo dia 5",
    body: "A mensalidade vence todo dia 5. Se precisar de prazo, avise a secretaria com antecedência — vamos ajudar a organizar.",
    bodyBolsa:
      "Com bolsa integral (100%), não há mensalidade nem taxa a pagar nesta matrícula. Se a condição especial for revogada pela secretaria, as regras de pagamento voltam a valer.",
  },
  {
    key: "noticeAbsence",
    title: "Faltas e reposições",
    body: "Falta em Redação: fale com a secretaria para agendar reposição (avise com pelo menos 3h de antecedência). Em Exatas, reposição só quando os professores marcarem.",
  },
  {
    key: "noticeModality",
    title: "Modalidade até o fim do curso",
    body: "A modalidade escolhida vale até o fim do período letivo. Alteração só na secretaria. Nas modalidades com desconto, o não cumprimento das obrigações faz o valor voltar ao normal.",
    bodyBolsa:
      "A modalidade escolhida vale até o fim do período letivo. Com bolsa integral, valores permanecem isentos enquanto a condição especial estiver ativa. Alteração só na secretaria.",
  },
  {
    key: "noticeGroups",
    title: "Grupos de avisos",
    body: "Cada turma tem um grupo oficial de avisos. Seu pedido de entrada só é aprovado após a confirmação do pagamento. Não saia do grupo sem falar com a secretaria.",
    bodyBolsa:
      "Cada turma tem um grupo oficial de avisos. Com bolsa integral, o pedido de entrada é aprovado após a confirmação da matrícula (sem pagamento). Não saia do grupo sem falar com a secretaria.",
  },
  {
    key: "noticePunctuality",
    title: "Pontualidade",
    body: "Chegue com alguns minutos de antecedência. Atrasos frequentes prejudicam o aproveitamento da aula.",
  },
  {
    key: "noticeMaterials",
    title: "Materiais",
    body: "Traga caderno/tablet e o material indicado pelo professor. Listas e textos podem ser enviados pelo grupo.",
  },
];

export function StepNotices({ draft, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const showContractNotice = draft.contractSigned === true;
  const isBolsa = draft.scholarshipValid === true;

  const requiredKeys: NoticeKey[] = [
    ...BASE_NOTICES.map((n) => n.key),
    ...(showContractNotice ? (["noticeContractWhatsApp"] as NoticeKey[]) : []),
  ];

  const submit = () => {
    const missing = requiredKeys.some((k) => !draft[k]);
    if (missing) {
      setError("Marque todos os avisos para continuar");
      toast.push({
        title: "Avisos incompletos",
        message: "Confirme cada ponto listado abaixo.",
        tone: "warning",
      });
      return;
    }
    setError(null);
    onNext();
  };

  const Item = ({
    checked,
    onToggle,
    title,
    children,
  }: {
    checked?: boolean;
    onToggle: (v: boolean) => void;
    title: string;
    children: ReactNode;
  }) => (
    <label className="flex cursor-pointer gap-3 rounded-2xl border border-line bg-white p-4 text-sm leading-relaxed shadow-[var(--shadow-xs)] transition hover:border-brand/30">
      <input
        type="checkbox"
        checked={checked === true}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--brand)]"
      />
      <span>
        <span className="block font-bold text-ink">{title}</span>
        <span className="mt-1 block text-ink-soft">{children}</span>
        <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-brand">
          Estou ciente
        </span>
      </span>
    </label>
  );

  const waUrl = `https://wa.me/${COMPANY.phoneDigits}?text=${encodeURIComponent(
    `Olá! Fiz a matrícula online (${draft.fullName || "aluno"}) e preciso falar sobre divergência no contrato/valor.`
  )}`;

  return (
    <div>
      <StepTitle
        title="Avisos finais"
        subtitle="Leia e confirme cada ponto. São as regras práticas do curso."
      />

      <div className="space-y-3">
        {BASE_NOTICES.map((n) => (
          <Item
            key={n.key}
            title={
              isBolsa && n.key === "noticePayment"
                ? "Sem cobrança (bolsa integral)"
                : n.title
            }
            checked={draft[n.key]}
            onToggle={(v) => onChange({ [n.key]: v })}
          >
            {isBolsa && n.bodyBolsa ? n.bodyBolsa : n.body}
          </Item>
        ))}

        {showContractNotice && (
          <Item
            title="Contrato e valores"
            checked={draft.noticeContractWhatsApp}
            onToggle={(v) => onChange({ noticeContractWhatsApp: v })}
          >
            Se você já assinou o contrato e o valor ou os termos forem diferentes
            do que está preenchendo aqui, fale conosco no WhatsApp para
            alinharmos antes de concluir.{" "}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              Abrir WhatsApp ({COMPANY.phone})
            </a>
          </Item>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <NavButtons onBack={onBack} onNext={submit} />
    </div>
  );
}
