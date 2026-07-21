"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-fg">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-xs leading-relaxed text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export function inputClass(error?: boolean) {
  return [
    "w-full min-h-[48px] rounded-xl border bg-bg-elevated px-3.5 py-3 text-fg outline-none transition duration-200",
    "placeholder:text-muted/70",
    "focus:border-brand focus:ring-4 focus:ring-brand/15",
    error ? "border-danger ring-2 ring-danger/15" : "border-line",
  ].join(" ");
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continuar",
  nextDisabled,
  loading,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="mt-8 flex gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] rounded-xl border border-line bg-bg-elevated px-5 py-3 text-sm font-semibold text-fg transition hover:bg-brand-soft/40 active:scale-[0.98]"
        >
          Voltar
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="ml-auto min-h-[48px] rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_color-mix(in_oklab,#e91e8c_35%,transparent)] transition hover:bg-brand-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Aguarde…
            </span>
          ) : (
            nextLabel
          )}
        </button>
      )}
    </div>
  );
}

export function StepTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold text-fg sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
      )}
    </div>
  );
}
