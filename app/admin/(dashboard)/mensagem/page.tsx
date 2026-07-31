"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Section,
  btnPrimaryClass,
  btnGhostClass,
  inputAdminClass,
  waLink,
} from "@/components/admin/ui";
import { CLASSES, getClassByCode, SUBJECT_LABELS, type Subject } from "@/lib/courses";
import { getClassModules } from "@/lib/class-schedule";
import { MODALITY_LABELS, type Modality } from "@/lib/pricing";
import { COREDACAO_DEFAULT, PLATFORM_LINKS } from "@/lib/platforms";
import { monthLabel, nextDueLabel, dayLabel } from "@/lib/billing";
import {
  buildWelcomeMessage,
  type WelcomeCourse,
} from "@/lib/welcome-message";

type ListItem = {
  enrollment: {
    id: string;
    enrollmentNumber: string | null;
    status: string;
    modality: string | null;
  };
  student: { fullName: string | null; phone: string | null; email: string | null } | null;
};

type Detail = {
  enrollment: {
    id: string;
    enrollmentNumber: string | null;
    modality: string | null;
    paymentStatus: string | null;
    paymentMonth: string | null;
    paymentForm: string | null;
    paymentPaidOn: string | null;
  };
  student: { fullName: string | null; phone: string | null; email: string | null } | null;
  guardian: {
    fatherName: string | null;
    fatherPhone: string | null;
    motherName: string | null;
    motherPhone: string | null;
  } | null;
  courses: { subject: string; classCode: string }[];
  accesses: {
    sistemaLogin: string;
    sistemaPassword: string;
    sofiaLogin: string;
    sofiaPassword: string;
  } | null;
  draft: Record<string, unknown> | null;
};

type CourseRow = {
  key: string;
  classCode: string;
  moduleIndex: number;
  includeGroup: boolean;
};

const PAYMENT_FORMS = ["PIX", "Dinheiro", "Cartão", "Transferência", "Boleto", "Outro"];
const STATUS_LABELS: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
};

let rowSeq = 0;
const newKey = () => `row-${++rowSeq}`;

