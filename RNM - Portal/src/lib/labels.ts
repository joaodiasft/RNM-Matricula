/** Rótulos em PT-BR e tom visual para os enums do banco. */

export type Tone = "success" | "danger" | "warning" | "info" | "neutral" | "brand";

export const attendanceLabel: Record<string, { text: string; tone: Tone }> = {
  PRESENTE: { text: "Presente", tone: "success" },
  FALTA: { text: "Falta", tone: "danger" },
  FALTA_JUSTIFICADA: { text: "Falta justificada", tone: "warning" },
  REPOSICAO: { text: "Reposição", tone: "info" },
  ATRASO: { text: "Atraso", tone: "warning" },
};

export const chargeStatusLabel: Record<string, { text: string; tone: Tone }> = {
  PENDENTE: { text: "Pendente", tone: "warning" },
  PAGO: { text: "Pago", tone: "success" },
  ATRASADO: { text: "Atrasado", tone: "danger" },
  CANCELADO: { text: "Cancelado", tone: "neutral" },
  ISENTO: { text: "Isento", tone: "info" },
};

export const chargeTypeLabel: Record<string, string> = {
  MATRICULA: "Matrícula",
  MENSALIDADE: "Mensalidade",
  MODULO: "Módulo",
  MATERIAL: "Material",
  TAXA_EXTRA: "Taxa extra",
  REMATRICULA: "Rematrícula",
};

export const paymentMethodLabel: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CARTAO: "Cartão",
  DINHEIRO: "Dinheiro",
  TRANSFERENCIA: "Transferência",
};

export const essayStatusLabel: Record<string, { text: string; tone: Tone }> = {
  PENDENTE: { text: "Pendente", tone: "neutral" },
  ENTREGUE: { text: "Entregue", tone: "info" },
  CORRIGIDA: { text: "Corrigida", tone: "success" },
};

export const studentStatusLabel: Record<string, { text: string; tone: Tone }> = {
  ATIVO: { text: "Ativo", tone: "success" },
  INATIVO: { text: "Inativo", tone: "neutral" },
  TRANCADO: { text: "Trancado", tone: "warning" },
  INADIMPLENTE: { text: "Inadimplente", tone: "danger" },
  BOLSISTA: { text: "Bolsista", tone: "brand" },
  CONCLUIDO: { text: "Concluído", tone: "info" },
};

export const enrollmentStatusLabel: Record<string, { text: string; tone: Tone }> = {
  ATIVA: { text: "Ativa", tone: "success" },
  PENDENTE: { text: "Pendente", tone: "warning" },
  CANCELADA: { text: "Cancelada", tone: "neutral" },
  CONCLUIDA: { text: "Concluída", tone: "info" },
  TRANCADA: { text: "Trancada", tone: "warning" },
};

export const sessionStatusLabel: Record<string, { text: string; tone: Tone }> = {
  AGENDADA: { text: "Agendada", tone: "info" },
  REALIZADA: { text: "Realizada", tone: "success" },
  CANCELADA: { text: "Cancelada", tone: "neutral" },
  REAGENDADA: { text: "Reagendada", tone: "warning" },
};

export const courseTypeLabel: Record<string, string> = {
  REDACAO: "Redação",
  EXATAS: "Exatas",
  MATEMATICA: "Matemática",
};

export const weekdayLabel: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};
