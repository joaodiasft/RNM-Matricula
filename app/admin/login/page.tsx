"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
        setError(data.error || "Falha no login");
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <div className="overflow-hidden rounded-2xl border border-line/60 bg-bg-elevated shadow-[var(--shadow)]">
        <div className="bg-[#0a0a0a] px-6 py-5">
          <Image
            src="/logo-rnm.png"
            alt="Redação Nota Mil"
            width={180}
            height={80}
            className="h-auto w-[160px]"
            priority
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#e91e8c]">
            Painel da secretaria
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold">E-mail</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-line bg-bg px-3.5 py-3 outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold">Senha</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-line bg-bg px-3.5 py-3 outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="min-h-[48px] w-full rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
