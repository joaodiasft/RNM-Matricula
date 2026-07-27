"use client";

type Props = {
  onContinue: () => void;
};

export function ImportantNoticeModal({ onContinue }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1a0a14]/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="important-notice-title"
    >
      <div className="animate-rise w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-lg)]">
        <div className="border-b border-warning/25 bg-warning-soft px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-deep">
            Aviso importante
          </p>
          <h2
            id="important-notice-title"
            className="font-display mt-1 text-2xl font-extrabold text-ink"
          >
            Leia antes de começar
          </h2>
        </div>

        <div className="space-y-4 px-5 py-5 text-sm leading-relaxed text-ink-soft">
          <p>
            Preencha com atenção e leia cada parte com cuidado, para que tudo
            fique preenchido certinho.
          </p>
          <p>
            Caso algum dado esteja errado ou divergente, preencha mesmo assim e
            avise na secretaria.
          </p>
          <div className="rounded-xl border border-warning/30 bg-warning-soft/70 px-3.5 py-3 text-ink">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep">
              Lembrete
            </p>
            <p className="mt-1.5">
              Se você tem contrato e parou o curso — mesmo que por um mês — o
              contrato está <strong>inativo</strong>.
            </p>
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={onContinue}
            className="brand-gradient min-h-[48px] w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-105 active:scale-[0.98]"
          >
            Entendi, continuar
          </button>
        </div>
      </div>
    </div>
  );
}
