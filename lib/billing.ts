/**
 * Helpers de cobrança (mês de competência e próximo vencimento).
 * Módulo PURO — sem acesso a banco, seguro no client.
 *
 * Regra do próximo vencimento: dia 05 do mês SEGUINTE ao mês de competência.
 */

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** "2025-08" → { year: 2025, month: 8 } (month 1-12). null se inválido. */
function parseMonth(ym: string | null | undefined): { year: number; month: number } | null {
  if (!ym) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/** "2025-08" → "Agosto/2025". Vazio se inválido. */
export function monthLabel(ym: string | null | undefined): string {
  const p = parseMonth(ym);
  if (!p) return "";
  return `${MONTHS_PT[p.month - 1]}/${p.year}`;
}

/** "2025-08" → "05/09/2025" (dia 05 do mês seguinte). Vazio se inválido. */
export function nextDueLabel(ym: string | null | undefined): string {
  const p = parseMonth(ym);
  if (!p) return "";
  let year = p.year;
  let month = p.month + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `05/${String(month).padStart(2, "0")}/${year}`;
}

/** "2025-08-02" (ISO date) → "02/08/2025". Aceita já-formatado. */
export function dayLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return iso.trim();
  return `${m[3]}/${m[2]}/${m[1]}`;
}
