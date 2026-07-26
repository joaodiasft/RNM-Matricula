"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "info" | "success" | "warning" | "danger";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
};

type ToastApi = {
  push: (t: { title: string; message?: string; tone?: ToastTone }) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TONE: Record<ToastTone, string> = {
  info: "border-info/30 bg-info-soft text-ink",
  success: "border-success/30 bg-success-soft text-ink",
  warning: "border-warning/40 bg-warning-soft text-ink",
  danger: "border-danger/30 bg-danger-soft text-ink",
};

const DOT: Record<ToastTone, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: { title: string; message?: string; tone?: ToastTone }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [
        ...prev.slice(-3),
        { id, title: t.title, message: t.message, tone: t.tone ?? "info" },
      ]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss]
  );

  const api = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 p-3 sm:p-4"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-rise flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-[var(--shadow-lg)] ${TONE[t.tone]}`}
            role="status"
          >
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[t.tone]}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t.title}</p>
              {t.message && (
                <p className="mt-0.5 text-sm leading-relaxed opacity-90">
                  {t.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded-lg px-2 py-1 text-xs font-semibold opacity-70 hover:opacity-100"
              aria-label="Fechar aviso"
            >
              Fechar
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}
