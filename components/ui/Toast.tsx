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
  info: "border-info/40 bg-info-soft text-ink shadow-[var(--shadow-lg)]",
  success:
    "border-success/40 bg-success-soft text-ink shadow-[var(--shadow-lg)]",
  warning:
    "border-warning/50 bg-warning-soft text-ink ring-2 ring-warning/25 shadow-[var(--shadow-lg)]",
  danger:
    "border-danger/50 bg-danger-soft text-danger ring-2 ring-danger/20 shadow-[var(--shadow-lg)]",
};

const DOT: Record<ToastTone, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const DURATION: Record<ToastTone, number> = {
  info: 5200,
  success: 4200,
  warning: 6500,
  danger: 8000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: { title: string; message?: string; tone?: ToastTone }) => {
      const tone = t.tone ?? "info";
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [
        ...prev.slice(-3),
        { id, title: t.title, message: t.message, tone },
      ]);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      window.setTimeout(() => dismiss(id), DURATION[tone]);
    },
    [dismiss]
  );

  const api = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 p-3 sm:p-4"
        aria-live="assertive"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-rise flex w-full max-w-lg items-start gap-3 rounded-2xl border-2 px-4 py-3.5 ${TONE[t.tone]}`}
            role={t.tone === "danger" || t.tone === "warning" ? "alert" : "status"}
          >
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[t.tone]}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold tracking-tight">{t.title}</p>
              {t.message && (
                <p className="mt-0.5 text-sm leading-relaxed opacity-95">
                  {t.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded-lg px-2 py-1 text-xs font-bold opacity-70 hover:opacity-100"
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