export default function MensagemPage() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Campos editáveis do montador
  const [modality, setModality] = useState("");
  const [incSistema, setIncSistema] = useState(true);
  const [incSofia, setIncSofia] = useState(true);
  const [incCoredacao, setIncCoredacao] = useState(true);
  const [sistemaLogin, setSistemaLogin] = useState("");
  const [sistemaPassword, setSistemaPassword] = useState("");
  const [sofiaLogin, setSofiaLogin] = useState("");
  const [sofiaPassword, setSofiaPassword] = useState("");
  const [rows, setRows] = useState<CourseRow[]>([]);

  // Pagamento
  const [payStatus, setPayStatus] = useState("");
  const [payMonth, setPayMonth] = useState("");
  const [payForm, setPayForm] = useState("");
  const [payPaidOn, setPayPaidOn] = useState("");
  const [savingPay, setSavingPay] = useState(false);
  const [payMsg, setPayMsg] = useState<string | null>(null);

  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  // Carrega lista de alunos para o seletor
  useEffect(() => {
    (async () => {
      setListLoading(true);
      const res = await fetch("/api/admin/enrollments");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
      setListLoading(false);
    })();
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    setPayMsg(null);
    const res = await fetch(`/api/admin/enrollments/${id}`);
    if (!res.ok) {
      setDetailLoading(false);
      return;
    }
    const d = (await res.json()) as Detail;
    setDetail(d);

    const enrollmentNumber = d.enrollment.enrollmentNumber || "";
    setModality(d.enrollment.modality || "");
    setIncSistema(true);
    setIncSofia(true);
    setIncCoredacao(true);
    setSistemaLogin(d.accesses?.sistemaLogin || enrollmentNumber);
    setSistemaPassword(d.accesses?.sistemaPassword || "");
    setSofiaLogin(d.accesses?.sofiaLogin || "");
    setSofiaPassword(d.accesses?.sofiaPassword || "123456");

    setRows(
      (d.courses || []).map((c) => ({
        key: newKey(),
        classCode: c.classCode,
        moduleIndex: 1,
        includeGroup: true,
      }))
    );

    setPayStatus(d.enrollment.paymentStatus || "");
    setPayMonth(d.enrollment.paymentMonth || "");
    setPayForm(d.enrollment.paymentForm || "");
    setPayPaidOn(
      d.enrollment.paymentPaidOn ? d.enrollment.paymentPaidOn.slice(0, 10) : ""
    );

    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const withName = items.filter((it) => it.student?.fullName);
    if (!q) return withName.slice(0, 50);
    return withName
      .filter((it) => {
        const name = (it.student?.fullName || "").toLowerCase();
        const num = (it.enrollment.enrollmentNumber || "").toLowerCase();
        const phone = (it.student?.phone || "").toLowerCase();
        return name.includes(q) || num.includes(q) || phone.includes(q);
      })
      .slice(0, 50);
  }, [items, search]);

  // Monta a mensagem em tempo real
  const message = useMemo(() => {
    if (!detail) return "";
    const courses: WelcomeCourse[] = rows.map((r) => {
      const info = getClassByCode(r.classCode);
      const mods = getClassModules(r.classCode);
      const mod = mods[r.moduleIndex - 1];
      return {
        subject: info?.subject || "redacao",
        classCode: r.classCode,
        moduleLabel: mod?.label,
        moduleDates: mod?.dates,
        includeGroup: r.includeGroup,
      };
    });
    return buildWelcomeMessage({
      studentName: detail.student?.fullName || "Aluno",
      enrollmentNumber: detail.enrollment.enrollmentNumber,
      modalityLabel: modality
        ? MODALITY_LABELS[modality as Modality] ?? modality
        : null,
      access: {
        includeSistema: incSistema,
        sistemaLogin,
        sistemaPassword,
        includeSofia: incSofia,
        sofiaLogin,
        sofiaPassword,
        includeCoredacao: incCoredacao,
      },
      courses,
      payment: {
        monthLabel: monthLabel(payMonth),
        form: payForm,
        paidOnLabel: dayLabel(payPaidOn),
        statusLabel: payStatus ? STATUS_LABELS[payStatus] : "",
        nextDueLabel: nextDueLabel(payMonth),
      },
    });
  }, [
    detail,
    rows,
    modality,
    incSistema,
    incSofia,
    incCoredacao,
    sistemaLogin,
    sistemaPassword,
    sofiaLogin,
    sofiaPassword,
    payMonth,
    payForm,
    payPaidOn,
    payStatus,
  ]);

  const savePayment = async () => {
    if (!selectedId) return;
    setSavingPay(true);
    setPayMsg(null);
    const res = await fetch(`/api/admin/enrollments/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modality: modality || null,
        paymentStatus: payStatus || null,
        paymentMonth: payMonth || null,
        paymentForm: payForm || null,
        paymentPaidOn: payPaidOn || null,
      }),
    });
    setSavingPay(false);
    setPayMsg(res.ok ? "Pagamento salvo no cadastro" : "Falha ao salvar");
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopyMsg("Mensagem copiada!");
      setTimeout(() => setCopyMsg(null), 2500);
    } catch {
      setCopyMsg("Não foi possível copiar");
    }
  };

  const studentWa = waLink(detail?.student?.phone, message);
  const principalPhone =
    detail?.guardian?.motherPhone || detail?.guardian?.fatherPhone || null;
  const principalName =
    detail?.guardian?.motherName || detail?.guardian?.fatherName || null;
  const guardianWa = waLink(principalPhone, message);

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { key: newKey(), classCode: CLASSES[0].code, moduleIndex: 1, includeGroup: true },
    ]);

  const updateRow = (key: string, patch: Partial<CourseRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const removeRow = (key: string) =>
    setRows((prev) => prev.filter((r) => r.key !== key));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Mensagem de boas-vindas
        </h1>
        <p className="mt-1 text-sm text-muted">
          Selecione o aluno, ajuste os dados e envie os acessos, grupo, datas e
          pagamento de forma personalizada no WhatsApp.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Seletor de aluno */}
        <Section title="Aluno" className="h-fit">
          <input
            className={inputAdminClass()}
            placeholder="Buscar por nome, matrícula ou telefone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-3 max-h-[420px] space-y-1 overflow-y-auto">
            {listLoading ? (
              <p className="py-4 text-center text-sm text-muted">Carregando…</p>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                Nenhum aluno encontrado.
              </p>
            ) : (
              filtered.map((it) => {
                const active = it.enrollment.id === selectedId;
                return (
                  <button
                    key={it.enrollment.id}
                    type="button"
                    onClick={() => setSelectedId(it.enrollment.id)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-brand text-white"
                        : "hover:bg-bg-subtle text-ink"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {it.student?.fullName}
                    </span>
                    <span
                      className={`block text-xs ${active ? "text-white/80" : "text-muted"}`}
                    >
                      {it.enrollment.enrollmentNumber || "sem matrícula"}
                      {it.student?.phone ? ` · ${it.student.phone}` : ""}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Section>

        {/* Montador */}
        <div className="space-y-4">
          {!selectedId ? (
            <Section title="Comece escolhendo um aluno">
              <p className="text-sm text-muted">
                Selecione um aluno na lista ao lado. Os campos abaixo serão
                preenchidos automaticamente com o que já está cadastrado.
              </p>
            </Section>
          ) : detailLoading || !detail ? (
            <Section title="Carregando…">
              <p className="text-sm text-muted">Buscando dados do aluno…</p>
            </Section>
          ) : (
            <>
              {/* Acessos */}
              <Section title="Acessos">
                <div className="space-y-4">
                  {/* Sistema */}
                  <div className="rounded-xl border border-line bg-bg-subtle p-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-ink">
                      <input
                        type="checkbox"
                        checked={incSistema}
                        onChange={(e) => setIncSistema(e.target.checked)}
                        className="h-4 w-4 accent-[var(--brand)]"
                      />
                      Sistema (aluno)
                    </label>
                    <p className="mt-1 text-xs text-muted">{PLATFORM_LINKS.sistema}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-muted">
                        Login (nº de matrícula)
                        <input
                          className={`${inputAdminClass()} mt-1 font-mono text-[13px]`}
                          value={sistemaLogin}
                          onChange={(e) => setSistemaLogin(e.target.value)}
                        />
                      </label>
                      <label className="text-xs font-semibold text-muted">
                        Senha
                        <input
                          className={`${inputAdminClass()} mt-1 font-mono text-[13px]`}
                          value={sistemaPassword}
                          onChange={(e) => setSistemaPassword(e.target.value)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Sofia */}
                  <div className="rounded-xl border border-line bg-bg-subtle p-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-ink">
                      <input
                        type="checkbox"
                        checked={incSofia}
                        onChange={(e) => setIncSofia(e.target.checked)}
                        className="h-4 w-4 accent-[var(--brand)]"
                      />
                      Plataforma Sofia
                    </label>
                    <p className="mt-1 text-xs text-muted">{PLATFORM_LINKS.sofia}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-muted">
                        Login / e-mail
                        <input
                          className={`${inputAdminClass()} mt-1 font-mono text-[13px]`}
                          value={sofiaLogin}
                          onChange={(e) => setSofiaLogin(e.target.value)}
                          placeholder="preencha o acesso Sofia"
                        />
                      </label>
                      <label className="text-xs font-semibold text-muted">
                        Senha
                        <input
                          className={`${inputAdminClass()} mt-1 font-mono text-[13px]`}
                          value={sofiaPassword}
                          onChange={(e) => setSofiaPassword(e.target.value)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Coredação */}
                  <div className="rounded-xl border border-line bg-bg-subtle p-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-ink">
                      <input
                        type="checkbox"
                        checked={incCoredacao}
                        onChange={(e) => setIncCoredacao(e.target.checked)}
                        className="h-4 w-4 accent-[var(--brand)]"
                      />
                      Coredação
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                        padrão p/ todos
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-muted">{PLATFORM_LINKS.coredacao}</p>
                    <p className="mt-2 font-mono text-[13px] text-ink-soft">
                      {COREDACAO_DEFAULT.email} · {COREDACAO_DEFAULT.password}
                    </p>
                  </div>
                </div>
              </Section>

              {/* Turmas, grupo e datas */}
              <Section
                title="Turmas, grupo e datas"
                action={
                  <button type="button" onClick={addRow} className={btnGhostClass()}>
                    + Adicionar turma
                  </button>
                }
              >
                {rows.length === 0 ? (
                  <p className="text-sm text-muted">
                    Nenhuma turma. Clique em “Adicionar turma”.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rows.map((r) => {
                      const mods = getClassModules(r.classCode);
                      const info = getClassByCode(r.classCode);
                      return (
                        <div
                          key={r.key}
                          className="rounded-xl border border-line bg-bg-subtle p-4"
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-muted">
                              Turma
                              <select
                                className={`${inputAdminClass()} mt-1`}
                                value={r.classCode}
                                onChange={(e) =>
                                  updateRow(r.key, {
                                    classCode: e.target.value,
                                    moduleIndex: 1,
                                  })
                                }
                              >
                                {CLASSES.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.code} — {SUBJECT_LABELS[c.subject as Subject]} ·{" "}
                                    {c.day} {c.schedule}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-xs font-semibold text-muted">
                              Módulo (4 encontros)
                              <select
                                className={`${inputAdminClass()} mt-1`}
                                value={r.moduleIndex}
                                onChange={(e) =>
                                  updateRow(r.key, {
                                    moduleIndex: Number(e.target.value),
                                  })
                                }
                                disabled={mods.length === 0}
                              >
                                {mods.length === 0 ? (
                                  <option value={1}>Sem calendário</option>
                                ) : (
                                  mods.map((m) => (
                                    <option key={m.index} value={m.index}>
                                      {m.label} — {m.dates.join(", ")}
                                    </option>
                                  ))
                                )}
                              </select>
                            </label>
                          </div>
                          {info && (
                            <p className="mt-2 text-xs text-muted">
                              {SUBJECT_LABELS[info.subject]} · {info.day} ·{" "}
                              {info.schedule}
                            </p>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                              <input
                                type="checkbox"
                                checked={r.includeGroup}
                                onChange={(e) =>
                                  updateRow(r.key, { includeGroup: e.target.checked })
                                }
                                className="h-4 w-4 accent-[var(--brand)]"
                              />
                              Incluir link do grupo de avisos
                            </label>
                            <button
                              type="button"
                              onClick={() => removeRow(r.key)}
                              className="text-xs font-semibold text-danger hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* Modalidade e pagamento */}
              <Section
                title="Modalidade e pagamento"
                action={
                  <button
                    type="button"
                    onClick={savePayment}
                    disabled={savingPay}
                    className={btnPrimaryClass()}
                  >
                    {savingPay ? "Salvando…" : "Salvar no cadastro"}
                  </button>
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-xs font-semibold text-muted">
                    Modalidade
                    <select
                      className={`${inputAdminClass()} mt-1`}
                      value={modality}
                      onChange={(e) => setModality(e.target.value)}
                    >
                      <option value="">—</option>
                      {(Object.keys(MODALITY_LABELS) as Modality[]).map((m) => (
                        <option key={m} value={m}>
                          {MODALITY_LABELS[m]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-muted">
                    Mês de referência
                    <input
                      type="month"
                      className={`${inputAdminClass()} mt-1`}
                      value={payMonth}
                      onChange={(e) => setPayMonth(e.target.value)}
                    />
                  </label>
                  <label className="text-xs font-semibold text-muted">
                    Situação
                    <select
                      className={`${inputAdminClass()} mt-1`}
                      value={payStatus}
                      onChange={(e) => setPayStatus(e.target.value)}
                    >
                      <option value="">—</option>
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                      <option value="atrasado">Atrasado</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-muted">
                    Como pagou
                    <select
                      className={`${inputAdminClass()} mt-1`}
                      value={payForm}
                      onChange={(e) => setPayForm(e.target.value)}
                    >
                      <option value="">—</option>
                      {PAYMENT_FORMS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-muted">
                    Dia que pagou
                    <input
                      type="date"
                      className={`${inputAdminClass()} mt-1`}
                      value={payPaidOn}
                      onChange={(e) => setPayPaidOn(e.target.value)}
                    />
                  </label>
                  <div className="text-xs font-semibold text-muted">
                    Próximo vencimento
                    <div className="mt-1 flex min-h-[44px] items-center rounded-xl border border-dashed border-line-strong bg-white px-3 text-sm font-bold text-brand">
                      {nextDueLabel(payMonth) || "informe o mês"}
                    </div>
                  </div>
                </div>
                {payMsg && (
                  <p
                    className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
                      payMsg.includes("salvo")
                        ? "bg-success-soft text-success"
                        : "bg-danger-soft text-danger"
                    }`}
                    role="status"
                  >
                    {payMsg}
                  </p>
                )}
              </Section>

              {/* Prévia + envio */}
              <Section title="Prévia da mensagem">
                <textarea
                  className={`${inputAdminClass()} min-h-[320px] font-mono text-[13px] leading-relaxed`}
                  value={message}
                  readOnly
                />
                {copyMsg && (
                  <p className="mt-2 text-sm font-medium text-success" role="status">
                    {copyMsg}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={copyMessage} className={btnGhostClass()}>
                    Copiar mensagem
                  </button>
                  {studentWa && (
                    <a
                      href={studentWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-xs)] transition hover:brightness-105"
                    >
                      WhatsApp do aluno
                    </a>
                  )}
                  {guardianWa && (
                    <a
                      href={guardianWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#128C7E] px-4 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-xs)] transition hover:brightness-105"
                    >
                      WhatsApp do responsável
                      {principalName ? ` (${principalName.split(" ")[0]})` : ""}
                    </a>
                  )}
                </div>
                {!studentWa && !guardianWa && (
                  <p className="mt-3 text-xs text-muted">
                    Sem telefone cadastrado — use “Copiar mensagem”.
                  </p>
                )}
              </Section>
            </>
          )}

          <Link
            href="/admin/dashboard"
            className="inline-block text-sm font-semibold text-brand hover:underline"
          >
            ← Voltar às matrículas
          </Link>
        </div>
      </div>
    </div>
  );
}
