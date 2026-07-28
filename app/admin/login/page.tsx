"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível entrar");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="card animate-rise overflow-hidden p-0">
        <div className="hero-gradient px-7 py-7">
          <div className="hero-logo-plate">
            <Logo variant="onLight" priority className="h-auto w-[180px]" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Painel da secretaria
          </p>
          <h1 className="font-display mt-1 text-xl font-extrabold text-white">
            Acesso restrito
          </h1>
        </div>
        <form onSubmit={submit} className="space-y-4 p-7">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-ink-soft">
              E-mail
            </span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-line bg-white px-3.5 py-3 shadow-[var(--shadow-xs)] outline-none transition hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/12"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-ink-soft">
              Senha
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-line bg-white px-3.5 py-3 shadow-[var(--shadow-xs)] outline-none transition hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/12"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="flex items-center gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger"
            >
              <svg
                className="h-4 w-4 shrink-0"
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
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="brand-gradient min-h-[48px] w-full rounded-xl py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
