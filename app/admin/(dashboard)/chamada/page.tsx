"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  btnGhostClass,
  btnPrimaryClass,
  inputAdminClass,
} from "@/components/admin/ui";
import type { AttendanceStatus } from "@/lib/attendance";

type TurmaMeta = {
  code: string;
  subject: string;
  subjectLabel: string;
  label: string;
  day: string;
  schedule: string;
  enrolled: number;
  modules: {
    index: number;
    label: string;
    dates: { label: string; iso: string }[];
  }[];
};

type StudentRow = {
  studentId: string;
  enrollmentId: string;
  enrollmentNumber: string | null;
  fullName: string;
  phone: string | null;
  grade: string | null;
  status: AttendanceStatus;
  assignmentDone: boolean;
  saved: boolean;
  frequency: { presentes: number; total: number } | null;
};

const STATUS_OPTS: {
  value: AttendanceStatus;
  label: string;
  active: string;
}[] = [
  {
    value: "presente",
    label: "Presente",
    active: "bg-success text-white ring-1 ring-success/30",
  },
  {
    value: "falta",
    label: "Falta",
    active: "bg-danger text-white ring-1 ring-danger/30",
  },
  {
    value: "justificada",
    label: "Justificada",
    active: "bg-warning text-ink ring-1 ring-warning/40",
  },
];

