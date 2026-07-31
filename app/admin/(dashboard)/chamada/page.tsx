"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  btnGhostClass,
  btnPrimaryClass,
  inputAdminClass,
} from "@/components/admin/ui";
import type { StatusPresenca } from "@/lib/chamada/schema";

type Mes = { id: string; nome: string; ano: number };
type Aula = { id: string; numero: number; data: string };
type Modulo = { id: string; numero: number; aulas: Aula[] };
type AlunoMes = {
  id: string;
  alunoId: string;
  aluno: { id: string; nome: string; ativo: boolean };
};
type Presenca = {
  alunoId: string;
  aulaId: string;
  status: StatusPresenca;
  redacaoEntregue: boolean;
};
type RowState = {
  alunoId: string;
  nome: string;
  status: StatusPresenca;
  redacaoEntregue: boolean;
};

const OPCOES: {
  value: StatusPresenca;
  label: string;
  active: string;
}[] = [
  {
    value: "PRESENTE",
    label: "Presente",
    active: "bg-success text-white ring-success",
  },
  {
    value: "FALTA",
    label: "Falta",
    active: "bg-danger text-white ring-danger",
  },
  {
    value: "JUSTIFICADA",
    label: "Justif.",
    active: "bg-warning text-white ring-warning",
  },
];

function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

function corAvatar(nome: string) {
  const cores = ["#F3C9D4", "#B7D8C4", "#C9D6F3", "#F3E2C9", "#E2C9F3", "#C9F3EE"];
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = nome.charCodeAt(i) + ((h << 5) - h);
  return cores[Math.abs(h) % cores.length];
}

