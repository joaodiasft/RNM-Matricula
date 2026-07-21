"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SUBJECT_LABELS } from "@/lib/courses";

type Item = {
  enrollment: {
    id: string;
    status: string;
    createdAt: string | null;
    completedAt: string | null;
    modality: string | null;
    plan: string | null;
  };
  student: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    grade: string | null;
  } | null;
  courses: { subject: string; classCode: string }[];
};

export default function AdminDashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0 });
  const [status, setStatus] = useState("");
  const [course, setCourse] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (course) params.set("course", course);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/enrollments?${params}`);
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
    setStats(data.stats || { today: 0, week: 0 });
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Matrículas</h1>
          <p className="mt-1 text-sm text-muted">
            Hoje: <strong>{stats.today}</strong> · Últimos 7 dias:{" "}
            <strong>{stats.week}</strong>
          </p>
        </div>
        <a
          href="/api/admin/export?today=1"
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          Baixar Excel de hoje
        </a>
      </div>

      <form
        className="mt-6 grid gap-3 rounded-2xl bg-bg-elevated p-4 shadow-sm sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <input
          placeholder="Buscar nome, e-mail, telefone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="concluida">Concluída</option>
          <option value="em_andamento">Em andamento</option>
          <option value="abandonada">Abandonada</option>
        </select>
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm"
        >
          <option value="">Todos os cursos</option>
          <option value="redacao">{SUBJECT_LABELS.redacao}</option>
          <option value="exatas">{SUBJECT_LABELS.exatas}</option>
          <option value="matematica">{SUBJECT_LABELS.matematica}</option>
        </select>
        <button
          type="submit"
          className="rounded-xl border border-line px-3 py-2.5 text-sm font-semibold"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-bg-elevated shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Cursos</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Nenhuma matrícula encontrada.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr
                key={item.enrollment.id}
                className="border-b border-line/50 hover:bg-brand-soft/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/matriculas/${item.enrollment.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {item.student?.fullName || "— sem nome —"}
                  </Link>
                  <p className="text-xs text-muted">
                    {item.student?.phone || item.student?.email || ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {item.courses
                    .map((c) => `${c.classCode}`)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.enrollment.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {item.enrollment.completedAt || item.enrollment.createdAt
                    ? new Date(
                        item.enrollment.completedAt ||
                          item.enrollment.createdAt!
                      ).toLocaleString("pt-BR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    concluida: "bg-brand-soft text-brand-deep",
    em_andamento: "bg-accent-soft text-accent",
    abandonada: "bg-red-100 text-danger",
  };
  const label: Record<string, string> = {
    concluida: "Concluída",
    em_andamento: "Em andamento",
    abandonada: "Abandonada",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] || "bg-line"}`}
    >
      {label[status] || status}
    </span>
  );
}
