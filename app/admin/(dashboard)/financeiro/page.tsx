"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StatCard,
  Section,
  formatDate,
  formatMoney,
  btnPrimaryClass,
  inputAdminClass,
} from "@/components/admin/ui";
import {
  CHARGE_STATUS_LABELS,
  CHARGE_TYPE_LABELS,
  CHARGE_TYPES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type ClassFinanceSummary,
  type FinanceChargeRow,
  type FinanceStudentOption,
} from "@/lib/finance";

export default function AdminFinanceiroPage() {
  const [students, setStudents] = useState<FinanceStudentOption[]>([]);
  const [charges, setCharges] = useState<FinanceChargeRow[]>([]);
  const [byClass, setByClass] = useState<ClassFinanceSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [enrollmentId, setEnrollmentId] = useState("");
  const [type, setType] = useState("MENSALIDADE");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(5);
    return d.toISOString().slice(0, 10);
  });
  const [description, setDescription] = useState("");

  const [chargeId, setChargeId] = useState("");
  const [method, setMethod] = useState("PIX");
  const [paidAt, setPaidAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [payAmount, setPayAmount] = useState("");
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/financeiro");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setStudents(data.students || []);
    setCharges(data.charges || []);
    setByClass(data.byClass || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = useMemo(
    () => charges.filter((c) => c.status === "PENDENTE" || c.status === "ATRASADO"),
    [charges]
  );
  const overdue = useMemo(
    () => charges.filter((c) => c.status === "ATRASADO"),
    [charges]
  );
  const openTotal = open.reduce((s, c) => s + Number(c.amount), 0);
  const paidTotal = charges
    .filter((c) => c.status === "PAGO")
    .reduce((s, c) => s + Number(c.amount), 0);

  const onStudentChange = (id: string) => {
    setEnrollmentId(id);
    const s = students.find((x) => x.enrollmentId === id);
    if (s?.monthlyValue && !amount) {
      setAmount(String(Number(s.monthlyValue)));
    }
  };

  const createCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/financeiro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_charge",
        enrollmentId,
        type,
        amount,
        dueDate,
        description,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Falha ao criar cobrança");
      return;
    }
    setMessage("Cobrança criada. O aluno verá no Portal.");
    setDescription("");
    await load();
  };

  const registerPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/financeiro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register_payment",
        chargeId,
        method,
        paidAt,
        amount: payAmount || null,
        reference,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Falha ao registrar pagamento");
      return;
    }
    setMessage("Pagamento registrado.");
    setChargeId("");
    setPayAmount("");
    setReference("");
    await load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Secretaria
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold">Financeiro</h1>
          <p className="mt-1 text-sm text-muted">
            Lance cobranças e pagamentos. O aluno acompanha no Portal.
          </p>
        </div>
        <Link
          href="/admin/financeiro/turmas"
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand/40 hover:text-brand"
        >
          Resumo por turmas →
        </Link>
      </div>

      {(message || error) && (
        <p
          className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${
            error
              ? "bg-danger-soft text-danger"
              : "bg-success-soft text-success"
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Em aberto"
          value={formatMoney(openTotal)}
          hint={`${open.length} cobrança(s)`}
          tone={open.length ? "danger" : "success"}
        />
        <StatCard
          label="Em atraso"
          value={overdue.length}
          tone={overdue.length ? "danger" : "default"}
        />
        <StatCard
          label="Recebido"
          value={formatMoney(paidTotal)}
          tone="success"
        />
        <StatCard
          label="Turmas"
          value={byClass.length}
          hint="ver resumo"
          tone="brand"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Section title="Nova cobrança">
          <form onSubmit={createCharge} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Aluno</span>
              <select
                className={inputAdminClass()}
                required
                value={enrollmentId}
                onChange={(e) => onStudentChange(e.target.value)}
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {students.map((s) => (
                  <option key={s.enrollmentId} value={s.enrollmentId}>
                    {s.fullName}
                    {s.enrollmentNumber ? ` · ${s.enrollmentNumber}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold">Tipo</span>
                <select
                  className={inputAdminClass()}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {CHARGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold">Valor (R$)</span>
                <input
                  className={inputAdminClass()}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Vencimento</span>
              <input
                className={inputAdminClass()}
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Descrição</span>
              <input
                className={inputAdminClass()}
                placeholder="Ex.: Mensalidade agosto/2026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <button type="submit" disabled={pending} className={btnPrimaryClass()}>
              {pending ? "Salvando…" : "Criar cobrança"}
            </button>
          </form>
        </Section>

        <Section title="Registrar pagamento">
          <form onSubmit={registerPay} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Cobrança em aberto</span>
              <select
                className={inputAdminClass()}
                required
                value={chargeId}
                onChange={(e) => setChargeId(e.target.value)}
              >
                <option value="" disabled>
                  {open.length ? "Selecione…" : "Nenhuma em aberto"}
                </option>
                {open.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.studentName} · {c.description ?? c.type} ·{" "}
                    {formatMoney(c.amount)} · vence {c.dueDate}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold">Forma</span>
                <select
                  className={inputAdminClass()}
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold">Data</span>
                <input
                  className={inputAdminClass()}
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Valor pago (opcional)</span>
              <input
                className={inputAdminClass()}
                type="number"
                min="0.01"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Referência / comprovante</span>
              <input
                className={inputAdminClass()}
                placeholder="ID Pix, NSU…"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={pending || open.length === 0}
              className={btnPrimaryClass()}
            >
              {pending ? "Salvando…" : "Registrar pagamento"}
            </button>
          </form>
        </Section>
      </div>

      <div className="mt-5">
        <Section title="Todas as cobranças">
          {charges.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhuma cobrança ainda. Crie a primeira no formulário acima.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 font-bold">Aluno</th>
                    <th className="py-2 pr-3 font-bold">Descrição</th>
                    <th className="py-2 pr-3 font-bold">Tipo</th>
                    <th className="py-2 pr-3 font-bold">Vencimento</th>
                    <th className="py-2 pr-3 text-right font-bold">Valor</th>
                    <th className="py-2 pr-3 font-bold">Situação</th>
                    <th className="py-2 font-bold">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((c) => {
                    const st =
                      CHARGE_STATUS_LABELS[c.status] ?? {
                        text: c.status,
                        tone: "default" as const,
                      };
                    const pay = c.payments[0];
                    return (
                      <tr key={c.id} className="border-b border-line/60">
                        <td className="py-2.5 pr-3">
                          <div className="font-semibold">{c.studentName}</div>
                          <div className="text-xs text-muted">
                            {c.enrollmentNumber ?? "—"}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">{c.description ?? "—"}</td>
                        <td className="py-2.5 pr-3 text-muted">
                          {CHARGE_TYPE_LABELS[c.type] ?? c.type}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums whitespace-nowrap">
                          {formatDate(c.dueDate)}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-bold tabular-nums">
                          {formatMoney(c.amount)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              st.tone === "danger"
                                ? "bg-danger-soft text-danger"
                                : st.tone === "success"
                                  ? "bg-success-soft text-success"
                                  : st.tone === "warning"
                                    ? "bg-warning-soft text-warning"
                                    : "bg-line text-muted"
                            }`}
                          >
                            {st.text}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-muted">
                          {pay
                            ? `${PAYMENT_METHOD_LABELS[pay.method] ?? pay.method} · ${formatDate(pay.paidAt)}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      {byClass.length > 0 && (
        <div className="mt-5">
          <Section
            title="Prévia por turma"
            action={
              <Link
                href="/admin/financeiro/turmas"
                className="text-sm font-bold text-brand"
              >
                Ver completo
              </Link>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byClass.slice(0, 6).map((c) => (
                <div
                  key={c.classCode}
                  className="rounded-xl border border-line bg-bg-subtle/50 p-3.5"
                >
                  <div className="font-bold">{c.classLabel}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {c.studentCount} aluno(s)
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted">Em aberto</span>
                    <strong className="tabular-nums">
                      {formatMoney(c.openTotal)}
                    </strong>
                  </div>
                  {c.overdueCount > 0 && (
                    <p className="mt-1 text-xs font-bold text-danger">
                      {c.overdueCount} atraso
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