function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function AdminChamadaPage() {
  const [turmas, setTurmas] = useState<TurmaMeta[]>([]);
  const [classCode, setClassCode] = useState("");
  const [moduleIndex, setModuleIndex] = useState(1);
  const [lessonDate, setLessonDate] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [busca, setBusca] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const turma = useMemo(
    () => turmas.find((t) => t.code === classCode) || null,
    [turmas, classCode]
  );

  const moduleOpts = turma?.modules ?? [];
  const currentModule =
    moduleOpts.find((m) => m.index === moduleIndex) || moduleOpts[0] || null;
  const dateOpts = currentModule?.dates ?? [];

  useEffect(() => {
    void (async () => {
      setLoadingMeta(true);
      const res = await fetch("/api/admin/chamada");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível carregar as turmas");
        setLoadingMeta(false);
        return;
      }
      const list = (data.turmas || []) as TurmaMeta[];
      setTurmas(list);
      const firstWithStudents = list.find((t) => t.enrolled > 0) || list[0];
      if (firstWithStudents) {
        setClassCode(firstWithStudents.code);
        const m0 = firstWithStudents.modules[0];
        if (m0) {
          setModuleIndex(m0.index);
          setLessonDate(m0.dates[0]?.iso || "");
        }
      }
      setLoadingMeta(false);
    })();
  }, []);

  const loadStudents = useCallback(async (code: string, date: string) => {
    if (!code || !date) {
      setStudents([]);
      return;
    }
    setLoadingList(true);
    setError(null);
    const res = await fetch(
      `/api/admin/chamada?classCode=${encodeURIComponent(code)}&date=${encodeURIComponent(date)}`
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao carregar alunos");
      setStudents([]);
      setLoadingList(false);
      return;
    }
    setStudents(data.students || []);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    if (classCode && lessonDate) void loadStudents(classCode, lessonDate);
  }, [classCode, lessonDate, loadStudents]);

  // Ao trocar turma, reset módulo/data
  useEffect(() => {
    if (!turma) return;
    const m0 = turma.modules[0];
    setModuleIndex(m0?.index ?? 1);
    setLessonDate(m0?.dates[0]?.iso || "");
  }, [turma?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.enrollmentNumber || "").toLowerCase().includes(q)
    );
  }, [students, busca]);

  const stats = useMemo(() => {
    const presentes = students.filter((s) => s.status === "presente").length;
    const faltas = students.filter((s) => s.status === "falta").length;
    const justificadas = students.filter(
      (s) => s.status === "justificada"
    ).length;
    const assignments = students.filter((s) => s.assignmentDone).length;
    return { presentes, faltas, justificadas, assignments, total: students.length };
  }, [students]);

  const isRedacao = turma?.subject === "redacao";

  function patch(studentId: string, p: Partial<StudentRow>) {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, ...p } : s))
    );
  }

  function marcarTodos(status: AttendanceStatus) {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  }

  async function salvar() {
    if (!classCode || !lessonDate) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/chamada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode,
          lessonDate,
          registros: students.map((s) => ({
            studentId: s.studentId,
            enrollmentId: s.enrollmentId,
            status: s.status,
            assignmentDone: s.assignmentDone,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha ao salvar");
      setMessage(`Chamada salva — ${data.count ?? students.length} aluno(s).`);
      await loadStudents(classCode, lessonDate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loadingMeta) {
    return (
      <p className="py-16 text-center text-sm text-muted">Carregando turmas…</p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Secretaria
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">
            Chamada
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Selecione a turma e a aula do calendário. Aparecem só alunos com
            matrícula concluída na turma.
          </p>
        </div>
      </div>

      {error && (
        <p
          className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm font-semibold text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-xl border border-success/30 bg-success-soft px-3 py-2.5 text-sm font-semibold text-success">
          {message}
        </p>
      )}

      {/* Turmas */}
      <section className="mt-6">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          Turma
        </h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((t) => {
            const active = t.code === classCode;
            return (
              <button
                key={t.code}
                type="button"
                onClick={() => setClassCode(t.code)}
                className={[
                  "rounded-2xl border px-4 py-3.5 text-left transition",
                  active
                    ? "border-brand bg-brand-soft/70 ring-2 ring-brand/20 shadow-[var(--shadow-xs)]"
                    : "border-line bg-white hover:border-brand/35",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="data text-sm font-bold text-brand">
                    {t.code}
                  </span>
                  <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[10px] font-bold text-muted">
                    {t.enrolled} aluno{t.enrolled === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {t.subjectLabel}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {t.day} · {t.schedule}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Módulo + data */}
      {turma && (
        <section className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)] sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink-soft">
                Módulo
              </span>
              <select
                className={inputAdminClass()}
                value={currentModule?.index ?? ""}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setModuleIndex(idx);
                  const mod = moduleOpts.find((m) => m.index === idx);
                  setLessonDate(mod?.dates[0]?.iso || "");
                }}
              >
                {moduleOpts.length === 0 && (
                  <option value="">Sem calendário</option>
                )}
                {moduleOpts.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.label} ({m.dates.map((d) => d.label).join(", ")})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink-soft">
                Aula / data
              </span>
              <select
                className={inputAdminClass()}
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
              >
                {dateOpts.length === 0 && <option value="">—</option>}
                {dateOpts.map((d) => (
                  <option key={d.iso} value={d.iso}>
                    {d.label}/{d.iso.slice(0, 4)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {turma && (
            <p className="mt-3 text-xs text-muted">
              {turma.label} · {turma.day} {turma.schedule}
            </p>
          )}
        </section>
      )}

      {/* Stats */}
      {students.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-success/20 bg-success-soft/50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Presentes
            </p>
            <p className="font-display mt-0.5 text-2xl font-extrabold text-success">
              {stats.presentes}
            </p>
          </div>
          <div className="rounded-2xl border border-danger/20 bg-danger-soft/40 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Faltas
            </p>
            <p className="font-display mt-0.5 text-2xl font-extrabold text-danger">
              {stats.faltas}
            </p>
          </div>
          <div className="rounded-2xl border border-warning/25 bg-warning-soft/50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Justificadas
            </p>
            <p className="font-display mt-0.5 text-2xl font-extrabold text-warning">
              {stats.justificadas}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
              {isRedacao ? "Redações" : "Atividades"}
            </p>
            <p className="font-display mt-0.5 text-2xl font-extrabold text-ink">
              {stats.assignments}
              <span className="text-base font-bold text-muted">
                /{stats.total}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          className={`${inputAdminClass()} sm:max-w-xs`}
          placeholder="Buscar nome ou nº matrícula…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhostClass()}
            onClick={() => marcarTodos("presente")}
            disabled={!students.length}
          >
            Todos presentes
          </button>
          <button
            type="button"
            className={btnGhostClass()}
            onClick={() => marcarTodos("falta")}
            disabled={!students.length}
          >
            Todos falta
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]">
        {loadingList && (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Carregando alunos…
          </p>
        )}
        {!loadingList && students.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Nenhum aluno concluído nesta turma. Quando houver matrícula
            confirmada, a lista aparece aqui.
          </p>
        )}
        {!loadingList && filtered.length > 0 && (
          <ul className="divide-y divide-line/70">
            {filtered.map((s) => {
              const pct =
                s.frequency && s.frequency.total
                  ? Math.round(
                      (s.frequency.presentes / s.frequency.total) * 100
                    )
                  : null;
              return (
                <li
                  key={s.studentId}
                  className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-brand-tint/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-sm font-bold text-brand-deep">
                      {iniciais(s.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {s.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {s.enrollmentNumber ? (
                          <span className="data font-semibold text-brand-deep">
                            {s.enrollmentNumber}
                          </span>
                        ) : (
                          "—"
                        )}
                        {s.grade ? ` · ${s.grade}` : ""}
                        {pct !== null
                          ? ` · módulo ${pct}% (${s.frequency!.presentes}/${s.frequency!.total})`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {STATUS_OPTS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => patch(s.studentId, { status: opt.value })}
                        className={[
                          "min-h-[36px] rounded-xl px-3 py-1.5 text-[11px] font-bold transition",
                          s.status === opt.value
                            ? opt.active
                            : "bg-bg-subtle text-ink-soft ring-1 ring-line hover:bg-white",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <label className="ml-1 flex min-h-[36px] cursor-pointer items-center gap-2 rounded-xl border border-line bg-bg-subtle px-3 text-[11px] font-bold text-ink">
                      <input
                        type="checkbox"
                        checked={s.assignmentDone}
                        onChange={(e) =>
                          patch(s.studentId, {
                            assignmentDone: e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-[var(--brand)]"
                      />
                      {isRedacao ? "Redação" : "Atividade"}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!loadingList && students.length > 0 && filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted">
            Nenhum aluno encontrado na busca.
          </p>
        )}
      </div>

      <div className="sticky bottom-4 z-10 mt-6">
        <button
          type="button"
          className={`${btnPrimaryClass()} w-full py-3.5 text-base shadow-[var(--shadow-brand)]`}
          onClick={() => void salvar()}
          disabled={saving || !students.length || !lessonDate}
        >
          {saving ? "Salvando…" : "Salvar chamada"}
        </button>
      </div>
    </div>
  );
}
