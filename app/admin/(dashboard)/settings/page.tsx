"use client";

import { useEffect, useState } from "react";
import {
  btnGhostClass,
  btnPrimaryClass,
  inputAdminClass,
} from "@/components/admin/ui";

export default function AdminSettingsPage() {
  const [cardFee, setCardFee] = useState("3.5");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.cardFeePercent != null) setCardFee(String(d.cardFeePercent));
      });
  }, []);

  const save = async () => {
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardFeePercent: Number(cardFee) }),
    });
    if (res.ok) setMsg("Taxa salva com sucesso.");
    else setMsg("Erro ao salvar.");
  };

  return (
    <div className="max-w-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        Sistema
      </p>
      <h1 className="font-display mt-1 text-3xl font-extrabold">Configurações</h1>
      <p className="mt-1 text-sm text-muted">
        Taxa de cartão e exportações por período.
      </p>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)]">
        <h2 className="font-display text-lg font-bold">Taxa da maquininha (%)</h2>
        <p className="mt-1 text-sm text-muted">
          Exibida no passo de pagamento com cartão no formulário público.
        </p>
        <input
          type="number"
          step="0.1"
          value={cardFee}
          onChange={(e) => setCardFee(e.target.value)}
          className={`mt-3 ${inputAdminClass()}`}
        />
        <button type="button" onClick={save} className={`mt-3 ${btnPrimaryClass()}`}>
          Salvar taxa
        </button>
        {msg && <p className="mt-2 text-sm font-medium text-brand-deep">{msg}</p>}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)]">
        <h2 className="font-display text-lg font-bold">Exportar matrículas</h2>
        <p className="mt-1 text-sm text-muted">
          Gera CSV das matrículas concluídas no período (abre no Excel).
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink-soft">
            De
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={`mt-1 ${inputAdminClass()}`}
            />
          </label>
          <label className="text-sm font-semibold text-ink-soft">
            Até
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={`mt-1 ${inputAdminClass()}`}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/admin/export?from=${from}&to=${to}`}
            className={btnPrimaryClass()}
          >
            Baixar período
          </a>
          <a href="/api/admin/export?today=1" className={btnGhostClass()}>
            Só hoje
          </a>
        </div>
      </section>
    </div>
  );
}
