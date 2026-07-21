"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  StatusBadge,
  btnGhostClass,
  btnPrimaryClass,
} from "@/components/admin/ui";

export default function AdminOperationsPage() {
  const [tab, setTab] = useState<"obligations" | "referrals" | "duplicates">(
    "obligations"
  );
  const [items, setItems] = useState<
    {
      enrollment: {
        id: string;
        modality: string | null;
        obligationStatus: string | null;
        obligationDeadline: string | null;
        obligationDivulged: boolean | null;
        obligationBroughtStudent: boolean | null;
      };
      student: {
        fullName: string | null;
        email: string | null;
        phone?: string | null;
      } | null;
    }[]
  >([]);
  const [referrals, setReferrals] = useState<
    {
      code: string;
      referrerEnrollmentId: string | null;
      referredEnrollmentId: string | null;
    }[]
  >([]);

  const load = async () => {
    if (tab === "referrals") {
      const res = await fetch("/api/admin/operations?view=referrals");
      const data = await res.json();
      setReferrals(data.referrals || []);
      return;
    }
    const view = tab === "duplicates" ? "duplicates" : "obligations";
    const res = await fetch(`/api/admin/operations?view=${view}`);
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const patch = async (body: Record<string, unknown>) => {
    await fetch("/api/admin/operations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    void load();
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        Filas operacionais
      </p>
      <h1 className="font-display mt-1 text-3xl font-extrabold">Operações</h1>
      <p className="mt-1 text-sm text-muted">
        Obrigações de modalidade, códigos de indicação e alertas de duplicidade.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {(
          [
            ["obligations", "Obrigações"],
            ["referrals", "Indicações"],
            ["duplicates", "Duplicidade"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 font-bold transition ${
              tab === id
                ? "bg-brand text-white shadow-[var(--shadow-brand)]"
                : "border border-line bg-white text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "referrals" && (
        <ul className="mt-6 space-y-2 text-sm">
          {referrals.map((r) => (
            <li
              key={r.code}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white px-4 py-3 shadow-[var(--shadow-xs)]"
            >
              <div>
                <code className="font-bold text-brand">{r.code}</code>
                <span className="ml-2 text-muted">
                  {r.referredEnrollmentId ? "já utilizado" : "disponível"}
                </span>
              </div>
              {r.referrerEnrollmentId && (
                <Link
                  href={`/admin/matriculas/${r.referrerEnrollmentId}`}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Ver indicante →
                </Link>
              )}
            </li>
          ))}
          {referrals.length === 0 && (
            <li className="text-muted">Nenhum código ainda.</li>
          )}
        </ul>
      )}

      {(tab === "obligations" || tab === "duplicates") && (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item.enrollment.id}
              className="rounded-2xl border border-line bg-white p-4 text-sm shadow-[var(--shadow-xs)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">
                    {item.student?.fullName || "—"}
                  </p>
                  <p className="text-xs text-muted">
                    {item.student?.email || item.student?.phone || "Sem contato"}
                  </p>
                </div>
                <Link
                  href={`/admin/matriculas/${item.enrollment.id}`}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Abrir matrícula →
                </Link>
              </div>

              {tab === "obligations" && (
                <>
                  <p className="mt-2 text-muted">
                    Modalidade: <strong>{item.enrollment.modality}</strong> ·
                    Status:{" "}
                    <strong>{item.enrollment.obligationStatus || "—"}</strong> ·
                    Prazo: {item.enrollment.obligationDeadline || "—"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={btnGhostClass()}
                      onClick={() =>
                        patch({
                          enrollmentId: item.enrollment.id,
                          obligationDivulged: true,
                          obligationStatus:
                            item.enrollment.modality === "desconto_parcial"
                              ? "cumprida"
                              : item.enrollment.obligationBroughtStudent
                                ? "cumprida"
                                : "pendente",
                        })
                      }
                    >
                      Divulgou: sim
                    </button>
                    {item.enrollment.modality === "desconto" && (
                      <button
                        type="button"
                        className={btnGhostClass()}
                        onClick={() =>
                          patch({
                            enrollmentId: item.enrollment.id,
                            obligationBroughtStudent: true,
                            obligationStatus: item.enrollment.obligationDivulged
                              ? "cumprida"
                              : "pendente",
                          })
                        }
                      >
                        Trouxe aluno: sim
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] items-center rounded-xl border border-danger px-4 text-sm font-semibold text-danger"
                      onClick={() =>
                        patch({
                          enrollmentId: item.enrollment.id,
                          obligationStatus: "nao_cumprida",
                        })
                      }
                    >
                      Não cumprida
                    </button>
                  </div>
                </>
              )}

              {tab === "duplicates" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status="alerta_duplicidade" />
                  <button
                    type="button"
                    className={btnPrimaryClass()}
                    onClick={() =>
                      patch({
                        enrollmentId: item.enrollment.id,
                        resolveDuplicate: "keep",
                      })
                    }
                  >
                    Manter como concluída
                  </button>
                  <button
                    type="button"
                    className={btnGhostClass()}
                    onClick={() =>
                      patch({
                        enrollmentId: item.enrollment.id,
                        resolveDuplicate: "discard",
                      })
                    }
                  >
                    Descartar
                  </button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-muted">Nenhum item nesta fila.</p>
          )}
        </div>
      )}
    </div>
  );
}
