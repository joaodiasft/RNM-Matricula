"use client";

type Props = {
  current: number;
  total: number;
  label: string;
  saving?: boolean;
};

export function ProgressBar({ current, total, label, saving }: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="rounded-[var(--radius)] bg-bg-elevated/80 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-fg">
          Passo {current} de {total}
          <span className="text-muted"> — {label}</span>
        </p>
        <div className="flex items-center gap-2 text-xs text-muted">
          {saving && <span className="animate-pulse">Salvando…</span>}
          <span className="font-semibold text-brand">{pct}%</span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-soft">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
