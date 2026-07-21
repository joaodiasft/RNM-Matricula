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
      <span className="mb-1.5 block text-sm font-medium text-fg">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      )}
    </label>
  );
}

export function inputClass(error?: boolean) {
  return [
    "w-full rounded-xl border bg-bg px-3.5 py-3 text-fg outline-none transition",
    "focus:border-brand focus:ring-2 focus:ring-brand/20",
    error ? "border-danger" : "border-line",
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
          className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-fg"
        >
          Voltar
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="ml-auto rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Aguarde…" : nextLabel}
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
      <h2 className="font-display text-2xl text-fg sm:text-3xl">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
      )}
    </div>
  );
}
