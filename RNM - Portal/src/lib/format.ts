import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function brl(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return (n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : parseISO(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(
  value: string | Date | null | undefined,
  pattern = "dd/MM/yyyy"
): string {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: ptBR }) : "—";
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  return fmtDate(value, "dd/MM/yyyy 'às' HH:mm");
}

export function fmtDateLong(value: string | Date | null | undefined): string {
  return fmtDate(value, "dd 'de' MMMM 'de' yyyy");
}

/** Idade em anos a partir da data de nascimento. */
export function idade(birth: string | Date | null | undefined): number | null {
  const d = toDate(birth);
  if (!d) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
