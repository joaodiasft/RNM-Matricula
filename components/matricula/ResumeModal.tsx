"use client";

type Props = {
  onContinue: () => void;
  onRestart: () => void;
};

export function ResumeModal({ onContinue, onRestart }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-bg-elevated p-6 shadow-xl">
        <h2 id="resume-title" className="font-display text-2xl font-bold text-fg">
          Continuar matrícula?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Vi que você começou uma matrícula. Quer continuar de onde parou ou
          começar de novo?
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onContinue}
            className="min-h-[48px] flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-deep"
          >
            Continuar de onde parei
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[48px] flex-1 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-fg"
          >
            Começar de novo
          </button>
        </div>
      </div>
    </div>
  );
}
