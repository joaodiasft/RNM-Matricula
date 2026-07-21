"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { COMPANY } from "@/lib/company";
import { maskPhone } from "@/lib/validation";

export default function EditContactPage() {
  const { editToken } = useParams<{ editToken: string }>();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/edit/${editToken}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        const d = await res.json();
        setFullName(d.fullName || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
      })
      .catch(() => setError("Link inválido ou expirado."))
      .finally(() => setLoading(false));
  }, [editToken]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/edit/${editToken}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });
    if (res.ok) setMsg("Dados atualizados com sucesso.");
    else setError("Não foi possível salvar.");
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl bg-bg-elevated p-6 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          {COMPANY.name}
        </p>
        <h1 className="font-display mt-2 text-3xl">Atualizar contato</h1>
        <p className="mt-2 text-sm text-muted">
          Você pode alterar apenas telefone e e-mail. Modalidade, plano e turma
          só mudam na secretaria.
        </p>

        {loading && <p className="mt-6 text-sm text-muted">Carregando…</p>}
        {error && !loading && <p className="mt-6 text-sm text-danger">{error}</p>}

        {!loading && !error && (
          <form onSubmit={save} className="mt-6 space-y-4">
            <p className="text-sm">
              Aluno: <strong>{fullName}</strong>
            </p>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-3"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Telefone</span>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-3"
                inputMode="tel"
              />
            </label>
            {msg && <p className="text-sm text-brand">{msg}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white"
            >
              Salvar
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
