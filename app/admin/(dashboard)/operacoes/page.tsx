"use client";

import { useEffect, useState } from "react";

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
      student: { fullName: string | null; email: string | null } | null;
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
      <h1 className="font-display text-3xl">Operações</h1>
      <div className="mt-4 flex gap-2 text-sm">
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
            className={`rounded-full px-4 py-2 font-semibold ${
              tab === id ? "bg-brand text-white" : "bg-bg-elevated text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "referrals" && (
        <ul className="mt-6 space-y-2 text-sm">
          {referrals.map((r) => (
            <li key={r.code} className="rounded-xl bg-bg-elevated px-4 py-3">
              <code className="font-semibold text-brand">{r.code}</code>
              <span className="text-muted">
                {" "}
                · usado: {r.referredEnrollmentId ? "sim" : "não"}
              </span>
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
              className="rounded-2xl bg-bg-elevated p-4 text-sm"
            >
              <p className="font-semibold">
                {item.student?.fullName || "—"} · {item.student?.email}
              </p>
              {tab === "obligations" && (
                <>
                  <p className="mt-1 text-muted">
                    Modalidade: {item.enrollment.modality} · Status:{" "}
                    {item.enrollment.obligationStatus} · Prazo:{" "}
                    {item.enrollment.obligationDeadline || "—"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-line px-3 py-1.5"
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
                        className="rounded-lg border border-line px-3 py-1.5"
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
                      className="rounded-lg border border-danger px-3 py-1.5 text-danger"
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
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-brand px-3 py-1.5 text-white"
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
                    className="rounded-lg border border-line px-3 py-1.5"
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
