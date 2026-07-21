"use client";

import { useEffect, useState } from "react";

type ClassRow = {
  code: string;
  subject: string;
  weekday: string;
  schedule: string;
  maxSeats: number;
  seatsTaken: number;
  seatsLeft: number;
  waitlistCount: number;
};

export default function AdminClassesPage() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [waitlist, setWaitlist] = useState<
    { classCode: string; fullName: string | null; phone: string | null }[]
  >([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/classes");
    const data = await res.json();
    setRows(data.classes || []);
    setWaitlist(data.waitlist || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveSeats = async (code: string, maxSeats: number) => {
    setMsg(null);
    const res = await fetch("/api/admin/classes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, maxSeats }),
    });
    if (res.ok) {
      setMsg(`Turma ${code} atualizada.`);
      void load();
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Turmas e vagas</h1>
      <p className="mt-1 text-sm text-muted">
        Defina o máximo de vagas por turma. Lista de espera aparece abaixo.
      </p>
      {msg && <p className="mt-3 text-sm text-brand">{msg}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-bg-elevated">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Turma</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Ocupadas</th>
              <th className="px-4 py-3">Máx.</th>
              <th className="px-4 py-3">Espera</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-line/50">
                <td className="px-4 py-3 font-semibold">{r.code}</td>
                <td className="px-4 py-3 text-xs">
                  {r.weekday} · {r.schedule}
                </td>
                <td className="px-4 py-3">
                  {r.seatsTaken} / restam {r.seatsLeft}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    defaultValue={r.maxSeats}
                    id={`seats-${r.code}`}
                    className="w-20 rounded-lg border border-line bg-bg px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">{r.waitlistCount}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand"
                    onClick={() => {
                      const el = document.getElementById(
                        `seats-${r.code}`
                      ) as HTMLInputElement;
                      void saveSeats(r.code, Number(el.value));
                    }}
                  >
                    Salvar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-display text-2xl">Lista de espera</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {waitlist.length === 0 && (
          <li className="text-muted">Ninguém na lista de espera.</li>
        )}
        {waitlist.map((w, i) => (
          <li
            key={`${w.classCode}-${i}`}
            className="rounded-xl bg-bg-elevated px-4 py-3"
          >
            <strong>{w.classCode}</strong> — {w.fullName || "—"} ·{" "}
            {w.phone || "—"}
          </li>
        ))}
      </ul>
    </div>
  );
}
