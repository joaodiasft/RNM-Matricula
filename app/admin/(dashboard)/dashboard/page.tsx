"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CLASSES, SUBJECT_LABELS } from "@/lib/courses";
import {
  MODALITY_LABELS,
  type Modality,
} from "@/lib/pricing";
import {
  StatusBadge,
  StatCard,
  btnGhostClass,
  btnPrimaryClass,
  formatDateTime,
  formatMoney,
  inputAdminClass,
  waLink,
} from "@/components/admin/ui";

type Item = {
  enrollment: {
    id: string;
    status: string;
    createdAt: string | null;
    completedAt: string | null;
    modality: string | null;
    plan: string | null;
    paymentMethod: string | null;
    planTotal: string | null;
    enrollmentFee: string | null;
    obligationStatus: string | null;
    currentStep: number;
    lastActivityAt: string | null;
  };
  student: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    grade: string | null;
  } | null;
  courses: { subject: string; classCode: string; onWaitlist?: boolean | null }[];
};

type Stats = {
  today: number;
  week: number;
  total: number;
  concluida: number;
  em_andamento: number;
  abandonada: number;
  alerta_duplicidade: number;
};

const emptyStats: Stats = {
  today: 0,
  week: 0,
  total: 0,
  concluida: 0,
  em_andamento: 0,
  abandonada: 0,
  alerta_duplicidade: 0,
};

export default function AdminDashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [status, setStatus] = useState("");
  const [course, setCourse] = useState("");
  const [turma, setTurma] = useState("");
  const [modality, setModality] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (course) params.set("course", course);
    if (turma) params.set("turma", turma);
    if (modality) params.set("modality", modality);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/enrollments?${params}`);
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
    setStats({ ...emptyStats, ...(data.stats || {}) });
    setLoading(false);
  }, [status, course, turma, modality, from, to, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (!from && !to) params.set("today", "1");
    return `/api/admin/export?${params}`;
  }, [from, to]);

  const clearFilters = () => {
    setStatus("");
    setCourse("");
    setTurma("");
    setModality("");
    setFrom("");
    setTo("");
    setQ("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Secretaria
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">
            Matrículas
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gerencie status, contatos, valores e exportações em um só lugar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={exportHref} className={btnPrimaryClass()}>
            Exportar CSV
          </a>
          <a href="/api/admin/export?today=1" className={btnGhostClass()}>
            Só de hoje
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Hoje" value={stats.today} tone="brand" hint="Concluídas" />
        <StatCard label="7 dias" value={stats.week} hint="Concluídas" />
        <StatCard label="Em andamento" value={stats.em_andamento} />
        <StatCard
          label="Duplicidade"
          value={stats.alerta_duplicidade}
          tone={stats.alerta_duplicidade ? "warning" : "default"}
        />
        <StatCard
          label="Abandonadas"
          value={stats.abandonada}
          tone={stats.abandonada ? "danger" : "default"}
        />
      </div>

      <form
        className="mt-6 space-y-3 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)]"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            placeholder="Buscar nome, e-mail, telefone ou CPF"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={inputAdminClass()}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputAdminClass()}
          >
            <option value="">Todos os status</option>
            <option value="concluida">Concluída</option>
            <option value="em_andamento">Em andamento</option>
            <option value="abandonada">Abandonada</option>
            <option value="alerta_duplicidade">Duplicidade</option>
          </select>
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            className={inputAdminClass()}
          >
            <option value="">Todas as modalidades</option>
            {(Object.keys(MODALITY_LABELS) as Modality[]).map((m) => (
              <option key={m} value={m}>
                {MODALITY_LABELS[m]}
              </option>
            ))}
          </select>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className={inputAdminClass()}
          >
            <option value="">Todos os cursos</option>
            <option value="redacao">{SUBJECT_LABELS.redacao}</option>
            <option value="exatas">{SUBJECT_LABELS.exatas}</option>
            <option value="matematica">{SUBJECT_LABELS.matematica}</option>
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
            className={inputAdminClass()}
          >
            <option value="">Todas as turmas</option>
            {CLASSES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.day} {c.schedule}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputAdminClass()}
            aria-label="Data inicial"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputAdminClass()}
            aria-label="Data final"
          />
          <div className="flex gap-2">
            <button type="submit" className={`${btnPrimaryClass()} flex-1`}>
              Filtrar
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters();
              }}
              className={btnGhostClass()}
            >
              Limpar
            </button>
          </div>
        </div>
      </form>

      <p className="mt-3 text-xs text-muted">
        Exibindo <strong>{items.length}</strong> resultado(s)
        {stats.concluida ? ` · ${stats.concluida} concluídas no total` : ""}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-line bg-bg-subtle text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-bold">Aluno</th>
              <th className="px-4 py-3 font-bold">Turmas</th>
              <th className="px-4 py-3 font-bold">Modalidade / Plano</th>
              <th className="px-4 py-3 font-bold">Valor</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Data</th>
              <th className="px-4 py-3 font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Carregando matrículas…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Nenhuma matrícula encontrada com estes filtros.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const wa = waLink(
                item.student?.phone,
                `Olá${item.student?.fullName ? `, ${item.student.fullName.split(" ")[0]}` : ""}! Aqui é da secretaria.`
              );
              return (
                <tr
                  key={item.enrollment.id}
                  className="border-b border-line/60 transition hover:bg-brand-tint/50"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/matriculas/${item.enrollment.id}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      {item.student?.fullName || "— sem nome —"}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.student?.phone || item.student?.email || "Sem contato"}
                      {item.student?.grade ? ` · ${item.student.grade}` : ""}
                    </p>
                    {item.enrollment.status === "em_andamento" && (
                      <p className="mt-0.5 text-[11px] text-brand-deep">
                        Passo {item.enrollment.currentStep}/10
                        {item.enrollment.lastActivityAt
                          ? ` · ativo ${formatDateTime(item.enrollment.lastActivityAt)}`
                          : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {item.courses.length === 0 && (
                        <span className="text-xs text-muted">—</span>
                      )}
                      {item.courses.map((c) => (
                        <span
                          key={`${c.classCode}-${c.subject}`}
                          className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                            c.onWaitlist
                              ? "bg-warning-soft text-warning"
                              : "bg-brand-soft text-brand-deep"
                          }`}
                          title={
                            c.onWaitlist
                              ? "Lista de espera"
                              : SUBJECT_LABELS[
                                  c.subject as keyof typeof SUBJECT_LABELS
                                ]
                          }
                        >
                          {c.classCode}
                          {c.onWaitlist ? " *" : ""}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    <p className="font-medium text-ink">
                      {item.enrollment.modality
                        ? MODALITY_LABELS[
                            item.enrollment.modality as Modality
                          ] || item.enrollment.modality
                        : "—"}
                    </p>
                    <p className="text-muted">
                      {item.enrollment.plan || "—"}
                      {item.enrollment.obligationStatus &&
                      item.enrollment.modality &&
                      item.enrollment.modality !== "normal"
                        ? ` · obrigação: ${item.enrollment.obligationStatus}`
                        : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold tabular-nums">
                    {formatMoney(item.enrollment.planTotal)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={item.enrollment.status} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">
                    {formatDateTime(
                      item.enrollment.completedAt || item.enrollment.createdAt
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href={`/admin/matriculas/${item.enrollment.id}`}
                        className="rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-ink-soft"
                      >
                        Abrir
                      </Link>
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-[#25D366]/15 px-2.5 py-1.5 text-[11px] font-bold text-[#128C7E] ring-1 ring-[#25D366]/25"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
