"use client";

import { useCallback, useEffect, useState } from "react";
import { btnPrimaryClass, inputAdminClass } from "@/components/admin/ui";

type CodeRow = {
  id: string;
  code: string;
  label: string | null;
  usedAt: string | null;
  usedByEnrollmentId: string | null;
  usedByStudentName: string | null;
  createdAt: string | null;
};

export default function BolsasAdminPage() {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [label, setLabel] = useState("Bolsa integral");
  const [count, setCount] = useState(1);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/scholarships");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setCodes(data.codes || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/scholarships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        count: custom.trim() ? 1 : count,
        code: custom.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao criar");
      return;
    }
    setMessage(`Criado(s): ${(data.created || []).join(", ")}`);
    setCustom("");
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Apagar este código disponível?")) return;
    const res = await fetch(`/api/admin/scholarships?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Não foi possível apagar");
      return;
    }
    await load();
  };

  const free = codes.filter((c) => !c.usedAt).length;
  const used = codes.filter((c) => c.usedAt).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-ink">Códigos de bolsa</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Cada código é de uso único. Quando o aluno valida e conclui a matrícula,
        o código fica marcado com o nome e o vínculo da matrícula.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-success-soft px-3 py-1 font-semibold text-success">
          Disponíveis: {free}
        </span>
        <span className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand">
          Usados: {used}
        </span>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)]">
        <h2 className="font-display text-xl font-bold text-ink">Criar códigos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink-soft">Rótulo</span>
            <input
              className={inputAdminClass()}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink-soft">
              Quantidade (1–20)
            </span>
            <input
              type="number"
              min={1}
              max={20}
              className={inputAdminClass()}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
              disabled={Boolean(custom.trim())}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold text-ink-soft">
              Código personalizado (opcional — cria só 1)
            </span>
            <input
              className={`${inputAdminClass()} uppercase`}
              value={custom}
              onChange={(e) => setCustom(e.target.value.toUpperCase())}
              placeholder="BOLSA-RNM-XXXX"
            />
          </label>
        </div>
        <button type="button" onClick={() => void create()} className={`${btnPrimaryClass()} mt-4`}>
          Gerar código(s)
        </button>
        {message && (
          <p className="mt-3 rounded-xl bg-success-soft px-3 py-2 text-sm font-medium text-success">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </section>

      <section className="mt-8 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-bg-subtle text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Usado por</th>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-line/70">
                <td className="px-4 py-3 font-mono font-semibold text-ink">
                  {c.code}
                  {c.label && (
                    <span className="mt-0.5 block font-sans text-xs font-normal text-muted">
                      {c.label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {c.usedAt ? (
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
                      Usado
                    </span>
                  ) : (
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">
                      Disponível
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {c.usedByStudentName || "—"}
                  {c.usedByEnrollmentId && (
                    <a
                      href={`/admin/matriculas/${c.usedByEnrollmentId}`}
                      className="mt-0.5 block text-xs font-semibold text-brand underline"
                    >
                      Ver matrícula
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {c.usedAt
                    ? new Date(c.usedAt).toLocaleString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {!c.usedAt && (
                    <button
                      type="button"
                      onClick={() => void remove(c.id)}
                      className="text-xs font-semibold text-danger hover:underline"
                    >
                      Apagar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Nenhum código ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
