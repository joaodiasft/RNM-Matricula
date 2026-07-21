"use client";

type Props = {
  current: number;
  total: number;
  label: string;
  saving?: boolean;
  saved?: boolean;
};

export function ProgressBar({ current, total, label, saving, saved }: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="sticky top-2 z-20 rounded-[var(--radius)] border border-line bg-white/85 p-4 shadow-[var(--shadow-sm)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-ink">
          Passo {current} de {total}
          <span className="font-normal text-muted"> · {label}</span>
        </p>
        <div className="flex items-center gap-2.5 text-xs text-muted">
          {saving ? (
            <span className="inline-flex items-center gap-1.5 text-brand">
              <CloudIcon className="animate-pulse" />
              salvando…
            </span>
          ) : saved ? (
            <span
              className="inline-flex items-center gap-1.5 font-semibold text-success"
              title="Progresso salvo"
            >
              <CloudCheckIcon />
              salvo
            </span>
          ) : null}
          <span className="font-extrabold tabular-nums text-brand">{pct}%</span>
        </div>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-brand-soft"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso da matrícula: ${pct}%`}
      >
        <div
          className="brand-gradient h-full rounded-full shadow-[0_0_10px_var(--brand-glow)] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CloudIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M7 18a5 5 0 0 1-.4-10 7 7 0 0 1 13.5 2A4.5 4.5 0 0 1 18 18H7z" />
    </svg>
  );
}

function CloudCheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M7 18a5 5 0 0 1-.4-10 7 7 0 0 1 13.5 2A4.5 4.5 0 0 1 18 18H7z" />
      <path d="m9.5 13 1.8 1.8 3.7-3.8" />
    </svg>
  );
}
