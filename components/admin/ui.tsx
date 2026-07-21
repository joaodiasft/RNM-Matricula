"use client";

import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company";

export const STATUS_LABELS: Record<string, string> = {
  concluida: "Concluída",
  em_andamento: "Em andamento",
  abandonada: "Abandonada",
  alerta_duplicidade: "Duplicidade",
};

export const STATUS_STYLES: Record<string, string> = {
  concluida: "bg-success-soft text-success ring-1 ring-success/20",
  em_andamento: "bg-brand-soft text-brand-deep ring-1 ring-brand/25",
  abandonada: "bg-danger-soft text-danger ring-1 ring-danger/20",
  alerta_duplicidade: "bg-warning-soft text-warning ring-1 ring-warning/25",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[status] || "bg-line text-muted"}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function formatMoney(value?: string | number | null) {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function phoneDigits(phone?: string | null) {
  return (phone || "").replace(/\D/g, "");
}

export function waLink(phone?: string | null, text?: string) {
  const digits = phoneDigits(phone);
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${withCountry}${q}`;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "brand" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "border-line bg-white",
    brand: "border-brand/20 bg-brand-tint",
    success: "border-success/20 bg-success-soft/60",
    warning: "border-warning/25 bg-warning-soft/70",
    danger: "border-danger/20 bg-danger-soft/50",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3.5 shadow-[var(--shadow-xs)] ${tones[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="font-display mt-1 text-2xl font-extrabold tabular-nums text-ink">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)] ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-0.5 border-b border-line/70 py-2.5 last:border-0 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="text-sm font-medium text-ink">{children || "—"}</dd>
    </div>
  );
}

export function ContactActions({
  phone,
  email,
  name,
}: {
  phone?: string | null;
  email?: string | null;
  name?: string | null;
}) {
  const wa = waLink(
    phone,
    `Olá${name ? `, ${name.split(" ")[0]}` : ""}! Aqui é da ${COMPANY.name}.`
  );
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {phone && (
        <a
          href={`tel:${phoneDigits(phone)}`}
          className="inline-flex min-h-[36px] items-center rounded-lg border border-line bg-bg-subtle px-3 text-xs font-semibold text-ink-soft hover:border-brand/40 hover:text-brand"
        >
          Ligar
        </a>
      )}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center rounded-lg bg-[#25D366]/15 px-3 text-xs font-semibold text-[#128C7E] ring-1 ring-[#25D366]/30 hover:bg-[#25D366]/25"
        >
          WhatsApp
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex min-h-[36px] items-center rounded-lg border border-line bg-bg-subtle px-3 text-xs font-semibold text-ink-soft hover:border-brand/40 hover:text-brand"
        >
          E-mail
        </a>
      )}
    </div>
  );
}

export function inputAdminClass() {
  return "w-full min-h-[44px] rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-[var(--shadow-xs)] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12";
}

export function btnPrimaryClass() {
  return "brand-gradient inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-105 disabled:opacity-50";
}

export function btnGhostClass() {
  return "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-line-strong hover:bg-bg-subtle disabled:opacity-50";
}
