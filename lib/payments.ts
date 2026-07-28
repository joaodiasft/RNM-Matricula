/**
 * Dados de pagamento PIX — Redação Nota Mil.
 *
 * ⚠️ NÃO ALTERAR os valores abaixo nem as imagens de QR code em /public
 * (redas1.png e exatas1.png). São os dados oficiais de cobrança informados
 * pela escola. Qualquer mudança aqui muda o destino do dinheiro.
 */

export type PixPayment = {
  id: "redacao" | "exatas";
  /** Título exibido ao aluno. */
  title: string;
  /** Caminho do QR code na pasta /public — servido como está, sem reprocessar. */
  qr: string;
  /** Rótulo da chave (ex.: CNPJ / Telefone). */
  keyLabel: string;
  /** Valor exato da chave PIX, exatamente como informado. */
  keyValue: string;
  /** Banco. */
  bank: string;
  /** Texto de identificação do pagamento. */
  note: string;
};

export const PIX_REDACAO: PixPayment = {
  id: "redacao",
  title: "Redação",
  qr: "/redas1.png",
  keyLabel: "CNPJ",
  keyValue: "51241242000108",
  bank: "Sicoob",
  note: "Pagamento para redação",
};

export const PIX_EXATAS: PixPayment = {
  id: "exatas",
  title: "Exatas e Matemática",
  qr: "/exatas1.png",
  keyLabel: "Telefone",
  keyValue: "62995551544",
  bank: "Sicoob",
  note: "Pagamento para exatas e matemática",
};