export default function AdminChamadaPage() {
  const [meses, setMeses] = useState<Mes[]>([]);
  const [mesId, setMesId] = useState("");
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [moduloId, setModuloId] = useState("");
  const [aulaId, setAulaId] = useState("");
  const [rows, setRows] = useState<RowState[]>([]);
  const [presencasMes, setPresencasMes] = useState<Presenca[]>([]);
  const [busca, setBusca] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/chamada/meses");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível carregar os meses");
        setLoading(false);
        return;
      }
      const list = Array.isArray(data) ? data : [];
      setMeses(list);
      if (list.length) setMesId(list[0].id);
      setLoading(false);
    })();
  }, []);

  const carregarPresencasMes = useCallback((id: string) => {
    fetch(`/api/admin/chamada/presencas?mesId=${id}`)
      .then((r) => r.json())
      .then((p: Presenca[]) => setPresencasMes(Array.isArray(p) ? p : []));
  }, []);

  const loadMes = useCallback(
    async (id: string) => {
      setError(null);
      const res = await fetch(`/api/admin/chamada/meses?id=${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao carregar mês");
        return;
      }
      setModulos(data.modulos ?? []);
      const firstMod = data.modulos?.[0];
      setModuloId(firstMod?.id ?? "");
      setAulaId(firstMod?.aulas?.[0]?.id ?? "");

      const alunos: AlunoMes[] = (data.alunos ?? []).filter(
        (am: AlunoMes) => am.aluno?.ativo
      );
      setRows(
        alunos.map((am) => ({
          alunoId: am.alunoId,
          nome: am.aluno.nome,
          status: "PRESENTE" as StatusPresenca,
          redacaoEntregue: false,
        }))
      );
      carregarPresencasMes(id);
    },
    [carregarPresencasMes]
  );

  useEffect(() => {
    if (mesId) void loadMes(mesId);
  }, [mesId, loadMes]);

  useEffect(() => {
    if (!aulaId || !rows.length) return;
    void (async () => {
      const res = await fetch(`/api/admin/chamada/presencas?aulaId=${aulaId}`);
      const existing: Presenca[] = await res.json();
      if (!Array.isArray(existing)) return;
      setRows((prev) =>
        prev.map((r) => {
          const found = existing.find((p) => p.alunoId === r.alunoId);
          if (!found) return { ...r, status: "PRESENTE", redacaoEntregue: false };
          return {
            ...r,
            status: found.status,
            redacaoEntregue: found.redacaoEntregue,
          };
        })
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao trocar aula
  }, [aulaId]);

  const aulasDoModulo = useMemo(
    () => modulos.find((m) => m.id === moduloId)?.aulas ?? [],
    [modulos, moduloId]
  );

  const freqPorAluno = useMemo(() => {
    const aulaIds = new Set(aulasDoModulo.map((a) => a.id));
    const mapa = new Map<string, { presentes: number; total: number }>();
    for (const p of presencasMes) {
      if (!aulaIds.has(p.aulaId)) continue;
      const at = mapa.get(p.alunoId) ?? { presentes: 0, total: 0 };
      at.total += 1;
      if (p.status === "PRESENTE") at.presentes += 1;
      mapa.set(p.alunoId, at);
    }
    return mapa;
  }, [presencasMes, aulasDoModulo]);

  const stats = useMemo(() => {
    const presentes = rows.filter((r) => r.status === "PRESENTE").length;
    const faltas = rows.filter((r) => r.status === "FALTA").length;
    const justificadas = rows.filter((r) => r.status === "JUSTIFICADA").length;
    const redacoes = rows.filter((r) => r.redacaoEntregue).length;
    const total = rows.length || 1;
    return {
      presentes,
      faltas,
      justificadas,
      redacoes,
      total,
      totalReal: rows.length,
    };
  }, [rows]);

  const rowsFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? rows.filter((r) => r.nome.toLowerCase().includes(q)) : rows;
  }, [rows, busca]);

  function updateRow(alunoId: string, patch: Partial<RowState>) {
    setRows((prev) =>
      prev.map((r) => (r.alunoId === alunoId ? { ...r, ...patch } : r))
    );
  }

  function marcarTodos(status: StatusPresenca) {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  }

  async function salvar() {
    if (!aulaId) {
      setError("Selecione uma aula");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/chamada/presencas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aulaId,
          registros: rows.map((r) => ({
            alunoId: r.alunoId,
            status: r.status,
            redacaoEntregue: r.redacaoEntregue,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha");
      setMessage(`Chamada salva (${data.count ?? rows.length} alunos).`);
      carregarPresencasMes(mesId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar chamada");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-muted">Carregando chamada…</p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
          Secretaria
        </p>
        <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">
          Chamada
        </h1>
        <p className="mt-1 text-sm text-muted">
          Marque presença, falta e redação por aula. Só a secretaria acessa.
        </p>
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

      <section className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)]">
        <h2 className="text-sm font-bold text-ink">Seleção</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink-soft">Mês</span>
            <select
              className={inputAdminClass()}
              value={mesId}
              onChange={(e) => {
                setMesId(e.target.value);
                setModuloId("");
                setAulaId("");
              }}
            >
              {meses.length === 0 && <option value="">Nenhum mês</option>}
              {meses.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}/{m.ano}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink-soft">Módulo</span>
            <select
              className={inputAdminClass()}
              value={moduloId}
              onChange={(e) => {
                const v = e.target.value;
                setModuloId(v);
                const mod = modulos.find((m) => m.id === v);
                setAulaId(mod?.aulas?.[0]?.id ?? "");
              }}
            >
              {modulos.length === 0 && <option value="">Nenhum módulo</option>}
              {modulos.map((m) => (
                <option key={m.id} value={m.id}>
                  Módulo {m.numero}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink-soft">Aula</span>
            <select
              className={inputAdminClass()}
              value={aulaId}
              onChange={(e) => setAulaId(e.target.value)}
            >
              {aulasDoModulo.length === 0 && <option value="">Nenhuma aula</option>}
              {aulasDoModulo.map((a) => (
                <option key={a.id} value={a.id}>
                  Aula {a.numero} —{" "}
                  {new Date(a.data).toLocaleDateString("pt-BR")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {stats.totalReal > 0 && (
        <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)]">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="bg-success"
              style={{ width: `${(stats.presentes / stats.total) * 100}%` }}
            />
            <div
              className="bg-warning"
              style={{ width: `${(stats.justificadas / stats.total) * 100}%` }}
            />
            <div
              className="bg-danger"
              style={{ width: `${(stats.faltas / stats.total) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span>
              <b className="text-success">{stats.presentes}</b> presentes
            </span>
            <span>
              <b className="text-warning">{stats.justificadas}</b> justificadas
            </span>
            <span>
              <b className="text-danger">{stats.faltas}</b> faltas
            </span>
            <span className="text-muted">
              {stats.redacoes}/{stats.totalReal} redações
            </span>
          </div>
        </section>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          className={`${inputAdminClass()} sm:max-w-xs`}
          placeholder="Buscar aluno…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhostClass()}
            onClick={() => marcarTodos("PRESENTE")}
          >
            Todos presentes
          </button>
          <button
            type="button"
            className={btnGhostClass()}
            onClick={() => marcarTodos("FALTA")}
          >
            Todos falta
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rowsFiltrados.map((row) => {
          const f = freqPorAluno.get(row.alunoId);
          const pct =
            f && f.total ? Math.round((f.presentes / f.total) * 100) : null;
          return (
            <div
              key={row.alunoId}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-[var(--shadow-xs)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-ink"
                  style={{ backgroundColor: corAvatar(row.nome) }}
                >
                  {iniciais(row.nome)}
                </div>
                <div>
                  <p className="font-semibold text-ink">{row.nome}</p>
                  <p className="text-xs text-muted">
                    {pct !== null
                      ? `Frequência no módulo: ${pct}% (${f!.presentes}/${f!.total})`
                      : "Sem chamadas anteriores neste módulo"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {OPCOES.map(({ value, label, active }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateRow(row.alunoId, { status: value })}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 ring-line transition ${
                      row.status === value
                        ? active
                        : "bg-white text-ink-soft hover:bg-bg-subtle"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <label className="ml-1 flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={row.redacaoEntregue}
                    onChange={(e) =>
                      updateRow(row.alunoId, {
                        redacaoEntregue: e.target.checked,
                      })
                    }
                    className="h-3.5 w-3.5 accent-[var(--brand)]"
                  />
                  Redação
                </label>
              </div>
            </div>
          );
        })}

        {!rows.length && !error && (
          <p className="rounded-2xl border border-dashed border-line py-10 text-center text-sm text-muted">
            Nenhum aluno ativo neste mês. Cadastre alunos no sistema de chamada
            (RNM-Chamada) e vincule ao mês.
          </p>
        )}
        {rows.length > 0 && !rowsFiltrados.length && (
          <p className="py-6 text-center text-sm text-muted">
            Nenhum aluno encontrado.
          </p>
        )}
      </div>

      <div className="sticky bottom-4 z-10 mt-6">
        <button
          type="button"
          className={`${btnPrimaryClass()} w-full py-3 text-base shadow-[var(--shadow-brand)]`}
          onClick={() => void salvar()}
          disabled={saving || !aulaId || !rows.length}
        >
          {saving ? "Salvando…" : "Salvar chamada"}
        </button>
      </div>
    </div>
  );
}
