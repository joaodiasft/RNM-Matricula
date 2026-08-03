"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatCard, Section, formatMoney } from "@/components/admin/ui";
import type { ClassFinanceSummary } from "@/lib/finance";

export default function AdminFinanceiroTurmasPage() {
  const [rows, setRows] = useState<ClassFinanceSummary[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/financeiro");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setRows(data.byClass || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openTotal = rows.reduce((s, r) => s + r.openTotal, 0);
  const paidTotal = rows.reduce((s, r) => s + r.paidTotal, 0);
  const overdue = rows.reduce((s, r) => s + r.overdueCount, 0);
  const students = rows.reduce((s, r) => s + r.studentCount, 0);

  return (
    <div>
      <Link
        href="/admin/financeiro"
        className="text-sm font-semibold text-brand hover:underline"
      >
        ← Financeiro
      </Link>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        Por turma
      </p>
      <h1 className="font-display mt-1 text-3xl font-extrabold">
        Resumo financeiro por turma
      </h1>
      <p className="mt-1 text-sm text-muted">
        Cobranças dos alunos com matrícula concluída em cada turma.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Turmas" value={rows.length} tone="brand" />
        <StatCard label="Alunos" value={students} />
        <StatCard
          label="Em aberto"
          value={formatMoney(openTotal)}
          tone={openTotal ? "danger" : "success"}
        />
        <StatCard
          label="Recebido"
          value={formatMoney(paidTotal)}
          tone="success"
        />
        <StatCard
          label="Atrasadas"
          value={overdue}
          tone={overdue ? "danger" : "default"}
        />
      </div>

      <div className="mt-5">
        <Section title="Turmas">
          {rows.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhuma turma com matrículas concluídas.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((c) => (
                <div
                  key={c.classCode}
                  className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)]"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor:
                      c.subject === "redacao"
                        ? "var(--brand, #c45c26)"
                        : c.subject === "exatas"
                          ? "#0f766e"
                          : "#1d4ed8",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-lg font-bold">
                        {c.classLabel}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        Código {c.classCode}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        c.overdueCount
                          ? "bg-danger-soft text-danger"
                          : c.openCount
                            ? "bg-warning-soft text-warning"
                            : "bg-success-soft text-success"
                      }`}
                    >
                      {c.overdueCount
                        ? `${c.overdueCount} atraso`
                        : c.openCount
                          ? `${c.openCount} aberto`
                          : "Em dia"}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Alunos</dt>
                      <dd className="font-semibold">{c.studentCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Em aberto</dt>
                      <dd className="font-extrabold tabular-nums">
                        {formatMoney(c.openTotal)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Já pago</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatMoney(c.paidTotal)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Cobranças abertas</dt>
                      <dd className="font-semibold">{c.openCount}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
