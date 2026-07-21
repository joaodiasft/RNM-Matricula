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
      <span className="mb-1.5 block text-sm font-semibold text-ink-soft">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-xs leading-relaxed text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger"
        >
          <svg
            className="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.5" />
          </svg>
          {error}
        </span>
      )}
    </label>
  );
}

export function inputClass(error?: boolean) {
  return [
    "w-full min-h-[48px] rounded-xl border bg-white px-3.5 py-3 text-ink shadow-[var(--shadow-xs)] outline-none transition duration-200",
    "placeholder:text-muted-2",
    "hover:border-line-strong",
    "focus:border-brand focus:ring-4 focus:ring-brand/12",
    error
      ? "border-danger bg-danger-soft/40 ring-2 ring-danger/15"
      : "border-line",
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
    <div className="mt-8 flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-ink-soft transition hover:border-line-strong hover:bg-bg-subtle active:scale-[0.98]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="brand-gradient ml-auto inline-flex min-h-[48px] items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-[1.06] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:brightness-100"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
              Aguarde…
            </>
          ) : (
            <>
              {nextLabel}
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </>
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
      <h2 className="font-display text-2xl font-extrabold text-ink sm:text-[1.7rem]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
      )}
    </div>
  );
}
