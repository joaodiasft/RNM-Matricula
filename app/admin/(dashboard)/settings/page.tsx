"use client";

import { useEffect, useState } from "react";

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
    if (res.ok) setMsg("Taxa salva.");
    else setMsg("Erro ao salvar.");
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl">Configurações</h1>

      <section className="mt-6 rounded-2xl bg-bg-elevated p-5">
        <h2 className="font-semibold">Taxa da maquininha (%)</h2>
        <p className="mt-1 text-sm text-muted">
          Exibida no passo de pagamento com cartão.
        </p>
        <input
          type="number"
          step="0.1"
          value={cardFee}
          onChange={(e) => setCardFee(e.target.value)}
          className="mt-3 w-full rounded-xl border border-line bg-bg px-3 py-2.5"
        />
        <button
          type="button"
          onClick={save}
          className="mt-3 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          Salvar
        </button>
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
      </section>

      <section className="mt-6 rounded-2xl bg-bg-elevated p-5">
        <h2 className="font-semibold">Exportar Excel por período</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            De
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5"
            />
          </label>
          <label className="text-sm">
            Até
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5"
            />
          </label>
        </div>
        <a
          href={`/api/admin/export?from=${from}&to=${to}`}
          className="mt-3 inline-block rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
        >
          Baixar Excel
        </a>
      </section>
    </div>
  );
}
