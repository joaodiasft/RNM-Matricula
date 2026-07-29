import { SUBJECT_LABELS, type Subject } from "@/lib/courses";
import {
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "@/lib/pricing";

/** Rótulos em português para as chaves do rascunho da matrícula. */
export const DRAFT_FIELD_LABELS: Record<string, string> = {
  lgpdConsent: "Consentimento LGPD",
  fullName: "Nome completo",
  birthDateBr: "Data de nascimento",
  email: "E-mail",
  phone: "Telefone",
  instagram: "Instagram",
  grade: "Série atual",
  school: "Onde estuda",
  cpf: "CPF",
  rg: "RG",
  address: "Endereço",
  observations: "Observações",
  contractSigned: "Contrato já assinado",
  referralSource: "Como conheceu",
  referralCodeInput: "Código de indicação usado",
  scholarshipCode: "Código de bolsa",
  scholarshipValid: "Bolsa válida",
  fatherName: "Nome do pai",
  fatherPhone: "Telefone do pai",
  motherName: "Nome da mãe",
  motherPhone: "Telefone da mãe",
  principalGuardian: "Responsável principal",
  courses: "Cursos e turmas",
  waitlistCodes: "Lista de espera (turmas)",
  courseInfoAck: "Confirmou informações do curso",
  modality: "Modalidade",
  modalityDutyAck: "Ciência dos compromissos da modalidade",
  modalityDutySignature: "Assinatura dos compromissos",
  waivedFee: "Taxa de matrícula isenta",
  plan: "Plano de pagamento",
  paymentMethod: "Forma de pagamento",
  needsInvoice: "Solicitou nota fiscal",
  invoiceName: "NF — nome do responsável",
  invoiceCpf: "NF — CPF do responsável",
  invoiceAddress: "NF — endereço",
  invoicePhone: "NF — telefone",
  invoiceNotes: "NF — observação",
  autoRenew: "Rematrícula automática",
  noticePayment: "Aviso: pagamento",
  noticeAbsence: "Aviso: faltas",
  noticeModality: "Aviso: modalidade",
  noticeGroups: "Aviso: grupos",
  noticePunctuality: "Aviso: pontualidade",
  noticeMaterials: "Aviso: materiais",
  noticeContractWhatsApp: "Aviso: contrato no WhatsApp",
  confirmEmail: "Confirmação de e-mail",
  confirmPhone: "Confirmação de telefone",
  declarationName: "Nome na declaração",
};

const OBLIGATION_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  cumprida: "Cumprida",
  parcial: "Parcial",
  nao_cumprida: "Não cumprida",
};

export function draftFieldLabel(key: string): string {
  return DRAFT_FIELD_LABELS[key] || key;
}

export function formatDraftValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") return value ? "Sim" : "Não";

  if (key === "modality" && typeof value === "string") {
    return MODALITY_LABELS[value as Modality] || value;
  }
  if (key === "plan" && typeof value === "string") {
    return PLAN_LABELS[value as Plan] || value;
  }
  if (key === "paymentMethod" && typeof value === "string") {
    return PAYMENT_LABELS[value as PaymentMethod] || value;
  }
  if (key === "principalGuardian" && typeof value === "string") {
    if (value === "pai") return "Pai";
    if (value === "mae") return "Mãe";
    return value;
  }
  if (key === "courses" && Array.isArray(value)) {
    const parts = value.map((c) => {
      if (!c || typeof c !== "object") return String(c);
      const row = c as { subject?: string; classCode?: string };
      const subj =
        SUBJECT_LABELS[row.subject as Subject] || row.subject || "?";
      return `${subj} · ${row.classCode || "—"}`;
    });
    return parts.length ? parts.join("; ") : "—";
  }
  if (key === "waitlistCodes" && Array.isArray(value)) {
    return value.length ? value.map(String).join(", ") : "—";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function modalityLabel(value?: string | null): string {
  if (!value) return "—";
  return MODALITY_LABELS[value as Modality] || value;
}

export function obligationStatusLabel(value?: string | null): string {
  if (!value) return "—";
  return OBLIGATION_STATUS_LABELS[value] || value;
}
