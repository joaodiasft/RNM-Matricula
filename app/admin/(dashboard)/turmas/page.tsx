"use client";

import { useEffect, useState } from "react";
import {
  btnGhostClass,
  btnPrimaryClass,
  inputAdminClass,
  waLink,
} from "@/components/admin/ui";

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
    {
      classCode: string;
      fullName: string | null;
      phone: string | null;
      email?: string | null;
      enrollmentId?: string | null;
    }[]
  >([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/classes");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
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
    } else {
      setMsg("Erro ao salvar vagas.");
    }
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        Capacidade
      </p>
      <h1 className="font-display mt-1 text-3xl font-extrabold">Turmas e vagas</h1>
      <p className="mt-1 text-sm text-muted">
        Ajuste o máximo de vagas por turma e acompanhe a lista de espera.
      </p>
      {msg && (
        <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-sm font-medium text-brand-deep">
          {msg}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-bg-subtle text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-bold">Turma</th>
              <th className="px-4 py-3 font-bold">Horário</th>
              <th className="px-4 py-3 font-bold">Ocupação</th>
              <th className="px-4 py-3 font-bold">Máx. vagas</th>
              <th className="px-4 py-3 font-bold">Espera</th>
              <th className="px-4 py-3 font-bold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const full = r.seatsLeft <= 0;
              return (
                <tr key={r.code} className="border-b border-line/60">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-ink">{r.code}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {r.subject}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">
                    {r.weekday} · {r.schedule}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        full
                          ? "bg-danger-soft text-danger"
                          : "bg-success-soft text-success"
                      }`}
                    >
                      {r.seatsTaken}/{r.maxSeats} · restam {r.seatsLeft}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <input
                      type="number"
                      min={0}
                      defaultValue={r.maxSeats}
                      id={`seats-${r.code}`}
                      className={`${inputAdminClass()} w-24`}
                    />
                  </td>
                  <td className="px-4 py-3.5 font-semibold">{r.waitlistCount}</td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      className="text-sm font-bold text-brand hover:underline"
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
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="font-display mt-10 text-2xl font-bold">Lista de espera</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {waitlist.length === 0 && (
          <li className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-muted">
            Ninguém na lista de espera.
          </li>
        )}
        {waitlist.map((w, i) => {
          const wa = waLink(w.phone);
          return (
            <li
              key={`${w.classCode}-${i}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[var(--shadow-xs)]"
            >
              <div>
                <p className="font-bold text-ink">
                  <span className="text-brand">{w.classCode}</span> —{" "}
                  {w.fullName || "—"}
                </p>
                <p className="text-xs text-muted">
                  {w.phone || "—"}
                  {w.email ? ` · ${w.email}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnGhostClass()}
                  >
                    WhatsApp
                  </a>
                )}
                {w.enrollmentId && (
                  <a
                    href={`/admin/matriculas/${w.enrollmentId}`}
                    className={btnPrimaryClass()}
                  >
                    Abrir
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
